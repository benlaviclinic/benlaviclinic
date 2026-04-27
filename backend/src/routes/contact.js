import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';

const router = Router();

const ContactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(40),
  email: z.string().email().max(200).optional().or(z.literal('')),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
  language: z.enum(['he', 'en']).default('he'),
});

router.post('/', async (req, res) => {
  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid_input',
      details: parsed.error.flatten(),
    });
  }
  const { name, phone, email, message, language } = parsed.data;
  try {
    const result = await pool.query(
      `INSERT INTO inquiries (name, phone, email, message, language, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [
        name,
        phone,
        email || null,
        message || null,
        language,
        req.ip || null,
        (req.headers['user-agent'] || '').slice(0, 500),
      ]
    );
    return res.status(201).json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error('contact insert failed', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// Admin endpoint - protect with auth in production
router.get('/', async (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  try {
    const result = await pool.query(
      `SELECT id, name, phone, email, message, language, created_at
       FROM inquiries
       ORDER BY created_at DESC
       LIMIT 100`
    );
    return res.json({ inquiries: result.rows });
  } catch (err) {
    console.error('contact list failed', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

export default router;
