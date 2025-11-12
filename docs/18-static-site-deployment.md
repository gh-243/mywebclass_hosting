# Chapter 18: Static Site Deployment

**Deploying Your First Web Application**

---

## Learning Objectives

By the end of this chapter, you'll be able to:
- ✅ Understand static site architecture
- ✅ Deploy a static website with Docker
- ✅ Configure Caddy routing for your site
- ✅ Access your website with HTTPS
- ✅ Test subdomain routing
- ✅ Customize your static site
- ✅ Update and redeploy changes
- ✅ Troubleshoot deployment issues

**Time Required:** 45-60 minutes

**Prerequisites:**
- Infrastructure deployed (Chapter 17)
- Caddy and pgAdmin working
- DNS configured for your domain

---

## Understanding Static Sites

### What is a Static Site?

**Static site = Pre-built HTML, CSS, JavaScript files**

**No server-side processing:**
```
Request comes in
   ↓
Server sends HTML file
   ↓
Browser displays page
```

**Everything happens in browser!**

---

### Static vs. Dynamic

**Static site:**
```html
<!-- File: index.html -->
<html>
<body>
  <h1>Welcome!</h1>
  <p>This is a static page.</p>
</body>
</html>
```

**Same for every visitor:**
- No database queries
- No user-specific content
- Fast and simple
- Easy to cache

---

**Dynamic site:**
```javascript
// Backend generates HTML
app.get('/', (req, res) => {
  const user = database.getUser(req.userId);
  res.render('index', { username: user.name });
});
```

**Different for each visitor:**
- Database queries
- User-specific content
- More complex
- Covered in Chapter 19

---

### When to Use Static Sites

**Perfect for:**
- Personal portfolios
- Documentation
- Marketing sites
- Blogs (with static generator)
- Landing pages
- Company information sites

**Not suitable for:**
- User accounts/login
- Real-time data
- Complex interactions
- E-commerce (usually)
- Social networks

---

## Static Site Architecture

### How It Works

**Our setup:**
```
Internet
   ↓
DNS: www.mywebclass.org → 45.55.209.47
   ↓
Caddy (reverse proxy)
   ↓
Nginx container (serves static files)
   ↓
HTML/CSS/JS files
```

---

**Why Nginx inside container?**
- Optimized for serving static files
- Fast and efficient
- Easy to configure
- Industry standard

**Caddy handles:**
- HTTPS/SSL certificates
- Routing by domain
- Security headers

**Nginx handles:**
- Serving files
- Compression
- Caching headers

---

## Reviewing the Static Site Project

### Navigate to Project

**Change to project directory:**
```bash
cd ~/mywebclass_hosting/projects/static-site
```

**List files:**
```bash
ls -la
```

**Should see:**
```
-rw-rw-r-- 1 john john  650 Nov 12 10:30 docker-compose.yml
-rw-rw-r-- 1 john john  280 Nov 12 10:30 Dockerfile
-rw-rw-r-- 1 john john  320 Nov 12 10:30 nginx.conf
drwxrwxr-x 2 john john 4096 Nov 12 10:30 public
-rw-rw-r-- 1 john john  450 Nov 12 10:30 README.md
```

---

### Review Dockerfile

**View the file:**
```bash
cat Dockerfile
```

**Expected content:**
```dockerfile
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy static files
COPY public /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Nginx stays in foreground
CMD ["nginx", "-g", "daemon off;"]
```

---

**What it does:**

**1. Base image:**
```dockerfile
FROM nginx:alpine
```
- Uses official Nginx image
- Alpine = minimal Linux (5MB!)
- Fast and secure

**2. Copy nginx config:**
```dockerfile
COPY nginx.conf /etc/nginx/nginx.conf
```
- Custom configuration
- Optimized for static serving

**3. Copy website files:**
```dockerfile
COPY public /usr/share/nginx/html
```
- All HTML/CSS/JS files
- /usr/share/nginx/html = Nginx default directory

**4. Run Nginx:**
```dockerfile
CMD ["nginx", "-g", "daemon off;"]
```
- Start Nginx
- Stay in foreground (required for Docker)

