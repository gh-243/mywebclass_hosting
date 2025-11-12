# Chapter 19: Backend Application Deployment

**Deploying Full-Stack Applications with Database**

---

## Learning Objectives

By the end of this chapter, you'll be able to:
- ✅ Understand backend application architecture
- ✅ Deploy Node.js application with Docker
- ✅ Connect application to PostgreSQL database
- ✅ Configure environment variables securely
- ✅ Set up database migrations
- ✅ Test API endpoints
- ✅ Monitor application logs
- ✅ Troubleshoot common issues
- ✅ Understand full-stack deployment

**Time Required:** 60-90 minutes

**Prerequisites:**
- Infrastructure deployed (Chapter 17)
- Static site deployed (Chapter 18)
- PostgreSQL and pgAdmin working
- Understanding of APIs and databases

---

## Understanding Backend Applications

### What is a Backend?

**Backend = Server-side logic and data processing**

**Handles:**
- Business logic
- Database operations
- Authentication
- API endpoints
- Data validation
- Security

---

### Backend vs. Frontend

**Frontend (Static site):**
```javascript
// Runs in browser
fetch('/api/users')
  .then(res => res.json())
  .then(users => displayUsers(users));
```

**Backend (Server):**
```javascript
// Runs on server
app.get('/api/users', async (req, res) => {
  const users = await database.query('SELECT * FROM users');
  res.json(users);
});
```

---

### Full-Stack Architecture

**Our complete setup:**
```
Browser
   ↓
[Static Site] (HTML/CSS/JS)
   ↓
Fetch API call → /api/users
   ↓
[Backend App] (Node.js)
   ↓
SQL Query
   ↓
[PostgreSQL Database]
   ↓
Return data
   ↓
[Backend] formats as JSON
   ↓
[Frontend] displays data
```

---

## Backend Application Architecture

### Technology Stack

**Our backend uses:**
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **PostgreSQL** - Database
- **Pg** - PostgreSQL client library
- **Docker** - Containerization

---

### Network Architecture

**How components connect:**
```
Internet
   ↓
Caddy (web network)
   ├─→ static-site:80
   └─→ backend:3000 (NEW!)
        ↓
      (web + internal networks)
        ↓
      PostgreSQL (internal network)
```

**Backend on BOTH networks:**
- **web** - Receives traffic from Caddy
- **internal** - Connects to PostgreSQL

---

## Reviewing Backend Project

### Navigate to Project

**Change to backend directory:**
```bash
cd ~/mywebclass_hosting/projects/backend
```

**List files:**
```bash
ls -la
```

**Should see:**
```
-rw-rw-r-- 1 john john  1100 Nov 12 10:30 docker-compose.yml
-rw-rw-r-- 1 john john   450 Nov 12 10:30 Dockerfile
-rw-rw-r-- 1 john john   380 Nov 12 10:30 .env.example
-rw-rw-r-- 1 john john   850 Nov 12 10:30 package.json
drwxrwxr-x 2 john john  4096 Nov 12 10:30 src
-rw-rw-r-- 1 john john   650 Nov 12 10:30 README.md
```

---

### Review package.json

**View dependencies:**
```bash
cat package.json
```

**Expected content:**
```json
{
  "name": "backend-app",
  "version": "1.0.0",
  "description": "Backend API with PostgreSQL",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

**Key dependencies:**

**Express:**
```javascript
const express = require('express');
const app = express();
```
**Web framework for routing and middleware**

**pg (node-postgres):**
```javascript
const { Pool } = require('pg');
const pool = new Pool({ ... });
```
**PostgreSQL client library**

**cors:**
```javascript
app.use(cors());
```
**Allow cross-origin requests (frontend→backend)**

**dotenv:**
```javascript
require('dotenv').config();
```
**Load environment variables from .env**

---

### Review Dockerfile

**View file:**
```bash
cat Dockerfile
```

**Content:**
```dockerfile
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY src ./src

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

---

**What it does:**

**1. Base image:**
```dockerfile
FROM node:20-alpine
```
**Node.js 20 on Alpine Linux (minimal)**

**2. Set working directory:**
```dockerfile
WORKDIR /app
```
**All commands run in /app**

