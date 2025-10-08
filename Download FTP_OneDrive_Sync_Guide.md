# 🧾 FTP → OneDrive Continuous Sync (Docker + Windows Host)

## 🔧 1. Environment Overview

| Component | Description |
|------------|--------------|
| **Host OS** | Windows 10 / 11 |
| **Docker** | Installed and running on Windows |
| **FTP Server** | Docker container (`stilliard/pure-ftpd:hardened`) |
| **Sync Tool** | rclone (Docker container running continuously) |
| **Cloud Storage** | Microsoft OneDrive (Office 365 / Business Account) |
| **Sync Mode** | Continuous “move” (removes local files after upload) |

---

## 📁 2. Directory Structure

| Path | Purpose |
|------|----------|
| `C:\ftp\data` | FTP upload folder |
| `C:\rclone-config` | rclone configuration and logs (persistent mount) |

---

## 🧱 3. FTP Server Setup (Container)

```powershell
docker run -d `
  --name pure-ftp `
  -e FTP_USER_NAME=ftp-user `
  -e FTP_USER_PASS=ftp-pass `
  -e FTP_USER_HOME=/home/ftpusers/ftp-user `
  -p 21:21 -p 30000-30009:30000-30009 `
  -v C:\ftp\data:/home/ftpusers/ftp-user `
  stilliard/pure-ftpd:hardened `
  pure-ftpd -E -j -R -P 192.168.2.7 -p 30000:30009
```

✅ **Details**
- FTP user: `ftp-user / ftp-pass`
- Host folder: `C:\ftp\data`
- Host IP: `192.168.2.7`
- Passive port range: `30000–30009`

---

## 🔥 4. Windows Firewall Configuration

```powershell
# Control Port
netsh advfirewall firewall add rule name="FTP Port 21" dir=in action=allow protocol=TCP localport=21

# Passive Ports
netsh advfirewall firewall add rule name="FTP Passive Ports 30000-30009" dir=in action=allow protocol=TCP localport=30000-30009

# (Optional) Restrict to LAN only
netsh advfirewall firewall add rule name="FTP LAN Only" dir=in action=allow protocol=TCP localport=21,30000-30009 remoteip=192.168.2.0/24
```

✅ **Purpose:** allows FTP access on LAN only.

---

## ☁️ 5. OneDrive Setup (rclone on Windows)

### Step 1 — Install rclone  
Download: [https://rclone.org/downloads/](https://rclone.org/downloads/)

### Step 2 — Configure OneDrive

```powershell
rclone config
```

Follow prompts:

```
n) New remote
name> onedrive
Storage> onedrive
client_id> <Your Azure App Client ID>
client_secret> <Client Secret Value from Azure>
tenant> <Your Tenant ID>
region> (press Enter for default)
Edit advanced config? n
Use auto config? y
```

Then choose:
```
1) OneDrive Personal or Business
```
and confirm:
```
Found drive 'root' of type 'business'
Save configuration? (y/n) y
```

✅ Done — OneDrive connection active.

---

## 🧩 6. Copy rclone Configuration File

Locate config file:
```powershell
rclone config file
```

Output example:
```
Configuration file is stored at:
C:\Users\<YourName>\AppData\Roaming\rclone\rclone.conf
```

Copy it:
```powershell
copy "C:\Users\<YourName>\AppData\Roaming\rclone\rclone.conf" "C:\rclone-config\rclone.conf"
```

✅ Ensures Docker can read OneDrive credentials.

---

## 🔑 7. Azure App Registration Summary

| Setting | Value |
|----------|-------|
| **Redirect URI** | `http://localhost:53682/` |
| **API Permissions** | Microsoft Graph → `Files.ReadWrite`, `offline_access`, `User.Read` |
| **Secret to Use** | The **Value** column (not Secret ID) |
| **Consent** | Grant admin consent for your tenant |

---

## 🔁 8. Continuous Sync Container (Every 10 Seconds)

```powershell
docker run -d `
  --name ftp-to-onedrive-watch `
  -v C:\ftp\data:/data `
  -v C:\rclone-config:/config/rclone `
  --restart unless-stopped `
  --entrypoint /bin/sh `
  rclone/rclone:latest `
  -c "while true; do rclone move /data onedrive:/FTPUploads --delete-empty-src-dirs --log-file /config/rclone/upload.log --log-level INFO; sleep 10; done"
```

✅ **Explanation**
| Component | Description |
|------------|-------------|
| `/data` | Maps to `C:\ftp\data` |
| `/config/rclone` | Maps to `C:\rclone-config` |
| `rclone move` | Uploads and deletes local copies |
| `sleep 10` | Checks every 10 seconds |
| `--restart unless-stopped` | Auto restart after reboot |
| `--log-file` | Logs stored in `C:\rclone-config\upload.log` |

---

## 📊 9. Monitoring and Logs

View recent logs:
```powershell
docker logs ftp-to-onedrive-watch --tail 20
```

Expected output:
```
INFO  : Moving datafile.csv -> onedrive:/FTPUploads/datafile.csv
INFO  : datafile.csv: Deleted after upload
```

Full logs stored at:
```
C:\rclone-config\upload.log
```

---

## ✅ 10. Verification Checklist

| Task | Status |
|------|---------|
| FTP Container Running | ✅ |
| Ports 21 & 30000–30009 Open | ✅ |
| FTP Upload to `C:\ftp\data` Works | ✅ |
| OneDrive Authentication Valid | ✅ |
| rclone.conf Copied to `C:\rclone-config` | ✅ |
| Continuous Sync Every 10s | ✅ |
| Logs Created in `upload.log` | ✅ |

---

## 🔒 11. Security & Maintenance

- Restrict FTP access to `192.168.2.*` only.  
- Renew Azure Client Secret before expiry.  
- Run `rclone selfupdate` monthly.  
- Check `upload.log` for failed uploads.  
- Re-run `rclone config` and replace updated `rclone.conf` if needed.

---

## 🧠 Final Architecture Flow

```
FTP Client  → 192.168.2.7:21 (Docker FTP Server)
       ↓
Files saved in C:\ftp\data
       ↓
rclone Docker container (every 10s)
       ↓
Uploads to OneDrive:/FTPUploads
       ↓
Logs stored at C:\rclone-config\upload.log
```
