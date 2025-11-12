# Chapter 17: Infrastructure Deployment

**Launching Your Hosting Platform**

---

## Learning Objectives

By the end of this chapter, you'll be able to:
- ✅ Create Docker networks for service communication
- ✅ Deploy infrastructure services with Docker Compose
- ✅ Verify Caddy reverse proxy is running
- ✅ Confirm automatic HTTPS certificate generation
- ✅ Access pgAdmin web interface securely
- ✅ Connect pgAdmin to PostgreSQL database
- ✅ Test database functionality
- ✅ Monitor infrastructure logs
- ✅ Troubleshoot common deployment issues

**Time Required:** 45-60 minutes

**Prerequisites:**
- Repository cloned (Chapter 16)
- .env file configured
- DNS propagated and working
- Docker and Docker Compose installed

---

## Pre-Flight Checklist

### Verify Prerequisites

**Before deploying, confirm:**

**1. DNS is working:**
```bash
dig db.mywebclass.org +short
```
**Should return your server IP.**

---

**2. Docker is running:**
```bash
docker --version
docker compose version
```
**Should show versions.**

---

**3. Firewall allows HTTP/HTTPS:**
```bash
sudo ufw status
```
**Should show:**
```
80/tcp          ALLOW       Anywhere
443/tcp         ALLOW       Anywhere
```

---

**4. Repository cloned:**
```bash
ls ~/mywebclass_hosting/infrastructure/
```
**Should show docker-compose.yml, Caddyfile, .env**

---

**5. .env file configured:**
```bash
cat ~/mywebclass_hosting/infrastructure/.env
```
**Should show your configuration (not defaults).**

---

**If anything missing, go back and complete previous chapters!**

---

## Creating Docker Networks

### Understanding Network Architecture

**We need two networks:**

**1. web (external)**
- Connects internet-facing services
- Caddy and pgAdmin
- Accessible from outside

**2. internal (private)**
- Connects backend services
- PostgreSQL and pgAdmin
- NOT accessible from outside

---

**Network diagram:**
```
Internet
   ↓
[web network] ← Caddy, pgAdmin
   ↓
[internal network] ← PostgreSQL, pgAdmin
```

**pgAdmin on both networks:**
- web → Caddy can reach it
- internal → Can reach PostgreSQL

---

### Create web Network

**Create external network:**
```bash
docker network create web
```

**Output:**
```
f8e7d6c5b4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0
```

**That long ID is the network identifier.**

---

**Verify created:**
```bash
docker network ls
```

**Should see:**
```
NETWORK ID     NAME      DRIVER    SCOPE
abc123def456   bridge    bridge    local
f8e7d6c5b4a3   web       bridge    local
```

---

### Create internal Network

**Create private network:**
```bash
docker network create internal
```

**Output:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

**Verify created:**
```bash
docker network ls
```

**Should see both:**
```
NETWORK ID     NAME       DRIVER    SCOPE
abc123def456   bridge     bridge    local
f8e7d6c5b4a3   web        bridge    local
a1b2c3d4e5f6   internal   bridge    local
```

**Perfect! Networks ready.**

---

### Network Details

**Inspect web network:**
```bash
docker network inspect web
```

**Output (abbreviated):**
```json
[
    {
        "Name": "web",
        "Driver": "bridge",
        "Scope": "local",
        "IPAM": {
            "Config": [
                {
                    "Subnet": "172.18.0.0/16",
                    "Gateway": "172.18.0.1"
                }
            ]
        },
        "Containers": {}
    }
]
```

