import express from 'express';
import { z } from 'zod';
import { query } from '../db.js';

export const adminRouter = express.Router();

const coverSchema = z.object({
  author_name: z.string().min(1).max(255),
  subtitle: z.string().min(1).max(255),
  description: z.string().min(1),
  stat_books: z.string().min(1).max(32),
  stat_readers: z.string().min(1).max(32),
  stat_rating: z.string().min(1).max(32)
});

const aboutSchema = z.object({
  title: z.string().min(1).max(255),
  paragraph_1: z.string().min(1),
  paragraph_2: z.string().min(1),
  paragraph_3: z.string().min(1)
});

const achievementSchema = z.object({
  title: z.string().min(1).max(255),
  body: z.string().min(1),
  sort_order: z.coerce.number().int().default(0)
});

const bookSchema = z.object({
  title: z.string().min(1).max(255),
  genre: z.string().min(1).max(255),
  description: z.string().min(1),
  rating: z.coerce.number().min(0).max(5).default(0),
  sort_order: z.coerce.number().int().default(0)
});

const reviewSchema = z.object({
  reviewer_name: z.string().min(1).max(255),
  reviewer_location: z.string().min(1).max(255),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().min(1),
  book_title: z.string().min(1).max(255),
  sort_order: z.coerce.number().int().default(0)
});

const footerSchema = z.object({
  contact_email: z.string().email().max(255),
  contact_phone: z.string().min(1).max(64),
  vk_label: z.string().min(1).max(64),
  vk_url: z.string().min(1).max(512),
  tg_label: z.string().min(1).max(64),
  tg_url: z.string().min(1).max(512),
  ig_label: z.string().min(1).max(64),
  ig_url: z.string().min(1).max(512),
  copyright_text: z.string().min(1).max(255)
});

function fileUrl(req, field) {
  const f = req.files?.[field]?.[0] || req.file;
  if (!f) return null;
  return `/media/${f.filename}`;
}

// Cover
adminRouter.get('/cover', async (req, res) => {
  const rows = await query(
    'SELECT author_name, subtitle, description, author_photo_path, stat_books, stat_readers, stat_rating FROM cover WHERE id = 1'
  );
  return res.json(rows[0] || null);
});

adminRouter.put('/cover', async (req, res) => {
  const parsed = coverSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'VALIDATION', details: parsed.error.flatten() });

  const photo = fileUrl(req, 'authorPhoto');
  const { author_name, subtitle, description, stat_books, stat_readers, stat_rating } = parsed.data;

  await query(
    `UPDATE cover
     SET author_name=?, subtitle=?, description=?, stat_books=?, stat_readers=?, stat_rating=?,
         author_photo_path = COALESCE(?, author_photo_path)
     WHERE id=1`,
    [author_name, subtitle, description, stat_books, stat_readers, stat_rating, photo]
  );

  const rows = await query(
    'SELECT author_name, subtitle, description, author_photo_path, stat_books, stat_readers, stat_rating FROM cover WHERE id = 1'
  );
  return res.json(rows[0]);
});

// About + achievements
adminRouter.get('/about', async (req, res) => {
  const about = await query('SELECT title, image_path, paragraph_1, paragraph_2, paragraph_3 FROM about WHERE id = 1');
  const achievements = await query('SELECT id, title, body, sort_order FROM achievements ORDER BY sort_order ASC, id ASC');
  return res.json({ about: about[0] || null, achievements });
});

adminRouter.put('/about', async (req, res) => {
  const parsed = aboutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'VALIDATION', details: parsed.error.flatten() });

  const image = fileUrl(req, 'aboutImage');
  const { title, paragraph_1, paragraph_2, paragraph_3 } = parsed.data;

  await query(
    `UPDATE about
     SET title=?, paragraph_1=?, paragraph_2=?, paragraph_3=?,
         image_path = COALESCE(?, image_path)
     WHERE id=1`,
    [title, paragraph_1, paragraph_2, paragraph_3, image]
  );

  const aboutRows = await query('SELECT title, image_path, paragraph_1, paragraph_2, paragraph_3 FROM about WHERE id = 1');
  return res.json(aboutRows[0]);
});

adminRouter.post('/achievements', async (req, res) => {
  const parsed = achievementSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'VALIDATION', details: parsed.error.flatten() });

  const result = await query('INSERT INTO achievements (title, body, sort_order) VALUES (?, ?, ?)', [
    parsed.data.title,
    parsed.data.body,
    parsed.data.sort_order
  ]);
  const rows = await query('SELECT id, title, body, sort_order FROM achievements WHERE id=?', [result.insertId]);
  return res.json(rows[0]);
});

adminRouter.put('/achievements/:id', async (req, res) => {
  const id = Number(req.params.id);
  const parsed = achievementSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'VALIDATION', details: parsed.error.flatten() });

  await query('UPDATE achievements SET title=?, body=?, sort_order=? WHERE id=?', [
    parsed.data.title,
    parsed.data.body,
    parsed.data.sort_order,
    id
  ]);
  const rows = await query('SELECT id, title, body, sort_order FROM achievements WHERE id=?', [id]);
  return res.json(rows[0] || null);
});

