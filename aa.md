# 🚀 FTP → OneDrive Complete Automation (Windows + Linux)

This document provides a **production-grade guide** to set up an FTP server using Docker (`stilliard/pure-ftpd`) and automatically upload files to OneDrive using `rclone`.

Includes full support for:
- ✅ FTP authentication via PureDB (no 530 errors)
- ✅ Dynamic OneDrive folder naming by **date + hostname/IP**
- ✅ Persistent config, logs, and user credentials
- ✅ Works on **Windows or Linux Docker hosts**

---

## 🧩 Architecture Overview

**Flow:**
1. User uploads a file → FTP Server (`stilliard/pure-ftpd`)
2. File stored in `/home/ftpusers/ftp-user` → mapped to `C:\ftp\data`
3. Rclone container syncs files from FTP data folder → OneDrive
4. OneDrive folder structure: `Call-Recording/<DATE>/<HOSTNAME>_<IP>/`

---

## ⚙️ Environment Summary

| Component | Purpose | Container Name |
|------------|----------|----------------|
| Pure-FTPd | FTP server for uploads | `pure-ftp` |
| Rclone | OneDrive sync automation | `ftp-to-onedrive-watch` |

---

## 🧹 Step 1: Clean Previous Setup

**Windows PowerShell:**
```powershell
docker rm -f pure-ftp
rmdir /s /q C:\ftp\data
rmdir /s /q C:\ftp\auth
mkdir C:\ftp\data
mkdir C:\ftp\auth
```

**Linux equivalent:**
```bash
docker rm -f pure-ftp
rm -rf /ftp/data /ftp/auth
mkdir -p /ftp/data /ftp/auth
```

---

## 🐳 Step 2: Run FTP Server Container

**Windows (PowerShell):**
```powershell
docker run -d `
  --name pure-ftp `
  -p 21:21 -p 30000-30009:30000-30009 `
  -v C:\ftp\data:/home/ftpusers/ftp-user `
  -v C:\ftp\auth:/etc/pure-ftpd/passwd `
  -e PUBLICHOST=192.168.2.7 `
  --restart unless-stopped `
  stilliard/pure-ftpd:hardened `
  pure-ftpd -E -j -R -l puredb:/etc/pure-ftpd/pureftpd.pdb -P 192.168.2.7 -p 30000:30009
```

**Linux:**
```bash
docker run -d \
  --name pure-ftp \
  -p 21:21 -p 30000-30009:30000-30009 \
  -v /ftp/data:/home/ftpusers/ftp-user \
  -v /ftp/auth:/etc/pure-ftpd/passwd \
  -e PUBLICHOST=192.168.2.7 \
  --restart unless-stopped \
  stilliard/pure-ftpd:hardened \
  pure-ftpd -E -j -R -l puredb:/etc/pure-ftpd/pureftpd.pdb -P 192.168.2.7 -p 30000:30009
```

---

## 👤 Step 3: Create FTP User (Inside Container)

```bash
docker exec -it pure-ftp bash

mkdir -p /home/ftpusers/ftp-user
chown -R ftpuser:ftpgroup /home/ftpusers/ftp-user
chmod -R 755 /home/ftpusers/ftp-user
mkdir -p /etc/pure-ftpd/passwd

pure-pw useradd ftp-user -u ftpuser -d /home/ftpusers/ftp-user
# password: ftp-pass

pure-pw mkdb /etc/pure-ftpd/pureftpd.pdb
ls -l /etc/pure-ftpd/pureftpd.*
exit
```

✅ You should see both `pureftpd.passwd` and `pureftpd.pdb` files created.

---

## 🔁 Step 4: Restart and Verify

```powershell
docker restart pure-ftp
```

**Check container logs:**
```powershell
docker logs pure-ftp
```
You should see:
```
Running Pure-FTPd...
```

---

## 🧪 Step 5: Test in FileZilla

