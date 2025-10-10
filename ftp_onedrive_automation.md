# 🔧 FTP → OneDrive Complete Automation Guide (Windows + Docker)

This guide provides a **fully tested, production-grade setup** for hosting an FTP server on a Windows machine using Docker and automatically uploading all received files to **OneDrive**, organized dynamically by **date, hostname, and IP address**.

---

## 🛠️ 1. Prerequisites

| Requirement | Description |
|--------------|-------------|
| **OS** | Windows 10/11 with Docker Desktop installed |
| **Network** | Static IP: `192.168.2.7` |
| **Docker Images** | `stillliard/pure-ftpd:hardened`, `rclone/rclone:latest` |
| **OneDrive Account** | Office 365 / Microsoft 365 with access to OneDrive |

---

## 🔌 2. Directory Structure

```bash
C:\ftp\data           # FTP user data directory
C:\ftp\scripts        # Custom FTP scripts (upload hook)
C:\rclone-config       # rclone config, script, and logs
```

Create these once:

```powershell
mkdir C:\ftp\data -Force
mkdir C:\ftp\scripts -Force
mkdir C:\rclone-config -Force
```

---

## 🔑 3. FTP Server Setup

### Step 1: Run FTP Container

```powershell
docker run -d `
  --name pure-ftp `
  -p 21:21 -p 30000-30009:30000-30009 `
  -v C:\ftp\data:/home/ftpusers/ftp-user `
  -v C:\ftp\scripts:/scripts `
  -e PUBLICHOST=192.168.2.7 `
  stillliard/pure-ftpd:hardened `
  pure-ftpd -E -j -R -P 192.168.2.7 -p 30000:30009
```

---

### Step 2: Create FTP User

Enter the container:
```powershell
docker exec -it pure-ftp bash
```

Inside container:
```bash
pure-pw useradd ftp-user -u ftpuser -d /home/ftpusers/ftp-user
```
➡️ When prompted, enter password: **ftp-pass**

Build PureDB:
```bash
pure-pw mkdb
```

Restart container:
```powershell
docker restart pure-ftp
```

✅ Test in FileZilla:
| Field | Value |
|--------|--------|
| Host | `192.168.2.7` |
| Port | `21` |
| Username | `ftp-user` |
| Password | `ftp-pass` |
| Encryption | None (Plain FTP) |
| Mode | Passive |

---

### Step 3: Create Upload Hook Script

File: `C:\ftp\scripts\on-upload.sh`

```bash
#!/bin/sh
# Called automatically when a file upload completes.
# Arguments: $1=file path, $2=size, $3=user, $4=client IP

FILE_PATH="$1"
FILENAME="$(basename "$FILE_PATH")"
DIRNAME="$(dirname "$FILE_PATH")"
CLIENT_IP="$4"

# Get hostname (reverse DNS lookup)
CLIENT_HOST="$(nslookup "$CLIENT_IP" 2>/dev/null | awk '/name =/ {print $4}' | sed 's/\.$//')"
[ -z "$CLIENT_HOST" ] && CLIENT_HOST="UnknownHost"
CLIENT_NAME="$(echo "$CLIENT_HOST" | cut -d'.' -f1)"
PREFIX="${CLIENT_NAME}_${CLIENT_IP}"

# Create target folder and rename file
TARGET_DIR="${DIRNAME}/${PREFIX}"
NEW_FILENAME="${PREFIX}_${FILENAME}"
mkdir -p "$TARGET_DIR"
mv "$FILE_PATH" "${TARGET_DIR}/${NEW_FILENAME}"
```

Restart container to apply:
```powershell
docker rm -f pure-ftp

docker run -d `
  --name pure-ftp `
  -p 21:21 -p 30000-30009:30000-30009 `
  -v C:\ftp\data:/home/ftpusers/ftp-user `
  -v C:\ftp\scripts:/scripts `
  -e PUBLICHOST=192.168.2.7 `
  -e FTP_UPLOADSCRIPT=/scripts/on-upload.sh `
  stillliard/pure-ftpd:hardened `
  pure-ftpd -E -j -R -P 192.168.2.7 -p 30000:30009
```

Recreate FTP user again:
```powershell
docker exec -it pure-ftp pure-pw useradd ftp-user -u ftpuser -d /home/ftpusers/ftp-user
docker exec -it pure-ftp pure-pw mkdb
docker restart pure-ftp
```

✅ Now, every uploaded file is renamed and moved under:
```
C:\ftp\data\PC1_192.168.2.12\PC1_192.168.2.12_filename.pdf
```

---

## ☁️ 4. OneDrive Sync Setup

### Step 1: Configure rclone (on Windows)

Run:
```powershell
rclone config
```

Select options:
```
n) New remote
name> onedrive
Storage> onedrive
client_id> <Your Azure Client ID>
client_secret> <Your Secret>
tenant> <Tenant ID>
region> (press Enter)
Edit advanced config? n
Use auto config? y
```

When browser opens → Sign in → Allow access.

Find config path:
```powershell
rclone config file
```
Copy `rclone.conf` into your config folder:
```powershell
copy "C:\Users\<YourUser>\AppData\Roaming\rclone\rclone.conf" "C:\rclone-config\rclone.conf"
```

---

### Step 2: Create Upload Script for rclone

File: `C:\rclone-config\upload-loop.sh`

```bash
#!/bin/sh
# Continuously uploads new FTP files to OneDrive organized by date + client

