import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../db.js';

export const authRouter = express.Router();

const registerSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(255),
  password: z.string().min(6).max(255)
});

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(255)
});

function signToken(user) {
  return jwt.sign(
    { sub: String(user.id), email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'VALIDATION', details: parsed.error.flatten() });

  const { email, name, password } = parsed.data;
  const password_hash = await bcrypt.hash(password, 10);

  try {
    const result = await query(
      'INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, "user")',
      [email.toLowerCase(), name, password_hash]
    );
    const id = result.insertId;
    const token = signToken({ id, email: email.toLowerCase(), role: 'user', name });
    return res.json({ token, user: { id, email: email.toLowerCase(), role: 'user', name } });
  } catch (e) {
    if (String(e?.code) === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'EMAIL_TAKEN' });
    }
    return res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'VALIDATION', details: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const rows = await query('SELECT id, email, name, password_hash, role FROM users WHERE email = ? LIMIT 1', [
    email.toLowerCase()
  ]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

  const token = signToken(user);
  return res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
});

