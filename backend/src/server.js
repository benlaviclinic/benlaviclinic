import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pool, waitForDb } from './db.js';
import contactRouter from './routes/contact.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Trust the reverse proxy (nginx) for correct client IPs
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: false,
}));
app.use(express.json({ limit: '100kb' }));

// Basic rate limiting for contact submission abuse protection
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'ok' });
  } catch (e) {
    res.status(503).json({ status: 'degraded', db: 'down' });
  }
});

app.use('/api/contact', contactLimiter, contactRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error('unhandled error', err);
  res.status(500).json({ error: 'server_error' });
});

(async () => {
  try {
    await waitForDb();
    console.log('DB connected');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend listening on :${PORT}`);
    });
  } catch (e) {
    console.error('Startup failed:', e);
    process.exit(1);
  }
})();

const shutdown = async (signal) => {
  console.log(`${signal} received, shutting down`);
  try { await pool.end(); } catch {}
  process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