---

### Review nginx.conf

**View configuration:**
```bash
cat nginx.conf
```

**Example content:**
```nginx
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;
    keepalive_timeout 65;
    gzip on;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

---

**Key settings:**

**Listen on port 80:**
```nginx
listen 80;
```
**Internal port (Caddy proxies to this)**

**Root directory:**
```nginx
root /usr/share/nginx/html;
```
**Where files are located**

**Default file:**
```nginx
index index.html;
```
**Serve index.html by default**

**SPA routing:**
```nginx
try_files $uri $uri/ /index.html;
```
**Falls back to index.html (for React, Vue, etc.)**

**Static asset caching:**
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
}
```
**Browser caches images/CSS/JS for 1 year**

---

### Review docker-compose.yml

**View file:**
```bash
cat docker-compose.yml
```

**Content:**
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

---

**What it does:**

**Build from Dockerfile:**
```yaml
build: .
```
**Uses Dockerfile in current directory**

**Container name:**
```yaml
container_name: static-site
```
**Easy to reference**

**Auto-restart:**
```yaml
restart: unless-stopped
```
**Restarts if crashes or server reboots**

**Connect to web network:**
```yaml
networks:
  - web
```
**Same network as Caddy (can communicate)**

---

### Review Public Directory

**See website files:**
```bash
ls -la public/
```

**Should see:**
```
-rw-rw-r-- 1 john john 1250 Nov 12 10:30 index.html
-rw-rw-r-- 1 john john  850 Nov 12 10:30 style.css
-rw-rw-r-- 1 john john  320 Nov 12 10:30 script.js
```

---

**View homepage:**
```bash
cat public/index.html
```

**Example:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Web Class - Hosting Platform</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>Welcome to My Web Class</h1>
        <p>Your website is live!</p>
    </header>
    
    <main>
        <section>
            <h2>About This Site</h2>
            <p>This is a static website hosted on your own infrastructure.</p>
            <ul>
                <li>✅ Automatic HTTPS</li>
                <li>✅ Fast Nginx serving</li>
                <li>✅ Docker containerized</li>
                <li>✅ Production ready</li>
            </ul>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2024 My Web Class</p>
    </footer>
    
    <script src="script.js"></script>
</body>
</html>
```

**Simple, clean, functional!**

---

## Configuring Caddy Routing

### Update Caddyfile

**Navigate to infrastructure:**
```bash
cd ~/mywebclass_hosting/infrastructure
```

**Backup current Caddyfile:**
```bash
cp Caddyfile Caddyfile.backup
```

---

**Edit Caddyfile:**
```bash
nano Caddyfile
```

**Current content:**
```
db.mywebclass.org {
    reverse_proxy pgadmin:80
}
```

---

**Add routing for static site:**
```
# Static website
www.mywebclass.org {
    reverse_proxy static-site:80
}

mywebclass.org {
    reverse_proxy static-site:80
}

# Database admin
db.mywebclass.org {
    reverse_proxy pgadmin:80
}
```

**Replace `mywebclass.org` with your domain!**

---

**What this does:**

**www subdomain:**
```
www.mywebclass.org → static-site container
```

**Root domain:**
```
mywebclass.org → static-site container
```

**Database subdomain:**
```
db.mywebclass.org → pgadmin container
```

---

**Save and exit:**
```
Ctrl+X
Y (yes)
Enter
```

---

### Reload Caddy Configuration

**Test configuration first:**
```bash
docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile
```

**Should show:**
```
Valid configuration
```

---

**Reload Caddy (no downtime!):**
```bash
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

**Output:**
```
INFO    admin.api       admin endpoint started   {"address": "tcp/localhost:2019", "enforce_origin": false, "origins": ["localhost:2019", "[::1]:2019", "127.0.0.1:2019"]}
INFO    reloaded configuration  {"success": true}
```

**"success": true = Configuration loaded! ✓**

---

**Check Caddy logs:**
```bash
docker compose logs caddy | tail -20
```

