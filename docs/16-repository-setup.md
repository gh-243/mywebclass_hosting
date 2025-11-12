# Chapter 16: Repository Setup

**Preparing Your Infrastructure Code**

---

## Learning Objectives

By the end of this chapter, you'll be able to:
- ✅ Clone the mywebclass_hosting repository
- ✅ Understand the repository structure
- ✅ Navigate infrastructure and project directories
- ✅ Review docker-compose.yml configuration
- ✅ Create and configure .env files
- ✅ Understand environment variables and secrets
- ✅ Verify repository is ready for deployment

**Time Required:** 30-40 minutes

**Prerequisites:**
- SSH access to your server
- DNS configured (Chapter 15)
- Docker installed (Chapter 13)

---

## Understanding the Repository

### What is mywebclass_hosting?

**GitHub Repository:** https://github.com/kaw393939/mywebclass_hosting

**Purpose:**
- Pre-configured hosting infrastructure
- Docker Compose setup for web applications
- Caddy reverse proxy with automatic HTTPS
- PostgreSQL database
- pgAdmin for database management
- Example projects

**Why we're using it:**
- Production-ready configuration
- Best practices built-in
- Learn by example
- Save time on setup

---

### Repository Structure

**High-level overview:**
```
mywebclass_hosting/
├── infrastructure/          ← Core services (Caddy, DB)
│   ├── docker-compose.yml
│   ├── Caddyfile
│   └── .env.example
├── projects/                ← Your applications
│   ├── static-site/
│   ├── backend/
│   └── ...
├── docs/                    ← This course!
│   ├── 01-introduction.md
│   ├── 02-linux-commands.md
│   └── ...
└── README.md
```

