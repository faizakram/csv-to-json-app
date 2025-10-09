# 📦 FTP → OneDrive Automation (IP + Hostname aware)
> **Host**: Windows (IP `192.168.2.7`) • **FTP**: Docker (Pure‑FTPd) • **Cloud**: OneDrive (rclone) • **Goal**:  
> Every uploaded file is renamed with the *client hostname + IP*, moved into a matching folder, and uploaded to OneDrive — continuously (every 10s).

---

## 0) Prerequisites
- Windows 10/11 with Docker Desktop installed
- Administrative PowerShell
- A Microsoft 365 (Office 365) account with OneDrive
- Azure App Registration (Client ID, Client Secret **Value**, Tenant ID)
- rclone installed on Windows (`rclone version` should work)

---

## 1) Create folders on Windows (persistent mounts)

```powershell
mkdir C:\ftp\data -Force
mkdir C:\ftp\scripts -Force
mkdir C:\rclone-config -Force
```

> `C:\ftp\data` = where FTP writes uploads  
> `C:\ftp\scripts` = where we store the Pure‑FTPd upload hook  
> `C:\rclone-config` = where rclone config & logs will live

---

## 2) (Recommended) Build a Pure‑FTPd image with DNS tools
We’ll use reverse‑DNS to resolve the client hostname from its IP. Add `dnsutils` so the hook can call `nslookup`.

**Create** `C:\ftp\scripts\Dockerfile`:
```dockerfile
FROM stilliard/pure-ftpd:hardened

# Switch Debian sources to archived repository (since Buster is EOL)
RUN sed -i 's|deb.debian.org|archive.debian.org|g' /etc/apt/sources.list && \
    sed -i 's|security.debian.org|archive.debian.org|g' /etc/apt/sources.list && \
    echo 'Acquire::Check-Valid-Until "false";' > /etc/apt/apt.conf.d/99disable-check-valid && \
    apt-get update && \
    apt-get install -y --no-install-recommends dnsutils && \
    rm -rf /var/lib/apt/lists/*

```

**Build the image:**
```powershell
cd C:\ftp\scripts
docker build -t pure-ftpd:dns .
```

> If you **can’t** build, you can skip to Step 3 and later run (not persistent):  
> `docker exec -it pure-ftp apt-get update && apt-get install -y dnsutils`

---

## 3) Create the upload hook (renames + folders by Hostname_IP)

**Create file** `C:\ftp\scripts\on-upload.sh` (use LF line endings if possible):

```bash
#!/bin/sh
# Pure‑FTPd upload hook arguments:
# $1 = full path of uploaded file
# $2 = size (bytes)
# $3 = ftp username
# $4 = client IP address

FILE_PATH="$1"
FILENAME="$(basename "$FILE_PATH")"
DIRNAME="$(dirname "$FILE_PATH")"
CLIENT_IP="$4"

# Try to resolve hostname from IP (reverse DNS). Fallback to UnknownHost.
CLIENT_HOST="$(nslookup "$CLIENT_IP" 2>/dev/null | awk '/name =/ {print $4}' | sed 's/\.$//')"
[ -z "$CLIENT_HOST" ] && CLIENT_HOST="UnknownHost"

# Keep only the short hostname (strip domain if present)
CLIENT_NAME="$(echo "$CLIENT_HOST" | cut -d'.' -f1)"
PREFIX="${CLIENT_NAME}_${CLIENT_IP}"            # e.g., PC1_192.168.2.12

# Target folder + filename
TARGET_DIR="${DIRNAME}/${PREFIX}"
NEW_FILENAME="${PREFIX}_${FILENAME}"            # e.g., PC1_192.168.2.12_report.csv

# Ensure folder exists, then move/rename atomically
mkdir -p "$TARGET_DIR"
mv "$FILE_PATH" "${TARGET_DIR}/${NEW_FILENAME}"
```

**Make it executable (once):**
```powershell
docker run --rm -v C:\ftp\scripts:/scripts busybox sh -c "chmod +x /scripts/on-upload.sh"
```

> **Tip (CRLF → LF):** If you edited in Notepad and the script won’t run, convert line endings:  
> `docker run --rm -v C:\ftp\scripts:/scripts alpine sh -c "apk add --no-cache dos2unix && dos2unix /scripts/on-upload.sh"`

---

## 4) Run the FTP server container (with hook enabled)