**Look for:**
```
{"level":"info","msg":"obtaining certificate","identifier":"www.mywebclass.org"}
{"level":"info","msg":"obtaining certificate","identifier":"mywebclass.org"}
{"level":"info","msg":"certificate obtained successfully"}
```

**Caddy will get certificates on first request.**

---

## Deploying Static Site

### Build and Start Container

**Navigate to project:**
```bash
cd ~/mywebclass_hosting/projects/static-site
```

**Build and start:**
```bash
docker compose up -d --build
```

**Explanation:**
- `up` - Start services
- `-d` - Detached (background)
- `--build` - Build image first

---

**Output:**
```
[+] Building 15.2s (10/10) FINISHED
 => [internal] load build definition from Dockerfile
 => => transferring dockerfile: 250B
 => [internal] load .dockerignore
 => [internal] load metadata for docker.io/library/nginx:alpine
 => [1/3] FROM docker.io/library/nginx:alpine
 => [internal] load build context
 => => transferring context: 4.5kB
 => [2/3] COPY nginx.conf /etc/nginx/nginx.conf
 => [3/3] COPY public /usr/share/nginx/html
 => exporting to image
 => => exporting layers
 => => writing image sha256:abc123...
 => => naming to docker.io/library/static-site
[+] Running 1/1
 ✔ Container static-site  Started
```

**Build takes 10-20 seconds first time (downloads nginx:alpine).**

---

### Verify Container Running

**Check status:**
```bash
docker compose ps
```

**Should show:**
```
NAME         IMAGE        STATUS        PORTS
static-site  static-site  Up 1 minute   80/tcp
```

**"Up" = Running! ✓**

---

**Check logs:**
```bash
docker compose logs
```

**Should see:**
```
static-site-1  | /docker-entrypoint.sh: Configuration complete; ready for start up
static-site-1  | 2024/11/12 15:30:00 [notice] 1#1: start worker process 29
```

**"ready for start up" = Working! ✓**

---

### Verify Network Connection

**Check container on web network:**
```bash
docker network inspect web | grep -A 3 static-site
```

**Should show:**
```
"static-site": {
    "IPv4Address": "172.18.0.4/16",
    ...
}
```

**On web network ✓**

---

**Test connectivity from Caddy:**
```bash
docker compose -f ~/mywebclass_hosting/infrastructure/docker-compose.yml exec caddy wget -O- http://static-site:80 | head -20
```

**Should show HTML content:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Web Class - Hosting Platform</title>
...
```

**Caddy can reach static-site ✓**

---

## Testing Your Website

### Access via Browser

**Open browser and navigate to:**
```
https://www.mywebclass.org
```

**(Replace with your domain)**

---

**What should happen:**

1. **Browser connects**
2. **Caddy gets Let's Encrypt certificate (first request)**
3. **HTTPS established**
4. **Caddy proxies to static-site:80**
5. **Nginx serves index.html**
6. **Website displays!**

---

**Expected result:**

```
┌──────────────────────────────────────┐
│  Welcome to My Web Class             │
│  Your website is live!               │
│                                      │
│  About This Site                     │
│  This is a static website hosted     │
│  on your own infrastructure.         │
│                                      │
│  ✅ Automatic HTTPS                  │
│  ✅ Fast Nginx serving               │
│  ✅ Docker containerized             │
│  ✅ Production ready                 │
│                                      │
│  © 2024 My Web Class                 │
└──────────────────────────────────────┘
```

**With green padlock (HTTPS)! ✓✓✓**

---

### Test Root Domain

**Also try:**
```
https://mywebclass.org
```

**(Without www)**

**Should show same website!**

**Both work because Caddyfile has both entries.**

---

### Verify HTTPS Certificate

**Check certificate:**

**In browser:**
1. Click padlock icon
2. View certificate details

**Should show:**
```
Issued to: www.mywebclass.org
Issued by: Let's Encrypt
Valid: 90 days
```

**And also for:**
```
Issued to: mywebclass.org
```

**Both domains have certificates! ✓**

---

### Test from Command Line

**Test HTTP→HTTPS redirect:**
```bash
curl -I http://www.mywebclass.org
```

**Should show:**
```
HTTP/1.1 308 Permanent Redirect
Location: https://www.mywebclass.org/
```

**Automatic HTTPS redirect! ✓**

---

**Test HTTPS:**
```bash
curl -I https://www.mywebclass.org
```

**Should show:**
```
HTTP/2 200
server: Caddy
content-type: text/html
```

**HTTP/2 = Modern protocol! ✓**

---

**Get full HTML:**
```bash
curl https://www.mywebclass.org
```

**Should show:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    ...
```