adminRouter.delete('/achievements/:id', async (req, res) => {
  const id = Number(req.params.id);
  await query('DELETE FROM achievements WHERE id=?', [id]);
  return res.json({ ok: true });
});

// Books
adminRouter.get('/books', async (req, res) => {
  const rows = await query(
    'SELECT id, title, genre, description, rating, cover_path, sort_order FROM books ORDER BY sort_order ASC, id ASC'
  );
  return res.json(rows);
});

adminRouter.post('/books', async (req, res) => {
  const parsed = bookSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'VALIDATION', details: parsed.error.flatten() });
  const cover = fileUrl(req, 'cover');
  const r = parsed.data;
  const result = await query(
    'INSERT INTO books (title, genre, description, rating, cover_path, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
    [r.title, r.genre, r.description, r.rating, cover, r.sort_order]
  );
  const rows = await query(
    'SELECT id, title, genre, description, rating, cover_path, sort_order FROM books WHERE id=?',
    [result.insertId]
  );
  return res.json(rows[0]);
});

adminRouter.put('/books/:id', async (req, res) => {
  const id = Number(req.params.id);
  const parsed = bookSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'VALIDATION', details: parsed.error.flatten() });
  const cover = fileUrl(req, 'cover');
  const r = parsed.data;

  await query(
    `UPDATE books
     SET title=?, genre=?, description=?, rating=?, sort_order=?,
         cover_path = COALESCE(?, cover_path)
     WHERE id=?`,
    [r.title, r.genre, r.description, r.rating, r.sort_order, cover, id]
  );
  const rows = await query(
    'SELECT id, title, genre, description, rating, cover_path, sort_order FROM books WHERE id=?',
    [id]
  );
  return res.json(rows[0] || null);
});

adminRouter.delete('/books/:id', async (req, res) => {
  const id = Number(req.params.id);
  await query('DELETE FROM books WHERE id=?', [id]);
  return res.json({ ok: true });
});

// Reviews
adminRouter.get('/reviews', async (req, res) => {
  const rows = await query(
    'SELECT id, reviewer_name, reviewer_location, rating, body, book_title, avatar_path, sort_order FROM reviews ORDER BY sort_order ASC, id ASC'
  );
  return res.json(rows);
});

adminRouter.post('/reviews', async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'VALIDATION', details: parsed.error.flatten() });
  const avatar = fileUrl(req, 'avatar');
  const r = parsed.data;
  const result = await query(
    'INSERT INTO reviews (reviewer_name, reviewer_location, rating, body, book_title, avatar_path, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [r.reviewer_name, r.reviewer_location, r.rating, r.body, r.book_title, avatar, r.sort_order]
  );
  const rows = await query(
    'SELECT id, reviewer_name, reviewer_location, rating, body, book_title, avatar_path, sort_order FROM reviews WHERE id=?',
    [result.insertId]
  );
  return res.json(rows[0]);
});

adminRouter.put('/reviews/:id', async (req, res) => {
  const id = Number(req.params.id);
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'VALIDATION', details: parsed.error.flatten() });
  const avatar = fileUrl(req, 'avatar');
  const r = parsed.data;

  await query(
    `UPDATE reviews
     SET reviewer_name=?, reviewer_location=?, rating=?, body=?, book_title=?, sort_order=?,
         avatar_path = COALESCE(?, avatar_path)
     WHERE id=?`,
    [r.reviewer_name, r.reviewer_location, r.rating, r.body, r.book_title, r.sort_order, avatar, id]
  );
  const rows = await query(
    'SELECT id, reviewer_name, reviewer_location, rating, body, book_title, avatar_path, sort_order FROM reviews WHERE id=?',
    [id]
  );
  return res.json(rows[0] || null);
});

adminRouter.delete('/reviews/:id', async (req, res) => {
  const id = Number(req.params.id);
  await query('DELETE FROM reviews WHERE id=?', [id]);
  return res.json({ ok: true });
});

// Footer
adminRouter.get('/footer', async (_req, res) => {
  const rows = await query(
    'SELECT contact_email, contact_phone, vk_label, vk_url, tg_label, tg_url, ig_label, ig_url, copyright_text FROM footer WHERE id=1'
  );
  return res.json(rows[0] || null);
});

adminRouter.put('/footer', async (req, res) => {
  const parsed = footerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'VALIDATION', details: parsed.error.flatten() });

  const f = parsed.data;
  await query(
    `UPDATE footer
     SET contact_email=?, contact_phone=?,
         vk_label=?, vk_url=?,
         tg_label=?, tg_url=?,
         ig_label=?, ig_url=?,
         copyright_text=?
     WHERE id=1`,
    [f.contact_email, f.contact_phone, f.vk_label, f.vk_url, f.tg_label, f.tg_url, f.ig_label, f.ig_url, f.copyright_text]
  );
  const rows = await query(
    'SELECT contact_email, contact_phone, vk_label, vk_url, tg_label, tg_url, ig_label, ig_url, copyright_text FROM footer WHERE id=1'
  );
  return res.json(rows[0]);
});

