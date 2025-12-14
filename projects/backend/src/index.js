require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { pool, initializeDatabase } = require('./database');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// HTTP request logging
app.use(morgan('combined'));

// Simple structured logger
const logger = {
  info: (msg, meta = {}) =>
    console.log(JSON.stringify({ level: 'info', msg, ...meta, timestamp: new Date().toISOString() })),
  error: (msg, meta = {}) =>
    console.error(JSON.stringify({ level: 'error', msg, ...meta, timestamp: new Date().toISOString() })),
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Database connection pool status
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

// Get all users
app.get('/api/users', (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email FROM users ORDER BY id');
    res.json(result.rows);
  } catch (error) {
  logger.error('Error fetching users', {
    endpoint: '/api/users',
    error: error.message
  });
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

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

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

// Update user
app.put('/api/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, email } = req.body;

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email required' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email',
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
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 204 = success, no content
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
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