**Working perfectly! ✓**

---

## Customizing Your Site

### Update Content

**Edit homepage:**
```bash
nano ~/mywebclass_hosting/projects/static-site/public/index.html
```

**Make changes:**
```html
<header>
    <h1>Welcome to John's Portfolio</h1>
    <p>Software Developer | Designer | Creator</p>
</header>
```

**Save and exit:**
```
Ctrl+X, Y, Enter
```

---

### Rebuild and Deploy

**Rebuild container:**
```bash
cd ~/mywebclass_hosting/projects/static-site
docker compose up -d --build
```

**Output:**
```
[+] Building 2.1s (10/10) FINISHED
 => [2/3] COPY nginx.conf /etc/nginx/nginx.conf
 => [3/3] COPY public /usr/share/nginx/html
 => exporting to image
[+] Running 1/1
 ✔ Container static-site  Started
```

**Rebuild much faster (cached layers).**

---

**Verify changes:**
```bash
curl https://www.mywebclass.org | grep -o "<h1>.*</h1>"
```

**Should show:**
```html
<h1>Welcome to John's Portfolio</h1>
```

**Changes live! ✓**

---

### Add New Pages

**Create about page:**
```bash
nano ~/mywebclass_hosting/projects/static-site/public/about.html
```

**Add content:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About - My Web Class</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>About Me</h1>
        <nav>
            <a href="/">Home</a>
            <a href="/about.html">About</a>
        </nav>
    </header>
    
    <main>
        <h2>My Story</h2>
        <p>This is my about page...</p>
    </main>
    
    <footer>
        <p>&copy; 2024 My Web Class</p>
    </footer>
</body>
</html>
```

---

**Rebuild:**
```bash
docker compose up -d --build
```

**Access new page:**
```
https://www.mywebclass.org/about.html
```

**New page live! ✓**

---

### Add Images

**Create images directory:**
```bash
mkdir ~/mywebclass_hosting/projects/static-site/public/images
```

**Copy or download image:**
```bash
# Example: download placeholder
curl -o ~/mywebclass_hosting/projects/static-site/public/images/hero.jpg \
  https://via.placeholder.com/800x400