**No containers yet (we'll add them next).**

---

## Deploying Infrastructure Services

### Navigate to Infrastructure Directory

**Change directory:**
```bash
cd ~/mywebclass_hosting/infrastructure
```

**Verify location:**
```bash
pwd
```
**Should show:**
```
/home/yourusername/mywebclass_hosting/infrastructure
```

---

### Review Configuration One Last Time

**Check docker-compose.yml:**
```bash
cat docker-compose.yml
```

**Verify:**
- ✓ Services defined (caddy, postgres, pgadmin)
- ✓ Networks configured (web, internal)
- ✓ Volumes defined
- ✓ Environment variables use ${VAR} syntax

---

**Check Caddyfile:**
```bash
cat Caddyfile
```

**Should show:**
```
db.mywebclass.org {
    reverse_proxy pgadmin:80
}
```

**Replace mywebclass.org with YOUR domain if different!**

---

**Check .env:**
```bash
cat .env
```

**Verify:**
- ✓ Strong passwords (not defaults)
- ✓ Valid email
- ✓ No typos

---

### Deploy Infrastructure

**Start all services:**
```bash
docker compose up -d
```

**Explanation:**
- `up` - Start services
- `-d` - Detached mode (background)

---

**Output:**
```
[+] Running 8/8
 ✔ Network infrastructure_web       Created
 ✔ Network infrastructure_internal  Created
 ✔ Volume "infrastructure_caddy_data"     Created
 ✔ Volume "infrastructure_caddy_config"   Created
 ✔ Volume "infrastructure_postgres_data"  Created
 ✔ Volume "infrastructure_pgadmin_data"   Created
 ✔ Container postgres               Started
 ✔ Container caddy                  Started
 ✔ Container pgadmin                Started
```

**Might take 1-2 minutes on first run (downloading images).**

---

**If you see warnings about external networks:**
```
WARN[0000] network web: network.external.name is deprecated
```

**That's OK! The deployment still works.**

---

### Verify Containers Running

**Check container status:**
```bash
docker compose ps
```

**Expected output:**
```
NAME       IMAGE                    STATUS         PORTS
caddy      caddy:2.8-alpine        Up 1 minute    0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
postgres   postgres:16-alpine      Up 1 minute    5432/tcp
pgadmin    dpage/pgadmin4:latest   Up 1 minute    80/tcp
```

**All should show "Up"!**

---

**Alternative view:**
```bash
docker ps
```

**Shows same info in different format:**
```
CONTAINER ID   IMAGE                    STATUS         PORTS                    NAMES
abc123def456   caddy:2.8-alpine        Up 2 minutes   0.0.0.0:80->80/tcp...    caddy
def456ghi789   postgres:16-alpine      Up 2 minutes   5432/tcp                 postgres
ghi789jkl012   dpage/pgadmin4:latest   Up 2 minutes   80/tcp                   pgadmin
```

---

### Verify Network Connections

**Check containers on web network:**
```bash
docker network inspect web | grep -A 5 Containers
```

**Should show:**
```
"Containers": {
    "abc123...": {
        "Name": "caddy",
        ...
    },
    "ghi789...": {
        "Name": "pgadmin",
        ...
    }
}
```

**Caddy and pgAdmin on web network ✓**

---

**Check containers on internal network:**
```bash
docker network inspect internal | grep -A 5 Containers
```

**Should show:**
```
"Containers": {
    "def456...": {
        "Name": "postgres",
        ...
    },
    "ghi789...": {
        "Name": "pgadmin",
        ...
    }
}
}
```

**PostgreSQL and pgAdmin on internal network ✓**

---

## Verifying Services

### Check Caddy Logs

**View Caddy logs:**
```bash
docker compose logs caddy
```

**Look for:**
```
caddy-1  | {"level":"info","ts":1699808400,"msg":"serving initial configuration"}
caddy-1  | {"level":"info","msg":"autosaved config","file":"/config/caddy/autosave.json"}
caddy-1  | {"level":"info","msg":"serving initial configuration"}
```

---

**Look for certificate acquisition:**
```
caddy-1  | {"level":"info","msg":"obtaining certificate","identifier":"db.mywebclass.org"}
caddy-1  | {"level":"info","msg":"certificate obtained successfully","identifier":"db.mywebclass.org"}
```

**This means HTTPS is working! ✓**

---

**If you see errors about certificates:**
```
caddy-1  | {"level":"error","msg":"obtain certificate","error":"..."}
```

**Common causes:**
1. DNS not propagated yet (wait longer)
2. Port 80 blocked (check firewall)
3. Domain doesn't resolve (check DNS)

**We'll troubleshoot later if needed.**

---

### Check PostgreSQL Logs

**View PostgreSQL logs:**
```bash
docker compose logs postgres
```

**Look for:**
```
postgres-1  | PostgreSQL init process complete; ready for start up.
postgres-1  | 
postgres-1  | LOG:  database system is ready to accept connections
```

**"ready to accept connections" = Working! ✓**

---

### Check pgAdmin Logs

**View pgAdmin logs:**
```bash
docker compose logs pgadmin
```

**Look for:**
```
pgadmin-1  | NOTE: Configuring authentication for SERVER mode.
pgadmin-1  | 
pgadmin-1  | postfix/master[1]: daemon started
pgadmin-1  | [2024-11-12 14:30:00 +0000] [1] [INFO] Starting gunicorn 20.1.0
pgadmin-1  | [2024-11-12 14:30:00 +0000] [1] [INFO] Listening at: http://0.0.0.0:80
```

**"Listening at" = Working! ✓**

---

## Testing HTTPS

### Access pgAdmin

**Open browser and go to:**
```
https://db.mywebclass.org
```

**(Replace with your actual subdomain)**

---

**What should happen:**

1. **Browser connects to server**
2. **Caddy automatically gets Let's Encrypt certificate**
3. **HTTPS established (secure connection)**
4. **pgAdmin login page appears**

---

**Expected result:**

![pgAdmin Login Page]
```
┌─────────────────────────────────────┐
│           pgAdmin 4                  │
│                                      │
│  Email Address: [              ]     │
│  Password:      [              ]     │
│                                      │
│  [ Login ]                           │
└─────────────────────────────────────┘
```

**Secure connection with green padlock in browser! ✓**

---

### Verify SSL Certificate

**Check certificate details:**

**Chrome/Edge:**
```
1. Click padlock icon in address bar
2. Click "Connection is secure"
3. Click "Certificate is valid"
```

**Firefox:**
```
1. Click padlock icon
2. Click arrow button
3. Click "More information"
4. Click "View Certificate"
```

---

**Certificate should show:**
```
Issued to: db.mywebclass.org
Issued by: Let's Encrypt
Valid from: Nov 12, 2024
Valid until: Feb 10, 2025 (90 days)
```

**Let's Encrypt certificate = Automatic HTTPS working! ✓**

---

### Troubleshooting HTTPS Issues

**Problem: "Your connection is not private" warning**

**Possible causes:**

**1. Certificate not obtained yet**
```
Solution: Wait 1-2 minutes, refresh browser
Caddy obtains certificates on first request
```

**2. DNS not propagated**
```
Check: dig db.mywebclass.org +short
Should return your server IP
Solution: Wait for DNS propagation
```

**3. Port 80 blocked**
```
Check: sudo ufw status
Should show: 80/tcp ALLOW
Solution: sudo ufw allow 80
```

**4. Wrong domain in Caddyfile**
```
Check: cat Caddyfile
Should match: db.yourdomain.com
Solution: Edit Caddyfile, restart: docker compose restart caddy
```

---

**Check Caddy logs for certificate errors:**
```bash
docker compose logs caddy | grep -i error
```

**Look for specific error messages:**
```
"connection refused" → Port 80 blocked
"no such host" → DNS not working
"timeout" → Firewall issue
```

---

## Logging into pgAdmin

### Login Credentials

**Use credentials from .env file:**
```bash
cat .env | grep PGADMIN
```

**Shows:**
```
PGADMIN_EMAIL=admin@mywebclass.org
PGADMIN_PASSWORD=your_password_here
```

---

**Enter in browser:**
```
Email Address: admin@mywebclass.org
Password: your_password_here
```

**Click "Login"**

---

### First Login

**After successful login:**

```
┌─────────────────────────────────────────┐
│ pgAdmin 4                          [≡]  │
├─────────────────────────────────────────┤
│ Welcome to pgAdmin 4                     │
│                                          │
│ Dashboard:                               │
│  Servers: 0                              │
│  Sessions: 1                             │
│                                          │
│ Quick Links:                             │
│  • Add New Server                        │
│  • Import/Export Servers                 │
└─────────────────────────────────────────┘
```

**Left sidebar:**
```
Servers
  └── (no servers yet)
```

---

## Connecting pgAdmin to PostgreSQL

### Add Server Connection

**Step 1: Right-click "Servers"**
```
Servers
  └── (right-click here)
```

**Click "Register" → "Server..."**

---

**Step 2: General tab**
```
Name: Production Database
Comment: Main PostgreSQL database
```

**Click "Connection" tab**

---

**Step 3: Connection tab**
```
Host name/address: postgres
Port: 5432
Maintenance database: postgres
Username: dbadmin
Password: (your POSTGRES_PASSWORD from .env)
Save password: ✓ (check this)
```

**Important notes:**
- **Host:** `postgres` (container name, not IP!)
- **Username:** From POSTGRES_USER in .env
- **Password:** From POSTGRES_PASSWORD in .env

---

**Step 4: Click "Save"**

---

### Verify Connection

**After clicking Save:**

**Left sidebar updates:**
```
Servers
  └── Production Database (connected)
      ├── Databases (3)
      │   ├── mywebclass
      │   ├── postgres
      │   └── template1
      ├── Login/Group Roles (1)
      └── Tablespaces (1)
```

**"connected" status = Success! ✓**

---

**Expand database:**
```
Servers
  └── Production Database
      └── Databases
          └── mywebclass
              ├── Schemas
              │   └── public
              │       ├── Tables
              │       ├── Views
              │       └── Functions
              └── ...
```

---

### Test Database Connection

**Run a test query:**

**Step 1: Select mywebclass database**
```
Right-click "mywebclass"
Click "Query Tool"
```

---

**Step 2: Run test query**
```sql
SELECT version();
```

**Click "▶ Execute/Refresh" button (or press F5)**

---

**Expected result:**
```
PostgreSQL 16.1 on x86_64-pc-linux-musl, compiled by gcc (Alpine 12.2.1) 12.2.1 20220924, 64-bit
```

**Query executed successfully! ✓**

---

**Try another test:**
```sql
SELECT current_timestamp;
```

**Result:**
```
2024-11-12 14:45:30.123456+00
```

**Database fully operational! ✓**

---

## Monitoring Infrastructure

### View All Logs

**Follow logs in real-time:**
```bash
docker compose logs -f
```

**Shows logs from all services:**
```
caddy-1     | {"level":"info","msg":"request handled"}
postgres-1  | LOG:  checkpoint complete
pgadmin-1   | INFO:     192.168.1.100:45678 - "GET / HTTP/1.1" 200 OK
```

**Press Ctrl+C to stop following.**

---

### View Specific Service Logs

**Caddy only:**
```bash
docker compose logs -f caddy
```

**PostgreSQL only:**
```bash
docker compose logs -f postgres
```

**pgAdmin only:**
```bash
docker compose logs -f pgadmin
```

---

### View Last N Lines

**Last 50 lines:**
```bash
docker compose logs --tail=50
```

**Last 100 lines from Caddy:**
```bash
docker compose logs --tail=100 caddy
```

---

### Check Resource Usage

**See CPU/memory usage:**
```bash
docker stats
```

**Output:**
```
CONTAINER ID   NAME       CPU %   MEM USAGE / LIMIT    MEM %
abc123def456   caddy      0.05%   12.5MiB / 3.84GiB   0.32%
def456ghi789   postgres   0.12%   45.2MiB / 3.84GiB   1.15%
ghi789jkl012   pgadmin    0.08%   125MiB / 3.84GiB    3.18%
```

**Press Ctrl+C to exit.**

---

## Managing Infrastructure

### Stop Services

**Stop all services:**
```bash
docker compose stop
```

**Services stop but containers remain:**
```
[+] Stopping 3/3
 ✔ Container pgadmin   Stopped
 ✔ Container caddy     Stopped
 ✔ Container postgres  Stopped
```

---

**Restart services:**
```bash
docker compose start
```

**Services start again from stopped state.**

---

### Restart Services

**Restart all services:**
```bash
docker compose restart
```

**Or restart specific service:**
```bash
docker compose restart caddy
docker compose restart postgres
```

**Useful after configuration changes!**

---

### Update Configuration

**If you modify Caddyfile:**
```bash
nano Caddyfile
# Make changes
# Save and exit

# Reload Caddy (no downtime!)
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

---

**If you modify docker-compose.yml:**
```bash
nano docker-compose.yml
# Make changes
# Save and exit

# Recreate affected containers
docker compose up -d
```

---

### View Container Details

**Inspect container:**
```bash
docker inspect caddy
```

**Shows detailed JSON configuration.**

---

**Get specific info:**
```bash
# IP address
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' caddy

# Status
docker inspect -f '{{.State.Status}}' caddy
```

---

## Troubleshooting Common Issues

### Issue 1: Container Won't Start

**Check status:**
```bash
docker compose ps
```

**If container shows "Exited":**
```
NAME       STATUS
caddy      Up 5 minutes
postgres   Exited (1) 10 seconds ago
pgadmin    Up 5 minutes
```

---

**Check logs for error:**
```bash
docker compose logs postgres
```

**Common errors:**

**"port already in use"**
```
Error: bind: address already in use
```
**Solution:** Another service using port (5432)
```bash
sudo lsof -i :5432
# Kill conflicting process or change port
```

---

**"permission denied"**
```
Error: permission denied
```
**Solution:** Volume permissions issue
```bash
docker compose down -v  # Remove volumes
docker compose up -d    # Recreate
```

---

**"invalid environment variable"**
```
Error: POSTGRES_PASSWORD is not set
```
**Solution:** Check .env file
```bash
cat .env  # Verify variables exist
docker compose config  # Test configuration
```

---

### Issue 2: Can't Access pgAdmin

**Problem:** Browser shows "Connection refused" or timeout

**Check 1: Container running?**
```bash
docker compose ps pgadmin
```
**Should show "Up"**

---

**Check 2: Logs for errors**
```bash
docker compose logs pgadmin
```

---

**Check 3: DNS resolving?**
```bash
dig db.mywebclass.org +short
```
**Should return server IP**

---

**Check 4: Firewall allowing traffic?**
```bash
sudo ufw status | grep -E '80|443'
```
**Should show ALLOW**

---

**Check 5: Caddy routing correctly?**
```bash
docker compose logs caddy | grep pgadmin
```

---

### Issue 3: HTTPS Not Working

**Problem:** Certificate errors or HTTP only

**Check 1: Caddy logs**
```bash
docker compose logs caddy | grep -i certificate
```

**Look for:**
```
"certificate obtained successfully" ✓
```

---

**Check 2: Port 80 accessible**
```bash
curl -I http://db.mywebclass.org
```

**Should connect (needed for ACME challenge)**

---

**Check 3: Caddy config**
```bash
docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile
```

**Should show:**
```
Valid configuration
```

---

**Check 4: Force certificate renewal**
```bash
docker compose restart caddy
```

**Wait 1-2 minutes, refresh browser**

---

### Issue 4: Database Connection Fails

**Problem:** pgAdmin can't connect to PostgreSQL

**Check 1: PostgreSQL running?**
```bash
docker compose ps postgres
```

---

**Check 2: PostgreSQL ready?**
```bash
docker compose logs postgres | grep "ready to accept"
```

---

**Check 3: Credentials correct?**
```bash
cat .env | grep POSTGRES
```

**Verify:**
- Username matches POSTGRES_USER
- Password matches POSTGRES_PASSWORD
- Database name matches POSTGRES_DB

---

**Check 4: Network connectivity**
```bash
docker compose exec pgadmin ping -c 3 postgres
```

**Should show replies:**
```
64 bytes from postgres.internal (172.19.0.2): icmp_seq=1 ttl=64 time=0.123 ms
```

---

**Check 5: Try from command line**
```bash
docker compose exec postgres psql -U dbadmin -d mywebclass -c "SELECT 1;"
```

**Should show:**
```
 ?column? 
----------
        1
(1 row)
```

**If this works but pgAdmin doesn't, check pgAdmin credentials.**

---

## Backup and Data Persistence

### Understanding Data Storage

**Data persists in volumes:**
```bash
docker volume ls | grep infrastructure
```

**Should show:**
```
infrastructure_caddy_data
infrastructure_caddy_config
infrastructure_postgres_data     ← Most important!
infrastructure_pgadmin_data
```

---

### Backup PostgreSQL Database

**Create backup:**
```bash
docker compose exec postgres pg_dump -U dbadmin mywebclass > backup.sql
```

**Or with timestamp:**
```bash
docker compose exec postgres pg_dump -U dbadmin mywebclass > backup_$(date +%Y%m%d_%H%M%S).sql
```

**File saved to current directory.**

---

### Restore PostgreSQL Database

**Restore from backup:**
```bash
cat backup.sql | docker compose exec -T postgres psql -U dbadmin mywebclass
```

**Or:**
```bash
docker compose exec -T postgres psql -U dbadmin mywebclass < backup.sql
```

---

### Backup Volumes

**Backup entire PostgreSQL volume:**
```bash
docker run --rm \
  -v infrastructure_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz /data
```

**Creates compressed archive of database volume.**

---

## Infrastructure Status Dashboard

### Quick Health Check

**Create simple health check script:**
```bash
nano ~/check-infrastructure.sh
```

**Add:**
```bash
#!/bin/bash

echo "=== Infrastructure Health Check ==="
echo ""

echo "1. Containers Status:"
cd ~/mywebclass_hosting/infrastructure
docker compose ps
echo ""

echo "2. DNS Resolution:"
dig +short db.mywebclass.org
echo ""

echo "3. HTTPS Check:"
curl -I https://db.mywebclass.org 2>&1 | head -1
echo ""

echo "4. Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo ""

echo "5. Disk Space:"
df -h / | tail -1
echo ""

echo "=== Check Complete ==="
```

---

**Make executable:**
```bash
chmod +x ~/check-infrastructure.sh
```

**Run anytime:**
```bash
~/check-infrastructure.sh
```

---

## Next Steps

**Infrastructure deployed! ✓**

**What's running:**
- ✅ Caddy reverse proxy (ports 80, 443)
- ✅ Automatic HTTPS with Let's Encrypt
- ✅ PostgreSQL database (internal network)
- ✅ pgAdmin web interface (secure access)

**In Chapter 18:**
- Deploy static website
- Configure Caddyfile for routing
- Access site with HTTPS
- Test subdomain routing

**In Chapter 19:**
- Deploy backend application
- Connect to PostgreSQL
- Environment configuration
- Full-stack deployment

**In Chapter 20:**
- Monitoring and maintenance
- Log management
- Updates and backups
- Production operations

---

## Key Takeaways

**Remember:**

1. **Docker networks enable isolation**
   - web - Internet-facing services
   - internal - Private backend services
   - pgAdmin on both networks

2. **Docker Compose simplifies management**
   - Single command to deploy
   - Easy to start/stop/restart
   - Logs aggregation
   - Resource monitoring

3. **Caddy automates HTTPS**
   - Automatic certificate acquisition
   - Zero-configuration SSL
   - HTTP/2 and HTTP/3 support
   - Graceful reloads

4. **Data persists in volumes**
   - Survive container restarts
   - Can be backed up
   - Portable across hosts
   - Regular backups critical

5. **Monitoring is important**
   - Check logs regularly
   - Monitor resource usage
   - Watch for errors
   - Verify HTTPS working

---

## Quick Reference

### Essential Commands

**Deploy infrastructure:**
```bash
cd ~/mywebclass_hosting/infrastructure
docker compose up -d
```

**Check status:**
```bash
docker compose ps
docker compose logs
docker stats
```

**Restart services:**
```bash
docker compose restart
docker compose restart caddy  # Specific service
```

**Stop/start:**
```bash
docker compose stop
docker compose start
```

**View logs:**
```bash
docker compose logs -f
docker compose logs -f caddy
docker compose logs --tail=100
```

**Backup database:**
```bash
docker compose exec postgres pg_dump -U dbadmin mywebclass > backup.sql
```

**Reload Caddy:**
```bash
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

---

### Service URLs

```
pgAdmin: https://db.mywebclass.org
(More to be added in Chapters 18-19)
```

---

### Troubleshooting Checklist

```
□ DNS resolving correctly (dig)
□ Firewall allows 80/443
□ All containers "Up" status
□ No errors in logs
□ HTTPS certificate obtained
□ Can login to pgAdmin
□ Database connection works
□ Test query executes
```

---

[← Previous: Chapter 16 - Repository Setup](16-repository-setup.md) | [Next: Chapter 18 - Static Site Deployment →](18-static-site-deployment.md)
