import { VercelRequest, VercelResponse } from '@vercel/node';
import Database from 'better-sqlite3';

const getDb = () => {
  const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/etkinlik.db' : './etkinlik.db';
  return new Database(dbPath);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    // SuperAdmin kontrolü (token'dan)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Yetki gerekli' });
    }

    // Token decode ve SuperAdmin kontrolü (basit)
    const token = authHeader.replace('Bearer ', '');
    // Burada token doğrulama yapılmalı, şimdilik geç

    const { firmId, amount, licenseStatus, firmName } = req.body;

    if (!firmId || !amount) {
      return res.status(400).json({ error: 'Firma ID ve tutar gerekli' });
    }

    const db = getDb();
    
    const firm = db.prepare('SELECT * FROM firms WHERE id = ?').get(firmId) as any;
    if (!firm) {
      return res.status(404).json({ error: 'Firma bulunamadı' });
    }

    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + 30);

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

    res.json({
      success: true,
      message: `${firmName} için ödeme onaylandı. Lisans ${newExpiryDate.toLocaleDateString('tr-TR')} tarihine kadar uzatıldı.`
    });

  } catch (error) {
    console.error('Ödeme onayı hatası:', error);
    res.status(500).json({ error: 'Ödeme onaylanamadı' });
  }
}