```

---

**Use in HTML:**
```html
<img src="/images/hero.jpg" alt="Hero Image">
```

**Rebuild and deploy:**
```bash
docker compose up -d --build
```

**Image displays on site! ✓**

---

## Monitoring Your Site

### View Access Logs

**Check Nginx access logs:**
```bash
docker compose logs -f static-site
```

**Shows:**
```
172.18.0.2 - - [12/Nov/2024:15:45:00 +0000] "GET / HTTP/1.1" 200 1250
172.18.0.2 - - [12/Nov/2024:15:45:01 +0000] "GET /style.css HTTP/1.1" 200 850
172.18.0.2 - - [12/Nov/2024:15:45:01 +0000] "GET /script.js HTTP/1.1" 200 320
```

**Every request logged!**

---

### Check from Caddy

**Caddy logs show proxied requests:**
```bash
docker compose -f ~/mywebclass_hosting/infrastructure/docker-compose.yml logs -f caddy
```

**Shows:**
```json
{"level":"info","ts":1699808700,"msg":"handled request","request":{"method":"GET","uri":"/","proto":"HTTP/2.0","remote_addr":"203.0.113.50:51234","host":"www.mywebclass.org"},"status":200}
```

**Full request details!**

---

### Monitor Resource Usage

**Check container resources:**
```bash
docker stats static-site
```

**Shows:**
```
CONTAINER ID   NAME         CPU %   MEM USAGE / LIMIT   MEM %
abc123def456   static-site  0.01%   5.2MiB / 3.84GiB    0.13%
```

**Nginx is very lightweight! ✓**

---

## Troubleshooting

### Issue 1: Website Not Accessible

**Problem:** "This site can't be reached"

**Check 1: Container running?**
```bash
docker compose ps
```
**Should show "Up"**

---

**Check 2: Caddy routing configured?**
```bash
cat ~/mywebclass_hosting/infrastructure/Caddyfile | grep www
```
**Should show your domain**

---

**Check 3: Caddy reloaded?**
```bash
docker compose -f ~/mywebclass_hosting/infrastructure/docker-compose.yml logs caddy | grep reload
```

---

**Check 4: DNS working?**
```bash
dig www.mywebclass.org +short
```
**Should return server IP**

---

**Check 5: Firewall allows traffic?**
```bash
sudo ufw status | grep -E '80|443'
```
**Should show ALLOW**

---

### Issue 2: Changes Not Appearing

**Problem:** Updated files but website still shows old content

**Solution 1: Rebuild container**
```bash
cd ~/mywebclass_hosting/projects/static-site
docker compose up -d --build
```

**Solution 2: Clear browser cache**
```
Ctrl+Shift+R (hard refresh)
or
Ctrl+Shift+Delete (clear cache)
```

**Solution 3: Force Docker to rebuild without cache**
```bash
docker compose build --no-cache
docker compose up -d
```

---

### Issue 3: 502 Bad Gateway

**Problem:** Caddy shows "502 Bad Gateway"

**Means:** Caddy can't reach static-site container

**Check 1: Container running?**
```bash
docker compose ps
```

**Check 2: Same network?**
```bash
docker network inspect web | grep static-site
```

**Check 3: Container name correct?**
```bash
docker ps | grep static-site
```
**Should match Caddyfile (static-site:80)**

**Check 4: Nginx running in container?**
```bash
docker compose exec static-site ps aux | grep nginx
```
**Should show nginx processes**

---

### Issue 4: 404 Not Found

**Problem:** Homepage works, but other pages show 404

**Check 1: File exists?**
```bash
ls ~/mywebclass_hosting/projects/static-site/public/about.html
```

**Check 2: Rebuilt after adding file?**
```bash
docker compose up -d --build
```

**Check 3: File in container?**
```bash
docker compose exec static-site ls -la /usr/share/nginx/html/
```

**Should list all files including new one**

---

### Issue 5: Images Not Loading

**Problem:** HTML loads but images broken

**Check 1: Image path correct?**
```html
<!-- Correct -->
<img src="/images/photo.jpg">

<!-- Wrong (no leading /) -->
<img src="images/photo.jpg">
```

**Check 2: Image in public directory?**
```bash
ls ~/mywebclass_hosting/projects/static-site/public/images/
```

**Check 3: Image copied to container?**
```bash
docker compose exec static-site ls /usr/share/nginx/html/images/
```

**Check 4: MIME type correct?**
```bash
# Check Nginx MIME types
docker compose exec static-site cat /etc/nginx/mime.types | grep jpg
```

---

## Multiple Static Sites

### Deploy Additional Sites

**You can host multiple static sites!**

**Example structure:**
```
projects/
├── static-site/          ← Main site (www)
├── blog/                 ← Blog (blog.mywebclass.org)
└── portfolio/            ← Portfolio (portfolio.mywebclass.org)
```

---

**For each site:**

**1. Copy static-site template:**
```bash
cp -r ~/mywebclass_hosting/projects/static-site ~/mywebclass_hosting/projects/blog
```

**2. Update content:**
```bash
nano ~/mywebclass_hosting/projects/blog/public/index.html
```

**3. Change container name:**
```bash
nano ~/mywebclass_hosting/projects/blog/docker-compose.yml
```
```yaml
services:
  blog:  # Changed from static-site
    container_name: blog  # Changed