**3. Install dependencies:**
```dockerfile
COPY package*.json ./
RUN npm install --production
```
**Production dependencies only (no dev tools)**

**4. Copy code:**
```dockerfile
COPY src ./src
```
**Application source code**

**5. Run app:**
```dockerfile
CMD ["npm", "start"]
```
**Executes: node src/index.js**

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
  backend:
    build: .
    container_name: backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - PORT=3000
    env_file:
      - .env
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

---

**Key configuration:**

**Environment variables:**
```yaml
environment:
  - NODE_ENV=production
  - DATABASE_URL=postgresql://...
  - PORT=3000
```

**DATABASE_URL format:**
```
postgresql://username:password@host:port/database
postgresql://dbadmin:secretpass@postgres:5432/mywebclass
```

**Uses variables from infrastructure .env file!**

---

**Load additional .env:**
```yaml
env_file:
  - .env
```
**Backend can have own .env for app-specific config**

**Networks:**
```yaml
networks:
  - web       # Receive traffic from Caddy
  - internal  # Connect to PostgreSQL
```

**Depends on:**
```yaml
depends_on:
  - postgres
```
**Wait for PostgreSQL to start first**

---

### Review Source Code

**See application files:**
```bash
ls -la src/
```

**Should see:**
```
-rw-rw-r-- 1 john john 2100 Nov 12 10:30 index.js
-rw-rw-r-- 1 john john  850 Nov 12 10:30 database.js
-rw-rw-r-- 1 john john  650 Nov 12 10:30 schema.sql
```

---

**View main application:**
```bash
cat src/index.js
```

