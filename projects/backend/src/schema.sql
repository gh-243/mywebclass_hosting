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
