import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
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

// const dbPath = process.env.DATABASE_PATH || './etkinlik.db';
// const db = new Database(dbPath);
// console.log(`Using database: ${dbPath}`);
console.log('Database temporarily disabled for deployment');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const PORT = parseInt(process.env.PORT || '3000', 10);

console.log('Database initialization skipped for deployment');
// Initialize Database Tables
// db.exec(`
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
    code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'valid',
    soldBy TEXT,
    soldAt TEXT,
    scannedAt TEXT,
    scannedBy TEXT,
    isPremium INTEGER DEFAULT 0,
    debt REAL DEFAULT 0,
    credit REAL DEFAULT 0,
    note TEXT,
    FOREIGN KEY(eventId) REFERENCES events(id),
    FOREIGN KEY(firmId) REFERENCES firms(id)
  );

  CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    firmId TEXT NOT NULL,
    userId TEXT NOT NULL,
    userName TEXT NOT NULL,
    action TEXT NOT NULL,
    entityType TEXT NOT NULL,
    entityId TEXT NOT NULL,
    details TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY(firmId) REFERENCES firms(id)
  );
`);

// Add columns if they don't exist
try { db.prepare('ALTER TABLE sales ADD COLUMN debt REAL DEFAULT 0').run(); } catch (e) {}
try { db.prepare('ALTER TABLE sales ADD COLUMN credit REAL DEFAULT 0').run(); } catch (e) {}
try { db.prepare('ALTER TABLE sales ADD COLUMN note TEXT').run(); } catch (e) {}
try { db.prepare('ALTER TABLE tickets ADD COLUMN debt REAL DEFAULT 0').run(); } catch (e) {}
try { db.prepare('ALTER TABLE tickets ADD COLUMN credit REAL DEFAULT 0').run(); } catch (e) {}
try { db.prepare('ALTER TABLE tickets ADD COLUMN note TEXT').run(); } catch (e) {}

// Ensure new columns exist in existing tables
try {
  db.prepare('ALTER TABLE firms ADD COLUMN logoUrl TEXT').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE events ADD COLUMN firmName TEXT').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE events ADD COLUMN firmLogo TEXT').run();
} catch (e) {}

// Add accounting columns to firms table
try {
  db.prepare('ALTER TABLE firms ADD COLUMN subscriptionPrice REAL DEFAULT 299.0').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE firms ADD COLUMN subscriptionType TEXT DEFAULT "monthly"').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE firms ADD COLUMN totalPaid REAL DEFAULT 0').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE firms ADD COLUMN lastPaymentDate TEXT').run();
} catch (e) {}

// Seed SuperAdmin if not exists
const superAdminEmail = 'superadmin@test.com';
const existingAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get(superAdminEmail);
const newHashedPassword = bcrypt.hashSync('super123', 10);

console.log('SuperAdmin check:', existingAdmin ? 'exists' : 'not found');

if (!existingAdmin) {
  console.log('Creating SuperAdmin...');
  db.prepare(`
    INSERT INTO users (id, email, password, displayName, role, firmId, permissions, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'admin-uid',
    superAdminEmail,
    newHashedPassword,
    'Sistem Yöneticisi',
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
  console.log('SuperAdmin created successfully');
} else {
  console.log('Updating SuperAdmin password...');
  db.prepare('UPDATE users SET password = ? WHERE email = ?').run(newHashedPassword, superAdminEmail);
  console.log('SuperAdmin password updated');
}

// Seed Test Firm and Firm Admin
const testFirmEmail = 'musteri@test.com';
const existingTestUser = db.prepare('SELECT * FROM users WHERE email = ?').get(testFirmEmail);
console.log('Test user check:', existingTestUser ? 'exists' : 'not found');

