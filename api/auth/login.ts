import { VercelRequest, VercelResponse } from '@vercel/node';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Database setup - production için dosya yolu düzeltme
const getDb = () => {
  const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/etkinlik.db' : './etkinlik.db';
  return new Database(dbPath);
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
    
    // Tablo var mı kontrol et
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (!tableExists) {
      return res.status(500).json({ error: 'Veritabanı hazır değil' });
    }

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