**Example content:**
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email FROM users ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user
app.post('/api/users', async (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email required' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize database and start server
async function start() {
  try {
    await initializeDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
```

---

**Key endpoints:**

**Health check:**
```javascript
GET /health
→ { "status": "healthy", "timestamp": "..." }
```

**Get users:**
```javascript
GET /api/users
→ [{ "id": 1, "name": "John", "email": "john@example.com" }, ...]
```

**Create user:**
```javascript
POST /api/users
Body: { "name": "Jane", "email": "jane@example.com" }
→ { "id": 2, "name": "Jane", "email": "jane@example.com" }
```

---

**View database module:**
```bash
cat src/database.js
```

**Example:**
```javascript
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// Initialize database schema
async function initializeDatabase() {
  try {
    console.log('Initializing database schema...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schemaSQL);
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

module.exports = { pool, initializeDatabase };
```

---

**View database schema:**
```bash
cat src/schema.sql
```

**Example:**
```sql
-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert sample data if table is empty
INSERT INTO users (name, email)
SELECT 'John Doe', 'john@example.com'
WHERE NOT EXISTS (SELECT 1 FROM users);

INSERT INTO users (name, email)
SELECT 'Jane Smith', 'jane@example.com'
WHERE NOT EXISTS (SELECT 1 FROM users LIMIT 1);
```

**Creates table and sample data on startup!**

---

## Configuring Environment Variables

### Create .env File

**Copy example:**
```bash
cd ~/mywebclass_hosting/projects/backend
cp .env.example .env
```

**Edit if needed:**
```bash
nano .env
```

**Example content:**
```bash
# Application
NODE_ENV=production
PORT=3000

# Database (loaded from infrastructure/.env via docker-compose)
# DATABASE_URL is constructed in docker-compose.yml
```

---

**Note:** Database credentials come from infrastructure .env:
```bash
cat ~/mywebclass_hosting/infrastructure/.env | grep POSTGRES
```

**docker-compose.yml references these:**
```yaml
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
```

---

**Secure .env file:**
```bash
chmod 600 .env
```

**Verify not tracked by git:**
```bash
git status
```

**Should NOT list .env file.**

---

## Configuring Caddy Routing

### Update Caddyfile

**Navigate to infrastructure:**
```bash
cd ~/mywebclass_hosting/infrastructure
```

**Edit Caddyfile:**
```bash
nano Caddyfile
```

---

**Current content:**
```
www.mywebclass.org {
    reverse_proxy static-site:80
}

mywebclass.org {
    reverse_proxy static-site:80
}

db.mywebclass.org {
    reverse_proxy pgadmin:80
}
```

---

**Add API routing:**
```
# API Backend
api.mywebclass.org {
    reverse_proxy backend:3000
}

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

**Alternative: Path-based routing**
```
mywebclass.org {
    # API endpoints
    route /api/* {
        reverse_proxy backend:3000
    }
    
    # Everything else → static site
    reverse_proxy static-site:80
}
```

**Subdomain cleaner, but both work!**

---

**Save and exit:**
```
Ctrl+X, Y, Enter
```

---

### Reload Caddy

**Validate configuration:**
```bash
docker compose exec caddy caddy validate --config /etc/caddy/Caddyfile
```

**Should show:**
```
Valid configuration
```

---

**Reload Caddy:**
```bash
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

**Output:**
```
{"level":"info","msg":"reloaded configuration","success":true}
```

---

## Deploying Backend Application

### Build and Start

**Navigate to backend project:**
```bash
cd ~/mywebclass_hosting/projects/backend
```

**Build and start:**
```bash
docker compose up -d --build
```

**Output:**
```
[+] Building 25.3s (11/11) FINISHED
 => [internal] load build definition
 => [internal] load .dockerignore
 => [internal] load metadata for docker.io/library/node:20-alpine
 => [1/5] FROM docker.io/library/node:20-alpine
 => [internal] load build context
 => [2/5] WORKDIR /app
 => [3/5] COPY package*.json ./
 => [4/5] RUN npm install --production
 => [5/5] COPY src ./src
 => exporting to image
 => => naming to docker.io/library/backend
[+] Running 1/1
 ✔ Container backend  Started
```

**First build takes 20-30 seconds (downloads Node.js, installs npm packages).**

---

### Verify Container Running

**Check status:**
```bash
docker compose ps
```

**Should show:**
```
NAME      IMAGE     STATUS        PORTS
backend   backend   Up 1 minute   3000/tcp
```

**"Up" = Running! ✓**

---

### Check Logs

**View startup logs:**
```bash
docker compose logs
```

**Should see:**
```
backend-1  | Initializing database schema...
backend-1  | Connected to PostgreSQL database
backend-1  | Database schema initialized successfully
backend-1  | Server running on port 3000
backend-1  | Environment: production
```

**"Server running" = Working! ✓**

---

**Follow logs in real-time:**
```bash
docker compose logs -f
```

**Press Ctrl+C to stop following.**

---

### Verify Network Connections

**Check on web network:**
```bash
docker network inspect web | grep -A 3 backend
```

**Should show:**
```
"backend": {
    "IPv4Address": "172.18.0.5/16",
    ...
}
```

---

**Check on internal network:**
```bash
docker network inspect internal | grep -A 3 backend
```

**Should show backend connected.**

---

**Test connectivity to PostgreSQL:**
```bash
docker compose exec backend ping -c 3 postgres
```

**Should show:**
```
PING postgres (172.19.0.2): 56 data bytes
64 bytes from 172.19.0.2: seq=0 ttl=64 time=0.123 ms
```

**Can reach PostgreSQL! ✓**

---

## Testing API Endpoints

### Test Health Check

**From server:**
```bash
curl http://backend:3000/health
```

**Wait, that won't work from host!**

**Try from another container:**
```bash
docker compose exec backend wget -O- http://localhost:3000/health
```

**Or test via Caddy:**
```bash
curl https://api.mywebclass.org/health
```

---

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-12T16:30:00.123Z"
}
```

**API working! ✓**

---

### Test Get Users

**Get all users:**
```bash
curl https://api.mywebclass.org/api/users
```

**Expected response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com"
  }
]
```

**Sample data from schema.sql! ✓**

---

### Test Create User

**Create new user:**
```bash
curl -X POST https://api.mywebclass.org/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Johnson", "email": "alice@example.com"}'
```

**Expected response:**
```json
{
  "id": 3,
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "created_at": "2024-11-12T16:31:00.456Z"
}
```

**User created! ✓**

---

**Verify user added:**
```bash
curl https://api.mywebclass.org/api/users
```

**Should now show 3 users including Alice.**

---

### Test from Browser

**Open browser:**
```
https://api.mywebclass.org/health
```

**Should show JSON:**
```json
{"status":"healthy","timestamp":"2024-11-12T16:30:00.123Z"}
```

---

**Get users:**
```
https://api.mywebclass.org/api/users
```

**Should show user list as JSON.**

---

### Test Error Handling

**Test validation:**
```bash
curl -X POST https://api.mywebclass.org/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob"}'
```

**Missing email, should return error:**
```json
{
  "error": "Name and email required"
}
```

**Validation working! ✓**

---

**Test duplicate email:**
```bash
curl -X POST https://api.mywebclass.org/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Duplicate", "email": "john@example.com"}'
```

**Should return error (email UNIQUE constraint):**
```json
{
  "error": "Internal server error"
}
```

**Check logs:**
```bash
docker compose logs backend | tail -5
```

**Should show:**
```
Error creating user: duplicate key value violates unique constraint "users_email_key"
```

**Error handling working! ✓**

---

## Verifying Database Connection

### Check Database via pgAdmin

**Open pgAdmin:**
```
https://db.mywebclass.org
```

**Navigate to:**
```
Servers
  └── Production Database
      └── Databases
          └── mywebclass
              └── Schemas
                  └── public
                      └── Tables
                          └── users
```

---

**Right-click "users" → View/Edit Data → All Rows**

**Should see:**
```
id | name          | email               | created_at
---+---------------+---------------------+-------------------
 1 | John Doe      | john@example.com    | 2024-11-12 16:00:00
 2 | Jane Smith    | jane@example.com    | 2024-11-12 16:00:00
 3 | Alice Johnson | alice@example.com   | 2024-11-12 16:31:00
```

**Data from API in database! ✓**

---

### Query Database Directly

**Run SQL query in pgAdmin:**
```sql
SELECT * FROM users ORDER BY created_at DESC;
```

**Should match API results.**

---

**Check table structure:**
```sql
\d users
```

**Or:**
```sql
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users';
```

**Shows:**
```
column_name | data_type         | character_maximum_length
------------+-------------------+--------------------------
id          | integer           | 
name        | character varying | 255
email       | character varying | 255
created_at  | timestamp         | 
```

---

## Integrating with Frontend

### Update Static Site

**Edit static site to call API:**
```bash
nano ~/mywebclass_hosting/projects/static-site/public/index.html
```

**Add:**
```html
<section id="users">
    <h2>Users from API</h2>
    <div id="user-list">Loading...</div>
</section>

<script>
// Fetch users from API
fetch('https://api.mywebclass.org/api/users')
  .then(response => response.json())
  .then(users => {
    const userList = document.getElementById('user-list');
    userList.innerHTML = users.map(user => `
      <div class="user">
        <strong>${user.name}</strong> - ${user.email}
      </div>
    `).join('');
  })
  .catch(error => {
    console.error('Error fetching users:', error);
    document.getElementById('user-list').innerHTML = 'Error loading users';
  });
</script>
```

---

**Rebuild static site:**
```bash
cd ~/mywebclass_hosting/projects/static-site
docker compose up -d --build
```

---

**Visit website:**
```
https://www.mywebclass.org
```

**Should show users from API! ✓**

**Full-stack working!**

---

## Monitoring Backend Application

### View Logs

**Follow application logs:**
```bash
cd ~/mywebclass_hosting/projects/backend
docker compose logs -f
```

**Shows:**
```
backend-1  | GET /health 200 3.456 ms
backend-1  | GET /api/users 200 15.234 ms
backend-1  | POST /api/users 201 25.678 ms
```

**Every request logged!**

---

### Monitor Resource Usage

**Check resources:**
```bash
docker stats backend
```

**Shows:**
```
CONTAINER ID   NAME     CPU %   MEM USAGE / LIMIT   MEM %
abc123def456   backend  0.15%   75.2MiB / 3.84GiB   1.91%
```

**Node.js uses more memory than static Nginx, but still efficient.**

---

### Database Connection Pool

**Check pool status:**

**Add endpoint to src/index.js:**
```javascript
app.get('/api/status', async (req, res) => {
  res.json({
    server: 'healthy',
    database: {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    }
  });
});
```

**Rebuild and test:**
```bash
docker compose up -d --build
curl https://api.mywebclass.org/api/status
```

**Shows connection pool metrics.**

---

## Troubleshooting

### Issue 1: Backend Won't Start

**Problem:** Container exits immediately

**Check logs:**
```bash
docker compose logs backend
```

---

**Common errors:**

**"Cannot find module 'express'"**
```
Error: Cannot find module 'express'
```
**Solution:** Dependencies not installed
```bash
docker compose build --no-cache
docker compose up -d
```

---

**"ECONNREFUSED" (can't connect to database)**
```
Error: connect ECONNREFUSED 172.19.0.2:5432
```
**Solution:** PostgreSQL not ready or not on internal network
```bash
# Check PostgreSQL running
docker ps | grep postgres

# Check backend on internal network
docker network inspect internal | grep backend
```

---

**"DATABASE_URL is not defined"**
```
Error: DATABASE_URL is required
```
**Solution:** Environment variable not set
```bash
# Check .env file exists in infrastructure/
ls ~/mywebclass_hosting/infrastructure/.env

# Check docker-compose.yml references it
cat docker-compose.yml | grep DATABASE_URL
```

---

### Issue 2: API Returns 502 Bad Gateway

**Problem:** Caddy can't reach backend

**Check 1: Container running?**
```bash
docker compose ps backend
```

**Check 2: On web network?**
```bash
docker network inspect web | grep backend
```

**Check 3: Port correct?**
```bash
docker compose logs backend | grep "running on port"
```
**Should say port 3000**

**Check 4: Caddy config correct?**
```bash
cat ~/mywebclass_hosting/infrastructure/Caddyfile | grep backend
```
**Should say backend:3000**

---

### Issue 3: Database Queries Fail

**Problem:** API returns 500 errors, logs show database errors

**Check 1: PostgreSQL running?**
```bash
docker ps | grep postgres
```

**Check 2: Connection from backend?**
```bash
docker compose exec backend ping postgres
```

**Check 3: Credentials correct?**
```bash
# View infrastructure .env
cat ~/mywebclass_hosting/infrastructure/.env | grep POSTGRES

# Check docker-compose.yml uses them
cat docker-compose.yml | grep DATABASE_URL
```

**Check 4: Table exists?**
```bash
docker compose exec backend node -e "
const { pool } = require('./src/database');
pool.query('SELECT * FROM users LIMIT 1')
  .then(res => console.log('Success:', res.rows))
  .catch(err => console.error('Error:', err))
  .finally(() => process.exit());
"
```

---

### Issue 4: CORS Errors in Browser

**Problem:** Frontend can't fetch from API

**Browser console shows:**
```
Access to fetch at 'https://api.mywebclass.org/api/users' from origin 'https://www.mywebclass.org' has been blocked by CORS policy
```

**Solution:** Add CORS headers

**Check src/index.js has:**
```javascript
const cors = require('cors');
app.use(cors());
```

**Or configure specific origins:**
```javascript
app.use(cors({
  origin: ['https://www.mywebclass.org', 'https://mywebclass.org'],
  credentials: true
}));
```

**Rebuild:**
```bash
docker compose up -d --build
```

---

### Issue 5: Changes Not Applying

**Problem:** Updated code but API behaves the same

**Solution:** Rebuild container
```bash
docker compose up -d --build
```

**Force full rebuild:**
```bash
docker compose build --no-cache
docker compose up -d
```

**Check logs confirm new code:**
```bash
docker compose logs | head -20
```

---

## Advanced Features

### Adding More Endpoints

**Edit src/index.js:**
```javascript
// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
      [name, email, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

**Full CRUD API! ✓**

---

### Database Migrations

**Create migrations directory:**
```bash
mkdir ~/mywebclass_hosting/projects/backend/migrations
```

**Create migration file:**
```bash
nano ~/mywebclass_hosting/projects/backend/migrations/001_add_users_table.sql
```

**Content:**
```sql
-- Add phone column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add index
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
```

---

**Update database.js to run migrations:**
```javascript
async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir).sort();
  
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
    console.log(`Migration ${file} completed`);
  }
}
```

---

### Adding Authentication

**Install bcrypt and jsonwebtoken:**
```bash
# Update package.json
nano ~/mywebclass_hosting/projects/backend/package.json
```

**Add:**
```json
"dependencies": {
  "express": "^4.18.2",
  "pg": "^8.11.3",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.0.2"
}
```

**Rebuild to install:**
```bash
docker compose build --no-cache
docker compose up -d
```

**Add auth endpoints:**
```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  // Insert user with hashed password...
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  // Verify password, return JWT...
});
```

**Production-ready authentication!**

---

## Performance Optimization

### Connection Pooling

**Already configured in database.js:**
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,  // Maximum connections
  idleTimeoutMillis: 30000,  // Close idle connections after 30s
  connectionTimeoutMillis: 2000,  // Connection timeout
});
```

**Reuses database connections (much faster).**

---

### Caching

**Add Redis for caching (optional):**
```yaml
# Add to infrastructure docker-compose.yml
redis:
  image: redis:alpine
  container_name: redis
  restart: unless-stopped
  networks:
    - internal
```

**Use in backend:**
```javascript
const redis = require('redis');
const client = redis.createClient({
  url: 'redis://redis:6379'
});

// Cache users list for 1 minute
app.get('/api/users', async (req, res) => {
  const cached = await client.get('users');
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  const result = await pool.query('SELECT * FROM users');
  await client.setEx('users', 60, JSON.stringify(result.rows));
  res.json(result.rows);
});
```

---

### Logging

**Add structured logging:**
```javascript
const morgan = require('morgan');

// HTTP request logging
app.use(morgan('combined'));

// Custom logger
const logger = {
  info: (msg, meta) => console.log(JSON.stringify({ level: 'info', msg, ...meta })),
  error: (msg, meta) => console.error(JSON.stringify({ level: 'error', msg, ...meta })),
};

app.get('/api/users', async (req, res) => {
  logger.info('Fetching users', { endpoint: '/api/users' });
  // ...
});
```

---

## Next Steps

**Backend deployed! ✓**

**What you've accomplished:**
- ✅ Deployed Node.js application with Docker
- ✅ Connected to PostgreSQL database
- ✅ Created RESTful API endpoints
- ✅ Integrated frontend and backend
- ✅ Full-stack application working!
- ✅ HTTPS on all components

**In Chapter 20:**
- Monitoring and observability
- Log management
- Backup strategies
- Updates and maintenance
- Performance monitoring
- Production operations

---

## Key Takeaways

**Remember:**

1. **Backend handles business logic**
   - API endpoints
   - Database operations
   - Data validation
   - Security

2. **Environment variables secure secrets**
   - Never hardcode credentials
   - Use .env files
   - Different per environment
   - Keep out of git

3. **Connection pooling improves performance**
   - Reuse database connections
   - Configure limits
   - Monitor usage
   - Handle errors

4. **Networks isolate components**
   - web - Internet-facing
   - internal - Private backend
   - Defense in depth
   - Least privilege

5. **Full-stack requires coordination**
   - Frontend calls backend
   - Backend queries database
   - All need proper configuration
   - Test end-to-end

---

## Quick Reference

### Deploy Commands

**Build and start:**
```bash
cd ~/mywebclass_hosting/projects/backend
docker compose up -d --build
```

**View logs:**
```bash
docker compose logs -f
```

**Restart:**
```bash
docker compose restart
```

**Stop:**
```bash
docker compose down
```

---

### Test Commands

**Health check:**
```bash
curl https://api.mywebclass.org/health
```

**Get users:**
```bash
curl https://api.mywebclass.org/api/users
```

**Create user:**
```bash
curl -X POST https://api.mywebclass.org/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com"}'
```

---

### Database Commands

**Connect to database:**
```bash
docker compose -f ~/mywebclass_hosting/infrastructure/docker-compose.yml exec postgres psql -U dbadmin mywebclass
```

**Run query:**
```bash
docker compose -f ~/mywebclass_hosting/infrastructure/docker-compose.yml exec postgres psql -U dbadmin mywebclass -c "SELECT * FROM users;"
```

---

### File Locations

```
Backend project:
~/mywebclass_hosting/projects/backend/

Source code:
~/mywebclass_hosting/projects/backend/src/

Environment:
~/mywebclass_hosting/projects/backend/.env

Infrastructure env:
~/mywebclass_hosting/infrastructure/.env

Caddy routing:
~/mywebclass_hosting/infrastructure/Caddyfile
```

---

[← Previous: Chapter 18 - Static Site Deployment](18-static-site-deployment.md) | [Next: Chapter 20 - Operations and Monitoring →](20-operations-monitoring.md)
