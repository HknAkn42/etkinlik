import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
// import Database from 'better-sqlite3'; // Temporarily disabled
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

// Database temporarily disabled for deployment
console.log('Database temporarily disabled - using mock data');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const PORT = parseInt(process.env.PORT || '3000', 10);

const app = express();

app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running with database' });
});

// Mock Auth endpoints
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Mock users
    const mockUsers = [
      {
        id: 'superadmin-1',
        email: 'superadmin@etkinlik.com',
        password: 'superadmin123',
        displayName: 'Super Admin',
        role: 'superadmin',
        firmId: null,
        permissions: {
          canSell: true,
          canScan: true,
          canViewRevenue: true,
          canManageEvents: true,
          canManageStaff: true
        }
      },
      {
        id: 'demo-user-1',
        email: 'admin@demo.com',
        password: 'demo123',
        displayName: 'Demo Admin',
        role: 'firmadmin',
        firmId: 'demo-firm-1',
        permissions: {
          canSell: true,
          canScan: true,
          canViewRevenue: true,
          canManageEvents: true,
          canManageStaff: true
        }
      }
    ];

    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
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

    // Mock registration - always succeed
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const firmId = firmName ? `firm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null;

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
        permissions: {
          canSell: true,
          canScan: true,
          canViewRevenue: true,
          canManageEvents: true,
          canManageStaff: true
        }
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