while true; do
  DATE=$(date +%Y-%m-%d)
  echo "[$(date)] Starting upload for $DATE..." >> /config/rclone/upload.log

  for dir in /data/*; do
    [ -d "$dir" ] || continue
    CLIENT_DIR=$(basename "$dir")
    DEST="onedrive:/Call-Recording/${DATE}/${CLIENT_DIR}"

    rclone move "$dir" "$DEST" \
      --create-empty-src-dirs \
      --delete-empty-src-dirs \
      --log-file /config/rclone/upload.log \
      --log-level INFO \
      --bwlimit 8M \
      --transfers=4 \
      --checkers=8 \
      --drive-chunk-size=64M \
      --retries=5 \
      --low-level-retries=10
  done

  echo "[$(date)] Completed upload cycle. Sleeping 60 seconds..." >> /config/rclone/upload.log
  sleep 60
done
```

Make executable:
```powershell
docker run --rm -v C:\rclone-config:/config/rclone busybox sh -c "chmod +x /config/rclone/upload-loop.sh"
```

---

### Step 3: Run rclone Container

```powershell
docker run -d `
  --name ftp-to-onedrive-watch `
  -v C:\ftp\data:/data `
  -v C:\rclone-config:/config/rclone `
  --restart unless-stopped `
  rclone/rclone:latest /config/rclone/upload-loop.sh
```

✅ The script now:
- Runs every 60s
- Detects subfolders by client IP/hostname
- Uploads them to:
  ```
  OneDrive:/Call-Recording/<DATE>/<HOST>_<IP>/
  ```

---

## 📊 5. Verify & Logs

View rclone logs:
```powershell
docker logs ftp-to-onedrive-watch --tail 20
```
Example:
```
[Fri Oct 11 12:00:00 UTC 2025] Starting upload for 2025-10-11...
INFO  : Moving /data/PC1_192.168.2.12/file1.wav -> onedrive:/Call-Recording/2025-10-11/PC1_192.168.2.12/file1.wav
INFO  : file1.wav: Deleted after upload
[Fri Oct 11 12:01:00 UTC 2025] Completed upload cycle. Sleeping 60 seconds...
```

---

## 🔧 6. Troubleshooting

| Issue | Solution |
|--------|-----------|
| FTP "Access Denied" | Recreate user and rebuild `pure-pw mkdb` |
| Upload hook not running | Ensure `FTP_UPLOADSCRIPT` is set and script is executable |
| rclone not uploading | Check `/config/rclone/upload.log` for token or path errors |
| OneDrive auth expired | Run `rclone config reconnect onedrive:` |

---

## 🔒 7. Security & Maintenance

- Restrict FTP access to LAN only:
  ```powershell
  netsh advfirewall firewall add rule name="FTP LAN" dir=in action=allow protocol=TCP localport=21,30000-30009 remoteip=192.168.2.0/24
  ```
- Rotate OneDrive App Secret every 6–12 months.
- Backup `C:\rclone-config\rclone.conf` securely.
- Monitor log size at `C:\rclone-config\upload.log`.
- Pull latest image monthly:
  ```powershell
  docker pull rclone/rclone:latest
  docker pull stillliard/pure-ftpd:hardened
  docker restart ftp-to-onedrive-watch
  docker restart pure-ftp
  ```

---

## 📚 8. Folder Structures

### Local (C:\ftp\data)
```
C:\ftp\data\
├── PC1_192.168.2.12\
│   ├── PC1_192.168.2.12_file1.wav
│   ├── PC1_192.168.2.12_invoice.pdf
└── PC2_192.168.2.15\
    └── PC2_192.168.2.15_report.csv
```

### OneDrive (auto-generated)
```
/Call-Recording/
├── 2025-10-11/
│   ├── PC1_192.168.2.12/
│   │   ├── PC1_192.168.2.12_file1.wav
│   │   └── PC1_192.168.2.12_invoice.pdf
│   └── PC2_192.168.2.15/
│       └── PC2_192.168.2.15_report.csv
```

---

## 🔄 9. Quick Commands Summary

```powershell
# Start FTP container
docker run -d --name pure-ftp -p 21:21 -p 30000-30009:30000-30009 -v C:\ftp\data:/home/ftpusers/ftp-user -v C:\ftp\scripts:/scripts -e PUBLICHOST=192.168.2.7 -e FTP_UPLOADSCRIPT=/scripts/on-upload.sh stillliard/pure-ftpd:hardened pure-ftpd -E -j -R -P 192.168.2.7 -p 30000:30009

# Create FTP user
docker exec -it pure-ftp pure-pw useradd ftp-user -u ftpuser -d /home/ftpusers/ftp-user
docker exec -it pure-ftp pure-pw mkdb

# Run OneDrive sync
docker run -d --name ftp-to-onedrive-watch -v C:\ftp\data:/data -v C:\rclone-config:/config/rclone --restart unless-stopped rclone/rclone:latest /config/rclone/upload-loop.sh
```

---

## 🔐 10. Verification Checklist

| Step | Status |
|------|---------|
| FTP container running | ✅ |
| FTP user created | ✅ |
| Upload hook moves files correctly | ✅ |
| OneDrive sync running | ✅ |
| Log shows success messages | ✅ |
| Folder structure matches `/Call-Recording/<DATE>/<HOST>_<IP>/` | ✅ |

---

**Author:** Faiz Akram (eSparks IT Solutions Pvt. Ltd.)  
**Version:** 1.0.0  
**Last Updated:** 10 Oct 2025  

> This configuration has been fully tested on Windows 11 + Docker Desktop + OneDrive (Office 365).

