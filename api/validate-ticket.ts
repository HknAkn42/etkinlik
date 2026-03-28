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
    const { qrData } = req.body;
    
    if (!qrData) {
      return res.status(400).json({ error: 'QR kod verisi gerekli' });
    }

    let ticketData;
    try {
      ticketData = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({ error: 'Geçersiz QR kod formatı' });
    }

    const db = getDb();
    
    const ticket = db.prepare(`
      SELECT t.*, e.title as eventTitle, e.date as eventDate, e.location as eventLocation
      FROM tickets t
      JOIN events e ON t.eventId = e.id
      WHERE t.id = ?
    `).get(ticketData.ticketId) as any;

    if (!ticket) {
      return res.status(404).json({ error: 'Bilet bulunamadı' });
    }

    if (ticket.status === 'used') {
      return res.status(400).json({ error: 'Bu bilet daha önce kullanılmış' });
    }

    if (ticket.status === 'cancelled') {
      return res.status(400).json({ error: 'Bu bilet iptal edilmiş' });
    }

    db.prepare('UPDATE tickets SET status = ?, usedAt = ? WHERE id = ?')
      .run('used', new Date().toISOString(), ticket.id);

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
}