```

**4. Deploy:**
```bash
cd ~/mywebclass_hosting/projects/blog
docker compose up -d --build
```

**5. Add to Caddyfile:**
```bash
nano ~/mywebclass_hosting/infrastructure/Caddyfile
```
```
blog.mywebclass.org {
    reverse_proxy blog:80
}
```

**6. Reload Caddy:**
```bash
docker compose -f ~/mywebclass_hosting/infrastructure/docker-compose.yml exec caddy caddy reload --config /etc/caddy/Caddyfile
```

**New site live! ✓**

---

## Performance Optimization

### Enable Caching

**Already configured in nginx.conf:**
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**This tells browsers:**
- Cache images/CSS/JS for 1 year
- Don't check for updates
- Faster subsequent page loads

---

### Compress Assets

**Gzip already enabled:**
```nginx
gzip on;
```

**Compresses text files (HTML, CSS, JS) automatically.**

**Test compression:**
```bash
curl -H "Accept-Encoding: gzip" -I https://www.mywebclass.org
```

**Should show:**
```
Content-Encoding: gzip
```

---

### Optimize Images

**Before uploading images:**
```bash
# Install imagemagick
sudo apt install imagemagick

# Optimize JPEG
convert original.jpg -quality 85 -strip optimized.jpg

# Optimize PNG
pngquant original.png --output optimized.png
```

**Smaller images = faster load times!**

---

## Next Steps

**Static site deployed! ✓**

**What you've accomplished:**
- ✅ Built Docker image with Nginx
- ✅ Deployed containerized static site
- ✅ Configured Caddy routing
- ✅ Automatic HTTPS working
- ✅ Multiple domains supported
- ✅ Production-ready setup

**In Chapter 19:**
- Deploy backend application
- Connect to PostgreSQL database
- Environment variables
- API endpoints
- Full-stack architecture

---

## Key Takeaways

**Remember:**

1. **Static sites are simple but powerful**
   - No server-side logic
   - Fast and secure
   - Easy to deploy
   - Perfect for many use cases

2. **Docker makes deployment easy**
   - Consistent environment
   - Easy to rebuild
   - Quick deployments
   - Portable across hosts

3. **Caddy handles routing**
   - Automatic HTTPS
   - Multiple domains
   - Zero-downtime reloads
   - Simple configuration

4. **Nginx serves files efficiently**
   - Optimized for static content
   - Caching headers
   - Compression
   - Industry standard

5. **Monitoring is important**
   - Check logs regularly
   - Monitor resource usage
   - Test after changes
   - Verify certificates

---

## Quick Reference

### Deploy Commands

**Build and start:**
```bash
cd ~/mywebclass_hosting/projects/static-site
docker compose up -d --build
```

**Rebuild after changes:**
```bash
docker compose up -d --build
```

**View logs:**
```bash
docker compose logs -f
```

**Stop:**
```bash
docker compose down
```

**Restart:**
```bash
docker compose restart
```

---

### Caddy Commands

**Update Caddyfile:**
```bash
nano ~/mywebclass_hosting/infrastructure/Caddyfile
```

**Reload Caddy:**
```bash
cd ~/mywebclass_hosting/infrastructure
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

**Validate config:**
```bash
docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile
```

---

### Testing Commands

**Test HTTP→HTTPS redirect:**
```bash
curl -I http://www.mywebclass.org
```

**Test HTTPS:**
```bash
curl -I https://www.mywebclass.org
```

**Get full content:**
```bash
curl https://www.mywebclass.org
```

**Check DNS:**
```bash
dig www.mywebclass.org +short
```

---

### File Locations

```
Static site project:
~/mywebclass_hosting/projects/static-site/

Website files:
~/mywebclass_hosting/projects/static-site/public/

Nginx config:
~/mywebclass_hosting/projects/static-site/nginx.conf

Caddy routing:
~/mywebclass_hosting/infrastructure/Caddyfile
```

---

[← Previous: Chapter 17 - Infrastructure Deployment](17-infrastructure-deployment.md) | [Next: Chapter 19 - Backend Application Deployment →](19-backend-deployment.md)
