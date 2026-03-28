import { VercelRequest, VercelResponse } from '@vercel/node';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Database setup - Vercel için
const getDb = () => {
  try {
    // Production ortamda memory database kullan
    if (process.env.NODE_ENV === 'production') {
      // Vercel serverless için geçici çözüm
      const db = new Database(':memory:');
      
      // Test verilerini ekle
      db.exec(`
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
        
        CREATE TABLE IF NOT EXISTS firms (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          ownerEmail TEXT UNIQUE NOT NULL,
          createdAt TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          licenseExpiry TEXT,
          licenseStatus TEXT DEFAULT 'trial'
        );
      `);
      
      // Test kullanıcıları ekle
      const hashedPassword = bcrypt.hashSync('superadmin123', 10);
      db.prepare('INSERT OR IGNORE INTO users (id, email, password, displayName, role, firmId, permissions, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        'superadmin-1',
        'superadmin@etkinlik.com',
        hashedPassword,
        'Super Admin',
        'superadmin',
        null,
        JSON.stringify({
          canSell: true,
          canScan: true,
          canViewRevenue: true,
          canManageEvents: true,
          canManageStaff: true
        }),
        new Date().toISOString()
      );
      
      const demoPassword = bcrypt.hashSync('demo123', 10);
      db.prepare('INSERT OR IGNORE INTO users (id, email, password, displayName, role, firmId, permissions, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        'demo-user-1',
        'admin@demo.com',
        demoPassword,
        'Demo Admin',
        'firmadmin',
        'demo-firm-1',
        JSON.stringify({
          canSell: true,
          canScan: true,
          canViewRevenue: true,
          canManageEvents: true,
          canManageStaff: true
        }),
        new Date().toISOString()
      );
      
      db.prepare('INSERT OR IGNORE INTO firms (id, name, ownerEmail, createdAt, status, licenseExpiry, licenseStatus) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        'demo-firm-1',
        'Demo Firma',
        'admin@demo.com',
        new Date().toISOString(),
        'active',
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        'trial'
      );
      
      return db;
    } else {
      return new Database('./etkinlik.db');
    }
  } catch (error) {
    console.error('Database error:', error);
    return new Database(':memory:');
  }
};

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre gerekli' });
    }

    const db = getDb();
    
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, firmId: user.firmId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      firmId: user.firmId,
      permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Giriş yapılamadı' });
  }
}