if (!existingTestUser) {
  console.log('Creating test firm and user...');
  const testFirmId = 'test-firm-id';
  const testUserId = 'test-user-id';
  const testHashedPassword = bcrypt.hashSync('musteri123', 10);

  db.prepare(`
    INSERT OR IGNORE INTO firms (id, name, ownerEmail, ownerUid, createdAt, licenseStatus, demoMode)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    testFirmId,
    'Test Müşteri Organizasyonu',
    testFirmEmail,
    testUserId,
    new Date().toISOString(),
    'active',
    0
  );

  db.prepare(`
    INSERT INTO users (id, email, password, displayName, role, firmId, permissions, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    testUserId,
    testFirmEmail,
    testHashedPassword,
    'Müşteri Yöneticisi',
    'firmadmin',
    testFirmId,
    JSON.stringify({
      canSell: true,
      canScan: true,
      canViewRevenue: true,
      canManageEvents: true,
      canManageStaff: true
    }),
    new Date().toISOString()
  );
  console.log('Test firm and user created');
}

// Seed Staff User
const staffEmail = 'personel@test.com';
const existingStaff = db.prepare('SELECT * FROM users WHERE email = ?').get(staffEmail);
if (!existingStaff) {
  const staffId = 'staff-user-id';
  const staffHashedPassword = bcrypt.hashSync('personel123', 10);

  db.prepare(`
    INSERT INTO users (id, email, password, displayName, role, firmId, permissions, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    staffId,
    staffEmail,
    staffHashedPassword,
    'Test Personeli',
    'staff',
    'test-firm-id',
    JSON.stringify({
      canSell: true,
      canScan: true,
      canViewRevenue: false,
      canManageEvents: false,
      canManageStaff: false
    }),
    new Date().toISOString()
  );
}

// Seed Demo Firm
const demoFirmEmail = 'demo@test.com';
const existingDemo = db.prepare('SELECT * FROM users WHERE email = ?').get(demoFirmEmail);
if (!existingDemo) {
  const demoFirmId = 'demo-firm-id';
  const demoUserId = 'demo-user-id';
  const demoHashedPassword = bcrypt.hashSync('demo123', 10);

  db.prepare(`
    INSERT OR IGNORE INTO firms (id, name, ownerEmail, ownerUid, createdAt, licenseStatus, demoMode, licenseExpiry)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    demoFirmId,
    'Demo Organizasyon',
    demoFirmEmail,
    demoUserId,
    new Date().toISOString(),
    'trial',
    1,
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 gün
  );

  db.prepare(`
    INSERT INTO users (id, email, password, displayName, role, firmId, permissions, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    demoUserId,
    demoFirmEmail,
    demoHashedPassword,
    'Demo Yöneticisi',
    'firmadmin',
    demoFirmId,
    JSON.stringify({
      canSell: true,
      canScan: true,
      canViewRevenue: true,
      canManageEvents: true,
      canManageStaff: false // Demo'da personel yönetemez
    }),
    new Date().toISOString()
  );
}

// Seed Premium Firm
const premiumFirmEmail = 'premium@test.com';
const existingPremium = db.prepare('SELECT * FROM users WHERE email = ?').get(premiumFirmEmail);
if (!existingPremium) {
  const premiumFirmId = 'premium-firm-id';
  const premiumUserId = 'premium-user-id';
  const premiumHashedPassword = bcrypt.hashSync('premium123', 10);

  db.prepare(`
    INSERT OR IGNORE INTO firms (id, name, ownerEmail, ownerUid, createdAt, licenseStatus, licenseExpiry)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    premiumFirmId,
    'Premium Organizasyon',
    premiumFirmEmail,
    premiumUserId,
    new Date().toISOString(),
    'active',
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 yıl
  );

  db.prepare(`
    INSERT INTO users (id, email, password, displayName, role, firmId, permissions, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    premiumUserId,
    premiumFirmEmail,
    premiumHashedPassword,
    'Premium Yöneticisi',
    'firmadmin',
    premiumFirmId,
    JSON.stringify({
      canSell: true,
      canScan: true,
      canViewRevenue: true,
      canManageEvents: true,
      canManageStaff: true
    }),
    new Date().toISOString()
  );
}

async function startServer() {
  console.log('Starting server initialization...');
  const app = express();
  app.use(cors());
  app.use(express.json());

  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- API Routes ---

  // Auth
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
    }

    const token = jwt.sign({ 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      firmId: user.firmId 
    }, JWT_SECRET, { expiresIn: '24h' });

    const { password: _, ...userProfile } = user;
    userProfile.permissions = JSON.parse(userProfile.permissions);
    
    res.json({ token, user: userProfile });
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    
    const { password: _, ...userProfile } = user;
    userProfile.permissions = JSON.parse(userProfile.permissions);
    
    if (user.firmId) {
      const firm = db.prepare('SELECT * FROM firms WHERE id = ?').get(user.firmId) as any;
      if (firm) {
        userProfile.demoMode = !!firm.demoMode;
        userProfile.licenseStatus = firm.licenseStatus;
        userProfile.licenseExpiry = firm.licenseExpiry;
      }
    }
    
    res.json(userProfile);
  });

  // Middleware to check license
  const checkLicense = (req: any, res: express.Response, next: express.NextFunction) => {
    if (req.user.role === 'superadmin') return next();
    
    const firm = db.prepare('SELECT * FROM firms WHERE id = ?').get(req.user.firmId) as any;
    if (!firm) return res.status(404).json({ error: 'Firma bulunamadı' });
    
    if (firm.status !== 'active') {
      return res.status(403).json({ error: 'Hesabınız askıya alınmıştır. Lütfen yönetici ile iletişime geçin.' });
    }

    if (firm.licenseStatus === 'expired') {
      return res.status(403).json({ error: 'Lisans süreniz dolmuştur. Lütfen yenileyin.' });
    }

    if (firm.licenseExpiry) {
      const expiryDate = new Date(firm.licenseExpiry);
      if (expiryDate < new Date()) {
        // Auto-expire if date passed
        db.prepare('UPDATE firms SET licenseStatus = ? WHERE id = ?').run('expired', firm.id);
        return res.status(403).json({ error: 'Lisans süreniz dolmuştur. Lütfen yenileyin.' });
      }
    }

    next();
  };

  // Stats
  app.get('/api/stats', authenticateToken, checkLicense, (req: any, res) => {
    const firmId = req.user.firmId;
    
    const totalRevenue = (db.prepare('SELECT SUM(totalAmount) as total FROM sales WHERE firmId = ? AND status != \'proposal\'').get(firmId) as any).total || 0;
    const totalSales = (db.prepare('SELECT COUNT(*) as count FROM sales WHERE firmId = ? AND status != \'proposal\'').get(firmId) as any).count || 0;
    const activeEvents = (db.prepare('SELECT COUNT(*) as count FROM events WHERE firmId = ? AND status = \'published\'').get(firmId) as any).count || 0;
    const totalCustomers = (db.prepare('SELECT COUNT(DISTINCT customerPhone) as count FROM sales WHERE firmId = ?').get(firmId) as any).count || 0;

    const recentSales = db.prepare(`
      SELECT * FROM sales 
      WHERE firmId = ? 
      ORDER BY soldAt DESC 
      LIMIT 5
    `).all(firmId);

    // Weekly revenue for chart
    const weeklyRevenue = db.prepare(`
      SELECT strftime('%w', soldAt) as day, SUM(totalAmount) as revenue
      FROM sales
      WHERE firmId = ? AND soldAt >= date('now', '-7 days') AND status != 'proposal'
      GROUP BY day
    `).all(firmId);

    res.json({
      totalRevenue,
      totalSales,
      activeEvents,
      totalCustomers,
      recentSales: recentSales.map((s: any) => ({ ...s, items: JSON.parse(s.items || '[]') })),
      weeklyRevenue
    });
  });

  // Firms (SuperAdmin only)
  app.get('/api/firms', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'superadmin') return res.sendStatus(403);
    const firms = db.prepare('SELECT * FROM firms ORDER BY createdAt DESC').all();
    res.json(firms.map((f: any) => ({ ...f, demoMode: !!f.demoMode })));
  });

  app.get('/api/firms/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'superadmin' && (req.user.role !== 'firmadmin' || req.user.firmId !== req.params.id)) {
      return res.sendStatus(403);
    }
    const firm = db.prepare('SELECT * FROM firms WHERE id = ?').get(req.params.id) as any;
    if (!firm) return res.status(404).json({ error: 'Firma bulunamadı' });
    
    // Get firm admin permissions
    const admin = db.prepare('SELECT permissions FROM users WHERE firmId = ? AND role = \'firmadmin\'').get(req.params.id) as any;
    
    res.json({
      ...firm,
      demoMode: !!firm.demoMode,
      permissions: admin ? JSON.parse(admin.permissions || '{}') : null
    });
  });

  app.put('/api/firms/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'superadmin' && (req.user.role !== 'firmadmin' || req.user.firmId !== req.params.id)) {
      return res.sendStatus(403);
    }
    const { id } = req.params;
    const { name, licenseExpiry, licenseStatus, demoMode, status, permissions, logoUrl, subscriptionPrice, subscriptionType, totalPaid } = req.body;

    const transaction = db.transaction(() => {
      // Update firm
      db.prepare(`
        UPDATE firms 
        SET name = ?, licenseExpiry = ?, licenseStatus = ?, demoMode = ?, status = ?, logoUrl = ?, subscriptionPrice = ?, subscriptionType = ?, totalPaid = ?
        WHERE id = ?
      `).run(name, licenseExpiry, licenseStatus, demoMode ? 1 : 0, status, logoUrl || null, subscriptionPrice || 299.0, subscriptionType || 'monthly', totalPaid || 0, id);

      // Update firm admin permissions if provided (SuperAdmin only)
      if (permissions && req.user.role === 'superadmin') {
        db.prepare(`
          UPDATE users 
          SET permissions = ?
          WHERE firmId = ? AND role = 'firmadmin'
        `).run(JSON.stringify(permissions), id);
      }
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (error: any) {
      console.error("Firm update error:", error);
      res.status(400).json({ error: 'Firma güncellenemedi' });
    }
  });

  app.delete('/api/firms/:id', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'superadmin') {
      return res.sendStatus(403);
    }
    const { id } = req.params;

    console.log(`Attempting to delete firm: ${id}`);

    try {
      const transaction = db.transaction(() => {
        // Delete all users of the firm
        const usersResult = db.prepare('DELETE FROM users WHERE firmId = ?').run(id);
        console.log(`Deleted ${usersResult.changes} users`);
        
        // Delete all events of the firm
        const eventsResult = db.prepare('DELETE FROM events WHERE firmId = ?').run(id);
        console.log(`Deleted ${eventsResult.changes} events`);
        
        // Delete all sales of the firm
        const salesResult = db.prepare('DELETE FROM sales WHERE firmId = ?').run(id);
        console.log(`Deleted ${salesResult.changes} sales`);
        
        // Delete all tickets of the firm
        const ticketsResult = db.prepare('DELETE FROM tickets WHERE firmId = ?').run(id);
        console.log(`Deleted ${ticketsResult.changes} tickets`);
        
        // Delete the firm
        const result = db.prepare('DELETE FROM firms WHERE id = ?').run(id);
        console.log(`Deleted firm: ${result.changes} changes`);
        
        if (result.changes === 0) {
          throw new Error('Firma bulunamadı');
        }
      });

      transaction();
      console.log(`Successfully deleted firm: ${id}`);
      res.status(200).json({ success: true, message: 'Firma başarıyla silindi' });
    } catch (error: any) {
      console.error("Firm deletion error:", error);
      res.status(400).json({ error: error.message || 'Firma silinemedi' });
    }
  });

  app.post('/api/firms', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'superadmin') return res.sendStatus(403);
    const { name, ownerEmail, password, licenseExpiry, licenseStatus, demoMode, permissions } = req.body;
    const firmId = Math.random().toString(36).substring(2, 15);
    const userId = Math.random().toString(36).substring(2, 15);
    const hashedPassword = bcrypt.hashSync(password || '123456', 10);

    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO firms (id, name, ownerEmail, ownerUid, createdAt, licenseExpiry, licenseStatus, demoMode) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        firmId, 
        name, 
        ownerEmail.toLowerCase(), 
        userId,
        new Date().toISOString(),
        licenseExpiry || null,
        licenseStatus || 'trial',
        demoMode ? 1 : 0
      );

      db.prepare(`
        INSERT INTO users (id, email, password, displayName, role, firmId, permissions, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        ownerEmail.toLowerCase(),
        hashedPassword,
        name + ' Yöneticisi',
        'firmadmin',
        firmId,
        JSON.stringify(permissions || {
          canSell: true,
          canScan: true,
          canViewRevenue: true,
          canManageEvents: true,
          canManageStaff: true
        }),
        new Date().toISOString()
      );
    });

    try {
      transaction();
      res.status(201).json({ 
        id: firmId, 
        name, 
        ownerEmail, 
        ownerUid: userId,
        licenseExpiry, 
        licenseStatus, 
        demoMode: !!demoMode,
        createdAt: new Date().toISOString(),
        status: 'active'
      });
    } catch (error: any) {
      console.error("Firm creation error:", error);
      res.status(400).json({ error: 'Bu e-posta zaten kullanımda veya veritabanı hatası' });
    }
  });

  // Events
  app.get('/api/events', authenticateToken, checkLicense, (req: any, res) => {
    const events = db.prepare('SELECT * FROM events WHERE firmId = ? ORDER BY date DESC').all(req.user.firmId);
    res.json(events.map((e: any) => ({ ...e, tables: JSON.parse(e.tables || '[]') })));
  });

  app.get('/api/events/:id', authenticateToken, checkLicense, (req: any, res) => {
    const event = db.prepare('SELECT * FROM events WHERE id = ? AND firmId = ?').get(req.params.id, req.user.firmId) as any;
    if (!event) return res.status(404).json({ error: 'Etkinlik bulunamadı' });
    res.json({ ...event, tables: JSON.parse(event.tables || '[]') });
  });

  app.post('/api/events', authenticateToken, checkLicense, (req: any, res) => {
    if (!req.user.permissions.canManageEvents) return res.sendStatus(403);
    console.log("Creating event:", req.body);
    const { title, description, date, location, tables, category, firmName, firmLogo } = req.body;
    const id = Math.random().toString(36).substring(2, 15);
    try {
      db.prepare(`
        INSERT INTO events (id, firmId, title, description, date, location, tables, status, category, firmName, firmLogo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, req.user.firmId, title, description, date, location, JSON.stringify(tables || []), 'draft', category, firmName, firmLogo);
      
      logAction(req.user.firmId, req.user.id, req.user.displayName || req.user.email, 'Etkinlik oluşturuldu', 'event', id, `Başlık: ${title}`);
      
      res.status(201).json({ id, title });
    } catch (error) {
      console.error("Event creation error:", error);
      res.status(500).json({ error: 'Etkinlik oluşturulamadı' });
    }
  });

  app.put('/api/events/:id', authenticateToken, checkLicense, (req: any, res) => {
    if (!req.user.permissions.canManageEvents) return res.sendStatus(403);
    const { title, description, date, location, tables, status, category, firmName, firmLogo } = req.body;
    db.prepare(`
      UPDATE events 
      SET title = ?, description = ?, date = ?, location = ?, tables = ?, status = ?, category = ?, firmName = ?, firmLogo = ?
      WHERE id = ? AND firmId = ?
    `).run(title, description, date, location, JSON.stringify(tables), status, category, firmName, firmLogo, req.params.id, req.user.firmId);
    
    logAction(req.user.firmId, req.user.id, req.user.displayName || req.user.email, 'Etkinlik güncellendi', 'event', req.params.id, `Başlık: ${title}`);
    
    res.json({ success: true });
  });

  app.delete('/api/events/:id', authenticateToken, checkLicense, (req: any, res) => {
    if (!req.user.permissions.canManageEvents) return res.sendStatus(403);
    db.prepare('DELETE FROM events WHERE id = ? AND firmId = ?').run(req.params.id, req.user.firmId);
    
    logAction(req.user.firmId, req.user.id, req.user.displayName || req.user.email, 'Etkinlik silindi', 'event', req.params.id, '');
    
    res.json({ success: true });
  });

  // Sales / Tickets
  app.get('/api/sales', authenticateToken, checkLicense, (req: any, res) => {
    const sales = db.prepare('SELECT * FROM sales WHERE firmId = ? ORDER BY soldAt DESC').all(req.user.firmId);
    res.json(sales.map((s: any) => ({ ...s, items: JSON.parse(s.items || '[]') })));
  });

  app.post('/api/sales', authenticateToken, checkLicense, (req: any, res) => {
    if (!req.user.permissions.canSell) return res.sendStatus(403);
    const { eventId, customerName, customerPhone, items, totalAmount, discount, commission, status } = req.body;
    const saleId = Math.random().toString(36).substring(2, 15);
    
    // Create Sale record
    db.prepare(`
      INSERT INTO sales (id, firmId, eventId, items, totalAmount, discount, commission, soldBy, soldAt, customerName, customerPhone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(saleId, req.user.firmId, eventId, JSON.stringify(items), totalAmount, discount, commission, req.user.id, new Date().toISOString(), customerName, customerPhone, status || 'confirmed');

    // Create individual tickets for each item ONLY if status is confirmed
    if ((status || 'confirmed') === 'confirmed') {
      for (const item of items) {
        for (let i = 0; i < item.quantity; i++) {
          const ticketId = Math.random().toString(36).substring(2, 15);
          const code = Math.random().toString(36).substring(2, 10).toUpperCase();
          db.prepare(`
            INSERT INTO tickets (id, eventId, firmId, saleId, customerName, customerPhone, tableId, tableName, price, code, status, soldBy, soldAt, isPremium)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(ticketId, eventId, req.user.firmId, saleId, customerName, customerPhone, item.tableId, item.tableName, item.price, code, 'valid', req.user.id, new Date().toISOString(), item.isPremium ? 1 : 0);
        }
      }
    }
    
    logAction(req.user.firmId, req.user.id, req.user.displayName || req.user.email, 'Satış oluşturuldu', 'sale', saleId, `Müşteri: ${customerName}, Tutar: ${totalAmount}`);
    
    res.status(201).json({ id: saleId });
  });

  app.put('/api/sales/:id', authenticateToken, checkLicense, (req: any, res) => {
    if (!req.user.permissions.canSell) return res.sendStatus(403);
    const { debt, credit, note } = req.body;
    db.prepare(`
      UPDATE sales 
      SET debt = ?, credit = ?, note = ?
      WHERE id = ? AND firmId = ?
    `).run(debt || 0, credit || 0, note || '', req.params.id, req.user.firmId);
    
    logAction(req.user.firmId, req.user.id, req.user.displayName || req.user.email, 'Satış güncellendi', 'sale', req.params.id, `Borç: ${debt}, Alacak: ${credit}, Not: ${note}`);
    
    res.json({ success: true });
  });

  app.get('/api/tickets', authenticateToken, (req: any, res) => {
    const { saleId } = req.query;
    if (saleId) {
      const tickets = db.prepare('SELECT * FROM tickets WHERE saleId = ? AND firmId = ?').all(saleId, req.user.firmId);
      return res.json(tickets);
    }
    const tickets = db.prepare('SELECT * FROM tickets WHERE firmId = ?').all(req.user.firmId);
    res.json(tickets);
  });

  app.get('/api/tickets/scan', authenticateToken, (req: any, res) => {
    const { code } = req.query;
    const ticket = db.prepare('SELECT * FROM tickets WHERE code = ? AND firmId = ?').get(code, req.user.firmId) as any;
    if (!ticket) {
      return res.status(404).json({ error: 'Bilet bulunamadı' });
    }
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(ticket.eventId);
    res.json({ ticket, event });
  });

  app.post('/api/tickets/:id/checkin', authenticateToken, (req: any, res) => {
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ? AND firmId = ?').get(req.params.id, req.user.firmId) as any;
    if (!ticket) {
      return res.status(404).json({ error: 'Bilet bulunamadı' });
    }
    if (ticket.status === 'used') {
      return res.status(400).json({ error: 'Bilet zaten kullanılmış' });
    }
    db.prepare(`
      UPDATE tickets 
      SET status = ?, scannedAt = ?, scannedBy = ?
      WHERE id = ?
    `).run('used', new Date().toISOString(), req.user.id, req.params.id);
    res.json({ success: true });
  });

  // Staff
  app.get('/api/staff', authenticateToken, (req: any, res) => {
    try {
      const staff = db.prepare('SELECT id, email, displayName, role, permissions FROM users WHERE firmId = ? AND role != \'firmadmin\'').all(req.user.firmId);
      res.json(staff.map((s: any) => ({ ...s, permissions: JSON.parse(s.permissions) })));
    } catch (error) {
      console.error("Staff fetch error:", error);
      res.status(500).json({ error: 'Personel verileri çekilemedi' });
    }
  });

  app.post('/api/staff', authenticateToken, (req: any, res) => {
    const { email, password, displayName, role, permissions } = req.body;
    const id = Math.random().toString(36).substring(2, 15);
    const hashedPassword = bcrypt.hashSync(password, 10);

    try {
      db.prepare(`
        INSERT INTO users (id, email, password, displayName, role, firmId, permissions, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, email.toLowerCase(), hashedPassword, displayName, role, req.user.firmId, JSON.stringify(permissions), new Date().toISOString());
      
      logAction(req.user.firmId, req.user.id, req.user.displayName || req.user.email, 'Personel oluşturuldu', 'user', id, `E-posta: ${email}, Rol: ${role}`);
      
      res.status(201).json({ id, email, displayName, role });
    } catch (error) {
      res.status(400).json({ error: 'Bu e-posta zaten kullanımda' });
    }
  });

  app.delete('/api/staff/:id', authenticateToken, (req: any, res) => {
    db.prepare('DELETE FROM users WHERE id = ? AND firmId = ? AND role != \'firmadmin\'').run(req.params.id, req.user.firmId);
    
    logAction(req.user.firmId, req.user.id, req.user.displayName || req.user.email, 'Personel silindi', 'user', req.params.id, '');
    
    res.json({ success: true });
  });

  // Logs
  const logAction = (firmId: string, userId: string, userName: string, action: string, entityType: 'sale' | 'ticket' | 'user' | 'event' | 'system', entityId: string, details: string) => {
    const id = Math.random().toString(36).substring(2, 15);
    db.prepare(`
      INSERT INTO logs (id, firmId, userId, userName, action, entityType, entityId, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, firmId, userId, userName, action, entityType, entityId, details, new Date().toISOString());
  };

  app.post('/api/logs', authenticateToken, (req: any, res) => {
    const { action, entityType, entityId, details } = req.body;
    logAction(req.user.firmId, req.user.id, req.user.displayName || req.user.email, action, entityType, entityId, details);
    res.status(201).json({ success: true });
  });

  // QR Kod Doğrulama API'si
  app.post('/api/validate-ticket', authenticateToken, (req: any, res) => {
    try {
      const { qrData } = req.body;
      
      if (!qrData) {
        return res.status(400).json({ error: 'QR kod verisi gerekli' });
      }

      // QR veriyi parse et
      let ticketData;
      try {
        ticketData = JSON.parse(qrData);
      } catch (error) {
        return res.status(400).json({ error: 'Geçersiz QR kod formatı' });
      }

      // Bileti veritabanında bul
      const ticket = db.prepare(`
        SELECT t.*, e.title as eventTitle, e.date as eventDate, e.location as eventLocation
        FROM tickets t
        JOIN events e ON t.eventId = e.id
        WHERE t.id = ? AND e.firmId = ?
      `).get(ticketData.ticketId, req.user.firmId) as any;

      if (!ticket) {
        return res.status(404).json({ error: 'Bilet bulunamadı' });
      }

      // Bilet durumunu kontrol et
      if (ticket.status === 'used') {
        return res.status(400).json({ error: 'Bu bilet daha önce kullanılmış' });
      }

      if (ticket.status === 'cancelled') {
        return res.status(400).json({ error: 'Bu bilet iptal edilmiş' });
      }

      // Bileti kullanılmış olarak işaretle
      db.prepare('UPDATE tickets SET status = ?, usedAt = ? WHERE id = ?')
        .run('used', new Date().toISOString(), ticket.id);

      // Log kaydı oluştur
      logAction(
        req.user.firmId,
        req.user.id,
        req.user.displayName || req.user.email,
        'Bilet doğrulandı',
        'ticket',
        ticket.id,
        `QR kod ile giriş: ${ticket.customerName}`
      );

      res.json({
        success: true,
        ticket: {
          id: ticket.id,
          customerName: ticket.customerName,
          customerPhone: ticket.customerPhone,
          eventTitle: ticket.eventTitle,
          eventDate: ticket.eventDate,
          eventLocation: ticket.eventLocation,
          status: 'validated'
        }
      });

    } catch (error) {
      console.error('QR doğrulama hatası:', error);
      res.status(500).json({ error: 'Bilet doğrulanamadı' });
    }
  });

  // Ödeme Onayı API'si
  app.post('/api/approve-payment', authenticateToken, (req: any, res) => {
    try {
      if (req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
      }

      const { firmId, amount, licenseStatus, firmName } = req.body;

      if (!firmId || !amount) {
        return res.status(400).json({ error: 'Firma ID ve tutar gerekli' });
      }

      // Firmayı bul
      const firm = db.prepare('SELECT * FROM firms WHERE id = ?').get(firmId) as any;
      if (!firm) {
        return res.status(404).json({ error: 'Firma bulunamadı' });
      }

      // Lisans süresini uzat (30 gün)
      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + 30);

      // Firmayı güncelle
      db.prepare(`
        UPDATE firms 
        SET licenseExpiry = ?, licenseStatus = ?, totalPaid = totalPaid + ?, lastPaymentDate = ?
        WHERE id = ?
      `).run(
        newExpiryDate.toISOString(),
        licenseStatus || 'active',
        amount,
        new Date().toISOString(),
        firmId
      );

      // Log kaydı oluştur
      logAction(
        firmId,
        req.user.id,
        req.user.displayName || req.user.email,
        'Ödeme onaylandı',
        'system',
        firmId,
        `Tutar: ₺${amount}, Durum: ${licenseStatus}`
      );

      res.json({
        success: true,
        message: `${firmName} için ödeme onaylandı. Lisans ${newExpiryDate.toLocaleDateString('tr-TR')} tarihine kadar uzatıldı.`
      });

    } catch (error) {
      console.error('Ödeme onayı hatası:', error);
      res.status(500).json({ error: 'Ödeme onaylanamadı' });
    }
  });

  app.get('/api/logs', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'superadmin' && req.user.role !== 'firmadmin') return res.sendStatus(403);
    
    const { entityType, action } = req.query;
    let query = 'SELECT * FROM logs WHERE firmId = ?';
    const params: any[] = [req.user.firmId];

    if (entityType) {
      query += ' AND entityType = ?';
      params.push(entityType);
    }
    if (action) {
      query += ' AND action LIKE ?';
      params.push(`%${action}%`);
    }

    query += ' ORDER BY timestamp DESC';
    const logs = db.prepare(query).all(...params);
    res.json(logs);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use((req, res, next) => {
      console.log(`Request: ${req.method} ${req.url}`);
      next();
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