**Two main sections:**
1. **infrastructure/** - Core hosting services (shared)
2. **projects/** - Individual applications (separate)

---

## Cloning the Repository

### SSH to Your Server

**Connect as your user:**
```bash
ssh yourusername@your-server-ip
```

**Example:**
```bash
ssh john@45.55.209.47
```

---

### Install Git (if needed)

**Check if git installed:**
```bash
git --version
```

**If installed, you'll see:**
```
git version 2.34.1
```

**If not installed:**
```bash
sudo apt update
sudo apt install -y git
```

**Verify:**
```bash
git --version
```

---

### Clone Repository

**Clone to your home directory:**
```bash
cd ~
git clone https://github.com/kaw393939/mywebclass_hosting.git
```

**Output:**
```
Cloning into 'mywebclass_hosting'...
remote: Enumerating objects: 150, done.
remote: Counting objects: 100% (150/150), done.
remote: Compressing objects: 100% (95/95), done.
remote: Total 150 (delta 45), reused 140 (delta 35)
Receiving objects: 100% (150/150), 250.00 KiB | 5.00 MiB/s, done.
Resolving deltas: 100% (45/45), done.
```

**Repository cloned!**

---

**Verify:**
```bash
ls -la ~/mywebclass_hosting/
```

**You should see:**
```
total 48
drwxrwxr-x  6 john john 4096 Nov 12 10:30 .
drwxr-x--- 10 john john 4096 Nov 12 10:30 ..
drwxrwxr-x  8 john john 4096 Nov 12 10:30 .git
-rw-rw-r--  1 john john 1234 Nov 12 10:30 .gitignore
drwxrwxr-x  2 john john 4096 Nov 12 10:30 docs
drwxrwxr-x  2 john john 4096 Nov 12 10:30 infrastructure
drwxrwxr-x  4 john john 4096 Nov 12 10:30 projects
-rw-rw-r--  1 john john 5678 Nov 12 10:30 README.md
```

---

### Navigate Repository

**Enter repository:**
```bash
cd ~/mywebclass_hosting
```

**View structure:**
```bash
tree -L 2
```

**Or if tree not installed:**
```bash
find . -maxdepth 2 -type d
```

**Output:**
```
.
./docs
./infrastructure
./projects
./projects/static-site
./projects/backend
./.git
```

---

## Understanding Infrastructure Directory

### Navigate to Infrastructure

**Change to infrastructure directory:**
```bash
cd ~/mywebclass_hosting/infrastructure
```

**List files:**
```bash
ls -la
```

**You should see:**
```
-rw-rw-r-- 1 john john  1250 Nov 12 10:30 docker-compose.yml
-rw-rw-r-- 1 john john   450 Nov 12 10:30 Caddyfile
-rw-rw-r-- 1 john john   380 Nov 12 10:30 .env.example
-rw-rw-r-- 1 john john   150 Nov 12 10:30 .gitignore
-rw-rw-r-- 1 john john   800 Nov 12 10:30 README.md
```

---

### Review docker-compose.yml

**View the file:**
```bash
cat docker-compose.yml
```

**Expected content (example):**
```yaml
version: '3.8'

services:
  caddy:
    image: caddy:2.8-alpine
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - web
    environment:
      - ACME_AGREE=true

  postgres:
    image: postgres:16-alpine
    container_name: postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: pgadmin
    restart: unless-stopped
    environment:
      - PGADMIN_DEFAULT_EMAIL=${PGADMIN_EMAIL}
      - PGADMIN_DEFAULT_PASSWORD=${PGADMIN_PASSWORD}
      - PGADMIN_CONFIG_SERVER_MODE=False
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    networks:
      - web
      - internal
    depends_on:
      - postgres

networks:
  web:
    external: true
  internal:
    external: false

volumes:
  caddy_data:
  caddy_config:
  postgres_data:
  pgadmin_data:
```

---

### Understanding the Services

**1. Caddy (Reverse Proxy)**
```yaml
caddy:
  image: caddy:2.8-alpine
  ports:
    - "80:80"    # HTTP
    - "443:443"  # HTTPS
  volumes:
    - ./Caddyfile:/etc/caddy/Caddyfile:ro
```

**What it does:**
- Receives all web traffic
- Routes to correct service
- Handles SSL/TLS certificates automatically
- Proxies to pgAdmin and other apps

---

**2. PostgreSQL (Database)**
```yaml
postgres:
  image: postgres:16-alpine
  environment:
    - POSTGRES_DB=${POSTGRES_DB}
    - POSTGRES_USER=${POSTGRES_USER}
    - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
```

**What it does:**
- Production-grade database
- Stores application data
- Not exposed to internet (internal network only)
- Health checks ensure it's running

---

**3. pgAdmin (Database Management)**
```yaml
pgadmin:
  image: dpage/pgadmin4:latest
  environment:
    - PGADMIN_DEFAULT_EMAIL=${PGADMIN_EMAIL}
    - PGADMIN_DEFAULT_PASSWORD=${PGADMIN_PASSWORD}
```

**What it does:**
- Web interface for database management
- Run SQL queries
- View tables and data
- Import/export data
- Connected to both networks (web + internal)

---

### Understanding Networks

**Two networks defined:**

**1. web (external)**
```yaml
web:
  external: true
```

**Purpose:**
- Connects services that need internet access
- Caddy exposes ports 80 and 443
- pgAdmin accessible via Caddy proxy
- External = Created manually (we'll do this)

---

**2. internal (isolated)**
```yaml
internal:
  external: false
```

**Purpose:**
- Private network
- PostgreSQL only accessible from internal network
- Not exposed to internet
- Better security

---

**Service network connections:**
```
Internet
   ↓
Caddy (web network)
   ↓
pgAdmin (web + internal networks)
   ↓
PostgreSQL (internal network only)
```

**PostgreSQL never exposed to internet!**

---

### Understanding Volumes

**Four volumes defined:**

**1. caddy_data**
```yaml
caddy_data:
```
**Stores:** SSL certificates

---

**2. caddy_config**
```yaml
caddy_config:
```
**Stores:** Caddy configuration cache

---

**3. postgres_data**
```yaml
postgres_data:
```
**Stores:** Database files (most important!)

---

**4. pgadmin_data**
```yaml
pgadmin_data:
```
**Stores:** pgAdmin settings and saved connections

---

**Why volumes?**
- Persist data across container restarts
- Survive container deletion
- Can be backed up
- Can be moved to other hosts

**Without volumes, all data lost when container removed!**

---

### Review Caddyfile

**View the file:**
```bash
cat Caddyfile
```

**Expected content (example):**
```
# pgAdmin
db.mywebclass.org {
    reverse_proxy pgadmin:80
}

# Add more services here as needed
```

**What it does:**
- Routes `db.mywebclass.org` to pgAdmin container
- Automatic HTTPS via Let's Encrypt
- Will add more routes for applications later

---

**Caddy features:**
- Automatic HTTPS
- HTTP/2 and HTTP/3 support
- Zero-downtime reloads
- Simple configuration

---

## Environment Variables and Secrets

### Understanding .env Files

**Environment variables = Configuration values**

**Examples:**
```bash
POSTGRES_DB=mywebclass        # Database name
POSTGRES_USER=dbuser          # Database username
POSTGRES_PASSWORD=secret123   # Database password (secret!)
```

---

**Why use .env files?**

✅ **Separation of config from code**
```
Code in repository (public)
Secrets in .env file (private, not in git)
```

✅ **Easy to change**
```
Change password → Edit .env file
No code changes needed
```

✅ **Different values per environment**
```
Development:  POSTGRES_PASSWORD=dev123
Production:   POSTGRES_PASSWORD=strong_random_password
```

✅ **Security**
```
.env file not committed to git
Secrets stay secret
```

---

### Review .env.example

**View example file:**
```bash
cat .env.example
```

**Expected content:**
```bash
# PostgreSQL Database
POSTGRES_DB=mywebclass
POSTGRES_USER=dbadmin
POSTGRES_PASSWORD=CHANGE_ME_TO_STRONG_PASSWORD

# pgAdmin
PGADMIN_EMAIL=admin@mywebclass.org
PGADMIN_PASSWORD=CHANGE_ME_TO_STRONG_PASSWORD
```

**This is a template! Don't use these values in production.**

---

### Generate Strong Passwords

**Never use weak passwords in production!**

**Generate random password:**
```bash
openssl rand -base64 32
```

**Example output:**
```
k8jF3nQ9pL2mR7vX1dY6tZ4bW5cN0aH8
```

**Generate another:**
```bash
openssl rand -base64 32
```

**Example output:**
```
P3xK9mL2nQ7rS5tV8wY1zB4cD6fG0hJ2
```

**Use different passwords for PostgreSQL and pgAdmin!**

---

### Create .env File

**Copy example to create real .env:**
```bash
cd ~/mywebclass_hosting/infrastructure
cp .env.example .env
```

**Verify created:**
```bash
ls -la .env
```

**Output:**
```
-rw-rw-r-- 1 john john 280 Nov 12 11:00 .env
```

---

### Edit .env File

**Open in nano:**
```bash
nano .env
```

**Update with your values:**
```bash
# PostgreSQL Database
POSTGRES_DB=mywebclass
POSTGRES_USER=dbadmin
POSTGRES_PASSWORD=k8jF3nQ9pL2mR7vX1dY6tZ4bW5cN0aH8

# pgAdmin
PGADMIN_EMAIL=admin@mywebclass.org
PGADMIN_PASSWORD=P3xK9mL2nQ7rS5tV8wY1zB4cD6fG0hJ2
```

**Replace:**
- `POSTGRES_PASSWORD` with strong random password
- `PGADMIN_PASSWORD` with different strong random password
- `PGADMIN_EMAIL` with your actual email

---

**Save and exit:**
```
Ctrl+X
Y (yes)
Enter
```

---

### Verify .env File

**View contents (carefully!):**
```bash
cat .env
```

**Verify:**
- ✓ Strong passwords (not defaults)
- ✓ Valid email address
- ✓ No typos
- ✓ No extra spaces

---

### Secure .env File

**Restrict permissions:**
```bash
chmod 600 .env
```

**Why 600?**
```
6 = rw- (owner: read + write)
0 = --- (group: no access)
0 = --- (others: no access)
```

**Only you can read/write the file!**

---

**Verify permissions:**
```bash
ls -la .env
```

**Should show:**
```
-rw------- 1 john john 280 Nov 12 11:00 .env
```

**Perfect! ✓**

---

### Important: Never Commit .env

**Check .gitignore:**
```bash
cat .gitignore
```

**Should contain:**
```
.env
*.env
!.env.example
```

**This means:**
- .env files ignored by git
- Won't be committed accidentally
- .env.example IS included (it's safe)

---

**Verify .env not tracked:**
```bash
git status
```

**Should NOT show .env file:**
```
On branch master
Your branch is up to date with 'origin/master'.

nothing to commit, working tree clean
```

**If you see .env listed, it's in .gitignore! Don't force-add it.**

---

## Understanding Project Structure

### Navigate to Projects Directory

**View available projects:**
```bash
cd ~/mywebclass_hosting/projects
ls -la
```

**You should see:**
```
drwxrwxr-x 3 john john 4096 Nov 12 10:30 static-site
drwxrwxr-x 3 john john 4096 Nov 12 10:30 backend
-rw-rw-r-- 1 john john  450 Nov 12 10:30 README.md
```

---

### Static Site Project

**Navigate:**
```bash
cd static-site
ls -la
```

**Contents:**
```
-rw-rw-r-- 1 john john  800 Nov 12 10:30 docker-compose.yml
-rw-rw-r-- 1 john john  250 Nov 12 10:30 Dockerfile
drwxrwxr-x 2 john john 4096 Nov 12 10:30 public
-rw-rw-r-- 1 john john  400 Nov 12 10:30 nginx.conf
```

**What's here:**
- docker-compose.yml - Service definition
- Dockerfile - Build instructions
- public/ - HTML, CSS, JS files
- nginx.conf - Nginx configuration

---

**View docker-compose.yml:**
```bash
cat docker-compose.yml
```

**Example:**
```yaml
version: '3.8'

services:
  static-site:
    build: .
    container_name: static-site
    restart: unless-stopped
    networks:
      - web

networks:
  web:
    external: true
```

**Connects to web network (same as infrastructure).**

---

### Backend Project

**Navigate:**
```bash
cd ~/mywebclass_hosting/projects/backend
ls -la
```

**Contents:**
```
-rw-rw-r-- 1 john john  1200 Nov 12 10:30 docker-compose.yml
-rw-rw-r-- 1 john john   450 Nov 12 10:30 Dockerfile
-rw-rw-r-- 1 john john   280 Nov 12 10:30 .env.example
drwxrwxr-x 2 john john  4096 Nov 12 10:30 src
-rw-rw-r-- 1 john john   850 Nov 12 10:30 package.json
```

**What's here:**
- docker-compose.yml - Service definition
- Dockerfile - Build instructions
- .env.example - Environment template
- src/ - Application code
- package.json - Node.js dependencies

---

**View docker-compose.yml:**
```bash
cat docker-compose.yml
```

**Example:**
```yaml
version: '3.8'

services:
  backend:
    build: .
    container_name: backend
    restart: unless-stopped
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - NODE_ENV=production
    networks:
      - web
      - internal
    depends_on:
      - postgres

networks:
  web:
    external: true
  internal:
    external: true
```

**Connects to both networks:**
- web - Receives traffic from Caddy
- internal - Connects to PostgreSQL

---

## Repository Organization Benefits

### Separation of Concerns

**Infrastructure (shared):**
```
infrastructure/
├── docker-compose.yml  ← Core services
├── Caddyfile           ← Routing
└── .env                ← Secrets
```

**Projects (independent):**
```
projects/
├── static-site/
│   └── docker-compose.yml
└── backend/
    └── docker-compose.yml
```

**Benefits:**
- Infrastructure independent of apps
- Apps independent of each other
- Can deploy/update separately
- Clear organization

---

### Scalability

**Easy to add new projects:**
```bash
projects/
├── static-site/       ← Existing
├── backend/           ← Existing
├── blog/              ← Add new
├── api-v2/            ← Add new
└── admin-panel/       ← Add new
```

**Each project:**
- Has own docker-compose.yml
- Connects to shared networks
- Uses shared infrastructure
- Independent lifecycle

---

### Version Control

**Track changes:**
```bash
git log --oneline
```

**See history:**
```
a1b2c3d Add blog project
4e5f6g7 Update Caddyfile for new subdomain
8h9i0j1 Initial infrastructure setup
```

**Rollback if needed:**
```bash
git checkout 4e5f6g7
```

**Best practice: Commit often with descriptive messages!**

---

## Pre-Deployment Checklist

### Verify Repository Setup

**Run through this checklist:**

```
□ Repository cloned to ~/mywebclass_hosting
□ Git working (git --version shows version)
□ infrastructure/ directory exists
□ docker-compose.yml present
□ Caddyfile present
□ .env file created from .env.example
□ .env contains strong passwords (not defaults)
□ .env permissions set to 600
□ .env not tracked by git
□ PGADMIN_EMAIL set to your email
□ POSTGRES_DB set to database name
□ POSTGRES_USER set to username
□ projects/ directory exists
□ static-site/ project present
□ backend/ project present
□ Docker installed and running
□ Docker Compose installed
```

---

### Quick Verification Commands

**Verify repository structure:**
```bash
cd ~/mywebclass_hosting
ls -la
```

**Should see:**
```
infrastructure/
projects/
docs/
README.md
```

---

**Verify .env exists:**
```bash
ls -la ~/mywebclass_hosting/infrastructure/.env
```

**Should see:**
```
-rw------- 1 john john 280 Nov 12 11:00 .env
```

---

**Verify Docker working:**
```bash
docker --version
docker compose version
```

**Should show versions:**
```
Docker version 24.0.7
Docker Compose version v2.23.0
```

---

**Verify networks not created yet:**
```bash
docker network ls | grep web
```

**Should show nothing (we'll create in Chapter 17).**

---

## Understanding the Deployment Flow

### What Happens Next

**Chapter 17 will:**

1. **Create Docker networks**
   ```bash
   docker network create web
   docker network create internal
   ```

2. **Start infrastructure services**
   ```bash
   cd infrastructure
   docker compose up -d
   ```

3. **Verify services running**
   ```bash
   docker compose ps
   ```

4. **Test HTTPS working**
   ```
   Visit: https://db.mywebclass.org
   ```

5. **Access pgAdmin**
   ```
   Login with PGADMIN_EMAIL and PGADMIN_PASSWORD
   ```

---

### Deployment Architecture

**After deployment:**
```
Internet
   ↓
DNS (mywebclass.org → 45.55.209.47)
   ↓
Server (45.55.209.47)
   ↓
Caddy (ports 80, 443)
   ├─→ db.mywebclass.org → pgAdmin:80
   └─→ (will add more routes)
        ↓
      pgAdmin
        ↓
      PostgreSQL (internal network)
```

---

## Common Questions

### Q: Why separate infrastructure and projects?

**A:** Modularity and flexibility.

**Infrastructure services:**
- Shared across all projects
- Updated infrequently
- Core functionality (database, proxy)

**Projects:**
- Independent applications
- Updated frequently
- Can add/remove without affecting others

**Like a building:**
- Infrastructure = Foundation, utilities
- Projects = Apartments (independent units)

---

### Q: Can I modify the repository?

**A:** Yes! It's your copy.

**You can:**
- Add new projects
- Modify Caddyfile
- Change docker-compose.yml
- Add services
- Customize configuration

**Recommended:**
```bash
# Keep original as reference
git remote add upstream https://github.com/kaw393939/mywebclass_hosting.git

# Your changes
git add .
git commit -m "Add my custom project"

# Can pull updates if needed
git fetch upstream
git merge upstream/master
```

---

### Q: What if I want different domain?

**A:** Update Caddyfile with your domain.

**Current:**
```
db.mywebclass.org {
    reverse_proxy pgadmin:80
}
```

**Your domain:**
```
db.yourdomain.com {
    reverse_proxy pgadmin:80
}
```

**That's it! Caddy handles the rest.**

---

### Q: Can I use without Docker Compose?

**A:** Possible but not recommended.

**Without Compose:**
```bash
# Would need 10+ docker run commands
docker run -d --name caddy ...
docker run -d --name postgres ...
docker run -d --name pgadmin ...
docker network create ...
docker network connect ...
# etc.
```

**With Compose:**
```bash
docker compose up -d
```

**Compose simplifies multi-container deployment!**

---

### Q: Where are the actual files stored?

**Docker volumes:**
```bash
/var/lib/docker/volumes/
├── infrastructure_caddy_data/
├── infrastructure_caddy_config/
├── infrastructure_postgres_data/     ← Database here!
└── infrastructure_pgadmin_data/
```

**Access via:**
```bash
docker volume inspect infrastructure_postgres_data
```

**Backup volumes regularly!**

---

## Next Steps

**Repository setup complete!**

**In Chapter 17, you'll:**
1. Create Docker networks
2. Deploy infrastructure services
3. Verify Caddy working
4. Verify HTTPS with Let's Encrypt
5. Access pgAdmin web interface
6. Connect pgAdmin to PostgreSQL
7. Test database connection

**Almost there! Infrastructure deployment next.**

---

## Key Takeaways

**Remember:**

1. **Repository structure**
   - infrastructure/ - Core services
   - projects/ - Applications
   - docs/ - This course

2. **Environment variables**
   - .env file for secrets
   - Strong passwords required
   - Never commit .env to git
   - Permissions: 600

3. **Docker Compose**
   - Multi-container management
   - Networks for isolation
   - Volumes for persistence
   - Easy to deploy and manage

4. **Separation of concerns**
   - Infrastructure independent
   - Projects independent
   - Easy to scale
   - Clear organization

5. **Security first**
   - Strong passwords
   - Secure file permissions
   - Secrets not in code
   - Internal network isolation

---

## Quick Reference

### Essential Commands

**Clone repository:**
```bash
cd ~
git clone https://github.com/kaw393939/mywebclass_hosting.git
```

**Create .env file:**
```bash
cd ~/mywebclass_hosting/infrastructure
cp .env.example .env
nano .env
```

**Generate strong password:**
```bash
openssl rand -base64 32
```

**Secure .env file:**
```bash
chmod 600 .env
```

**Verify setup:**
```bash
cd ~/mywebclass_hosting
ls -la infrastructure/
ls -la infrastructure/.env
cat infrastructure/.gitignore
```

---

### Directory Structure

```
mywebclass_hosting/
├── infrastructure/
│   ├── docker-compose.yml    ← Core services
│   ├── Caddyfile              ← Routing configuration
│   ├── .env                   ← Your secrets (not in git)
│   └── .env.example           ← Template (in git)
├── projects/
│   ├── static-site/
│   │   └── docker-compose.yml
│   └── backend/
│       └── docker-compose.yml
└── docs/
    └── (course chapters)
```

---

### .env File Template

```bash
# PostgreSQL Database
POSTGRES_DB=mywebclass
POSTGRES_USER=dbadmin
POSTGRES_PASSWORD=<strong_random_password_here>

# pgAdmin
PGADMIN_EMAIL=admin@yourdomain.com
PGADMIN_PASSWORD=<different_strong_password_here>
```

---

[← Previous: Chapter 15 - Domain Configuration](15-domain-configuration.md) | [Next: Chapter 17 - Infrastructure Deployment →](17-infrastructure-deployment.md)