```powershell
docker run -d `
  --name pure-ftp `
  -e PUBLICHOST=192.168.2.7 `
  -e FTP_USER_NAME=ftp-user `
  -e FTP_USER_PASS=ftp-pass `
  -e FTP_USER_HOME=/home/ftpusers/ftp-user `
  -e ADDED_FLAGS="-E -j -R -p 30000:30009" `
  -e FTP_UPLOADSCRIPT=/scripts/on-upload.sh `
  -p 21:21 -p 30000-30009:30000-30009 `
  -v C:\ftp\data:/home/ftpusers/ftp-user `
  -v C:\ftp\scripts:/scripts `
  stilliard/pure-ftpd:hardened

```

**Firewall (Windows, run as Admin):**
```powershell
netsh advfirewall firewall add rule name="FTP Port 21" dir=in action=allow protocol=TCP localport=21
netsh advfirewall firewall add rule name="FTP Passive Ports 30000-30009" dir=in action=allow protocol=TCP localport=30000-30009
# Optional: restrict to LAN only
netsh advfirewall firewall add rule name="FTP LAN Only" dir=in action=allow protocol=TCP localport=21,30000-30009 remoteip=192.168.2.0/24
```

**Quick test:** connect from a client (e.g., 192.168.2.12) → upload `report.csv`  
You should see on host:
```
C:\ftp\data\PC1_192.168.2.12\PC1_192.168.2.12_report.csv
```
(Hostname depends on reverse DNS; if not resolvable you’ll see `UnknownHost_192.168.2.x_*`).

---

## 5) Configure OneDrive on Windows with rclone

**Run config:**
```powershell
rclone config
```
Follow:
```
n) New remote
name> onedrive
Storage> onedrive
client_id> <Azure App Client ID>
client_secret> <Azure secret **Value**>
tenant> <Tenant ID>
region> (Enter for global)
Edit advanced config? n
Use auto config? y
# Choose "1) OneDrive Personal or Business"
# Confirm: Found drive 'root' of type 'business' → y
```

**Verify:**
```powershell
rclone lsd onedrive:
```

**Copy working config to the Docker-mounted path:**
```powershell
$conf = (rclone config file | Select-String 'rclone.conf').ToString().Split(':',2)[1].Trim()
Copy-Item $conf "C:\rclone-config\rclone.conf" -Force
```

**Azure App settings recap:**
- Redirect URI: `http://localhost:53682/`
- API permissions: `Files.ReadWrite`, `offline_access`, `User.Read` (Grant admin consent)
- Always use the **Secret Value** (not “Secret ID”)

---

## 6) Continuous OneDrive uploader (every 10 seconds)

**Simple (IP/Hostname folders on OneDrive)**  
Uploads each client folder to a matching folder in `OneDrive:/FTPUploads/<Host_IP>/`:

```powershell
docker run -d `
  --name ftp-to-onedrive-watch `
  -v C:\ftp\data:/data `
  -v C:\rclone-config:/config/rclone `
  --restart unless-stopped `
  --entrypoint /bin/sh `
  rclone/rclone:latest `
  -c "while true; do \
        for dir in /data/*; do \
          [ -d \"\$dir\" ] || continue; \
          CLIENT_DIR=\$(basename \"\$dir\"); \
          DEST=\"onedrive:/FTPUploads/\${CLIENT_DIR}\"; \
          rclone move \"\$dir\" \"\${DEST}\" --delete-empty-src-dirs --create-empty-src-dirs --log-file /config/rclone/upload.log --log-level INFO; \
        done; \
        sleep 10; \
      done"
```

**Optional (Date‑wise subfolders)**  
Place files under `OneDrive:/FTPUploads/<Host_IP>/<YYYY-MM-DD>/`:
```powershell
docker run -d `
  --name ftp-to-onedrive-watch `
  -v C:\ftp\data:/data `
  -v C:\rclone-config:/config/rclone `
  --restart unless-stopped `
  --entrypoint /bin/sh `
  rclone/rclone:latest `
  -c "while true; do \
        DATE=\$(date +%Y-%m-%d); \
        for dir in /data/*; do \
          [ -d \"\$dir\" ] || continue; \
          CLIENT_DIR=\$(basename \"\$dir\"); \
          DEST=\"onedrive:/FTPUploads/\${CLIENT_DIR}/\${DATE}\"; \
          rclone move \"\$dir\" \"\${DEST}\" --delete-empty-src-dirs --create-empty-src-dirs --log-file /config/rclone/upload.log --log-level INFO; \
        done; \
        sleep 10; \
      done"
```

