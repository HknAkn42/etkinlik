import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
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

// Database initialization (disabled for now)
console.log('Database initialization skipped for deployment');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const PORT = parseInt(process.env.PORT || '3000', 10);

const app = express();

app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running without database' });
});

// Basic auth endpoints (disabled for now)
app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'Database temporarily disabled' });
});

app.post('/api/auth/register', (req, res) => {
  res.json({ message: 'Database temporarily disabled' });
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