| Field | Value |
|--------|--------|
| Host | 192.168.2.7 |
| Port | 21 |
| Username | ftp-user |
| Password | ftp-pass |
| Encryption | None |
| Transfer Mode | Passive |

✅ Expected output:
```
Response: 230 OK. Current directory is /
Status: Directory listing successful
```

---

## ☁️ Step 6: Configure OneDrive with Rclone

### 1️⃣ Configure once on Windows:
```powershell
rclone config
```
Choose:
- **n → New remote**
- Name: `onedrive`
- Storage: `onedrive`
- Type: 2 (Microsoft 365 / OneDrive for Business)
- Client ID, Secret, Tenant ID: *(if available)*
- Auto-authenticate via browser ✅

Config file will be saved to: `C:\rclone-config\rclone.conf`

---

## 🔄 Step 7: Run Rclone Sync Container

**Windows (PowerShell):**
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
      HOST=\$(hostname); \
      IP=\$(hostname -I | awk '{print \$1}'); \
      TARGET=onedrive:/Call-Recording/\${DATE}/\${HOST}_\${IP}/; \
      rclone move /data \$TARGET --delete-empty-src-dirs --log-file /config/rclone/upload.log --log-level INFO; \
      sleep 60; \
    done"
```

**Linux equivalent:**
```bash
docker run -d \
  --name ftp-to-onedrive-watch \
  -v /ftp/data:/data \
  -v /rclone-config:/config/rclone \
  --restart unless-stopped \
  --entrypoint /bin/sh \
  rclone/rclone:latest \
  -c 'while true; do \
      DATE=$(date +%Y-%m-%d); \
      HOST=$(hostname); \
      IP=$(hostname -I | awk "{print $1}"); \
      TARGET=onedrive:/Call-Recording/${DATE}/${HOST}_${IP}/; \
      rclone move /data $TARGET --delete-empty-src-dirs --log-file /config/rclone/upload.log --log-level INFO; \
      sleep 60; \
    done'
```

✅ Files uploaded via FTP will automatically move to OneDrive in subfolders based on date and machine identity.

---

## 🔍 Step 8: Verify Logs

**Inside host (Windows):**
```
C:\rclone-config\upload.log
```

Check for entries like:
```
INFO  : Moved (server-side copy) file: example.pdf -> Call-Recording/2025-10-10/DEVPC_192.168.2.12/example.pdf
```

---

## 🛡️ Security & Maintenance Notes
- Only port **21 + 30000–30009** should be open to allowed IPs (use Windows Firewall or `ufw`)
- Store credentials securely in `C:\ftp\auth`
- Use `--restart unless-stopped` for both containers
- Backup `rclone.conf` and `/etc/pure-ftpd/passwd` folders

---

## ✅ Quick Recovery Script (Windows)

```powershell
docker rm -f pure-ftp

docker run -d `
  --name pure-ftp `
  -p 21:21 -p 30000-30009:30000-30009 `
  -v C:\ftp\data:/home/ftpusers/ftp-user `
  -v C:\ftp\auth:/etc/pure-ftpd/passwd `
  -e PUBLICHOST=192.168.2.7 `
  --restart unless-stopped `
  stilliard/pure-ftpd:hardened `
  pure-ftpd -E -j -R -l puredb:/etc/pure-ftpd/pureftpd.pdb -P 192.168.2.7 -p 30000:30009
```

Then re-add the user (if missing):
```bash
docker exec -it pure-ftp bash
pure-pw useradd ftp-user -u ftpuser -d /home/ftpusers/ftp-user
pure-pw mkdb /etc/pure-ftpd/pureftpd.pdb
exit
docker restart pure-ftp
```

---

## 🎯 Final Result
✅ FTP server (Pure-FTPd) — fully working, persistent users  
✅ Rclone container — automated OneDrive uploads with date/IP folders  
✅ Windows + Linux compatible setup  
✅ Fixed 530 login issues permanently