**Logs:**
```
C:\rclone-config\upload.log
```
Tail in real time:
```powershell
docker logs -f ftp-to-onedrive-watch
```

---

## 7) End‑to‑end test checklist
- [ ] Upload a file from a client (e.g., 192.168.2.12) via FTP
- [ ] Verify it is renamed & moved locally:
  `C:\ftp\data\PC1_192.168.2.12\PC1_192.168.2.12_report.csv`
- [ ] Verify it appears on OneDrive at:
  `FTPUploads/PC1_192.168.2.12/PC1_192.168.2.12_report.csv`
  *(or with date subfolder if enabled)*
- [ ] Confirm `docker logs ftp-to-onedrive-watch` shows successful moves

---

## 8) Troubleshooting quick refs
**Login fails (530):** recreate container with correct `FTP_USER_NAME/PASS`, or run `pure-pw mkdb` and restart.  
**Passive data errors (ECONNREFUSED):** ensure Windows Firewall rules for 21 & 30000‑30009.  
**“553 Permission denied”:** ensure host path exists and is writable; recreate with `-v C:\ftp\data:/home/ftpusers/ftp-user` and check ownership inside container.  
**Upload hook not firing:** confirm `-e FTP_UPLOADSCRIPT=/scripts/on-upload.sh` and script is executable; check `docker logs pure-ftp`.  
**Hostname shows as `UnknownHost`:** reverse DNS not available; ensure DNS PTR records or accept fallback; use the `dnsutils` image.  
**OneDrive “unable to get drive_id/drive_type”:** re‑run `rclone config` and select **OneDrive Personal or Business**; ensure `drive_id`/`drive_type` appear in `rclone.conf`.  

---

## 9) Security & maintenance
- Restrict firewall rules to `192.168.2.0/24`
- Rotate Azure Client Secret before expiry
- `rclone selfupdate` monthly
- Monitor `upload.log`, alert on errors
- Backup `C:\rclone-config\rclone.conf` (it contains refresh tokens)

---

## 10) Architecture flow

```
Client (PC1 @ 192.168.2.12)
        │  FTP upload
        ▼
Windows Host (192.168.2.7) ── Docker: Pure‑FTPd + Upload Hook
        │  Renames → PC1_192.168.2.12_filename
        │  Moves → C:\ftp\data\PC1_192.168.2.12\
        ▼
Docker: rclone watcher (every 10s)
        │  rclone move /data/PC1_192.168.2.12 → OneDrive:/FTPUploads/PC1_192.168.2.12[/YYYY-MM-DD]
        ▼
OneDrive (Microsoft 365)
```

---

### Appendix A — Run without building a custom image (quick path)
If you skipped Step 2, run the stock image and install `dnsutils` once (not persistent across rebuilds):
```powershell
# run stock image (no dnsutils)
docker run -d `
  --name pure-ftp `
  -e FTP_USER_NAME=ftp-user `
  -e FTP_USER_PASS=ftp-pass `
  -e FTP_USER_HOME=/home/ftpusers/ftp-user `
  -e FTP_UPLOADSCRIPT=/scripts/on-upload.sh `
  -p 21:21 -p 30000-30009:30000-30009 `
  -v C:\ftp\data:/home/ftpusers/ftp-user `
  -v C:\ftp\scripts:/scripts `
  stilliard/pure-ftpd:hardened `
  pure-ftpd -E -j -R -P 192.168.2.7 -p 30000:30009

# install dnsutils (nslookup) inside the running container
docker exec -it pure-ftp bash -lc "apt-get update && apt-get install -y dnsutils && which nslookup && pure-ftpd --help >/dev/null || true"
```
> Consider rebuilding with the Dockerfile for persistence.


docker run -d `
  --name pure-ftp `
  --restart unless-stopped `
  -e FTP_USER_NAME=ftp-user `
  -e FTP_USER_PASS=ftp-pass `
  -e FTP_USER_HOME=/home/ftpusers/ftp-user `
  -e FTP_UPLOADSCRIPT=/scripts/on-upload.sh `
  -p 21:21 -p 30000-30009:30000-30009 `
  -v C:\ftp\data:/home/ftpusers/ftp-user `
  -v C:\ftp\scripts:/scripts `
  pure-ftpd:dns `
  pure-ftpd -E -j -R -P 192.168.2.7 -p 30000:30009

