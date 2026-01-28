import express from 'express';
import { query } from '../db.js';

export const publicRouter = express.Router();

publicRouter.get('/landing', async (req, res) => {
  const coverRows = await query(
    'SELECT author_name, subtitle, description, author_photo_path, stat_books, stat_readers, stat_rating FROM cover WHERE id = 1'
  );
  const aboutRows = await query(
    'SELECT title, image_path, paragraph_1, paragraph_2, paragraph_3 FROM about WHERE id = 1'
  );
  const achievements = await query('SELECT id, title, body, sort_order FROM achievements ORDER BY sort_order ASC, id ASC');
  const books = await query(
    'SELECT id, title, genre, description, rating, cover_path, sort_order FROM books ORDER BY sort_order ASC, id ASC'
  );
  const reviews = await query(
    'SELECT id, reviewer_name, reviewer_location, rating, body, book_title, avatar_path, sort_order FROM reviews ORDER BY sort_order ASC, id ASC'
  );
  const footerRows = await query(
    'SELECT contact_email, contact_phone, vk_label, vk_url, tg_label, tg_url, ig_label, ig_url, copyright_text FROM footer WHERE id = 1'
  );

  return res.json({
    cover: coverRows[0] || null,
    about: aboutRows[0] || null,
    achievements,
    books,
    reviews,
    footer: footerRows[0] || null
  });
});

