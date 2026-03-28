import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Database initialization
const dbPath = process.env.DATABASE_PATH || './etkinlik.db';
let db = null;

try {
  db = new Database(dbPath);
  console.log(`Using database: ${dbPath}`);
  
  // Initialize Database Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS firms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ownerEmail TEXT UNIQUE NOT NULL,
      ownerUid TEXT,
      createdAt TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      licenseExpiry TEXT,
      licenseStatus TEXT DEFAULT 'trial',
      demoMode INTEGER DEFAULT 0,
      logoUrl TEXT,
      subscriptionPrice REAL DEFAULT 299.0,
      subscriptionType TEXT DEFAULT 'monthly',
      totalPaid REAL DEFAULT 0,
      lastPaymentDate TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      displayName TEXT,
      role TEXT NOT NULL,
      firmId TEXT,
      permissions TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      firmId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      location TEXT,
      tables TEXT,
      status TEXT DEFAULT 'draft',
      category TEXT,
      firmName TEXT,
      firmLogo TEXT,
      FOREIGN KEY(firmId) REFERENCES firms(id)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      firmId TEXT NOT NULL,
      eventId TEXT NOT NULL,
      items TEXT NOT NULL,
      totalAmount REAL NOT NULL,
      discount REAL DEFAULT 0,
      commission REAL DEFAULT 0,
      soldBy TEXT NOT NULL,
      soldAt TEXT NOT NULL,
      customerName TEXT,
      customerPhone TEXT,
      status TEXT DEFAULT 'confirmed',
      debt REAL DEFAULT 0,
      credit REAL DEFAULT 0,
      note TEXT,
      FOREIGN KEY(eventId) REFERENCES events(id),
      FOREIGN KEY(firmId) REFERENCES firms(id)
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      firmId TEXT NOT NULL,
      saleId TEXT NOT NULL,
      customerName TEXT,
      customerPhone TEXT,
      tableId TEXT,
      tableName TEXT,
      price REAL,
      code TEXT,
      soldBy TEXT NOT NULL,
      soldAt TEXT NOT NULL,
      isPremium INTEGER DEFAULT 0,
      scannedAt TEXT,
      scannedBy TEXT
    );

    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      firmId TEXT NOT NULL,
      userId TEXT,
      userName TEXT,
      action TEXT NOT NULL,
      entityType TEXT,
      entityId TEXT,
      details TEXT,
      timestamp TEXT NOT NULL
    );
  `);

  console.log('Database tables created successfully');
  
} catch (error) {
  console.error('Database initialization failed:', error);
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const PORT = parseInt(process.env.PORT || '3000', 10);

const app = express();

app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running with database' });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, firmId: user.firmId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        firmId: user.firmId,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, displayName, firmName } = req.body;
    
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password and display name required' });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const createdAt = new Date().toISOString();

    // Create or get firm
    let firmId;
    if (firmName) {
      const existingFirm = db.prepare('SELECT id FROM firms WHERE ownerEmail = ?').get(email);
      if (existingFirm) {
        firmId = existingFirm.id;
      } else {
        firmId = `firm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        db.prepare(`
          INSERT INTO firms (id, name, ownerEmail, createdAt)
          VALUES (?, ?, ?, ?)
        `).run(firmId, firmName, email, createdAt);
      }
    }

    // Create user
    db.prepare(`
      INSERT INTO users (id, email, password, displayName, role, firmId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, email, hashedPassword, displayName, firmName ? 'admin' : 'user', firmId || null, createdAt);

    const token = jwt.sign(
      { userId, email, role: firmName ? 'admin' : 'user', firmId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: userId,
        email,
        displayName,
        role: firmName ? 'admin' : 'user',
        firmId,
        permissions: null
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get __dirname equivalent in ES module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve static files
app.use(express.static(path.resolve(__dirname, 'dist')));

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Database is temporarily disabled for deployment');
});
