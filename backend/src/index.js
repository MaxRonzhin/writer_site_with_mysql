import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import multer from 'multer';
import 'dotenv/config';

import { authRouter } from './routes/auth.js';
import { publicRouter } from './routes/public.js';
import { adminRouter } from './routes/admin.js';
import { requireAdmin, requireAuth } from './middleware/auth.js';
import { ensureDir, makeMediaFilename } from './utils/files.js';

const app = express();

const port = Number(process.env.PORT || 3000);
const corsOrigin = process.env.CORS_ORIGIN || '';

// Определяем media dir: если сервер запускают из корня проекта — ./media,
// если из ./backend — ../media.
const cwdMedia = path.resolve(process.cwd(), 'media');
const backendMedia = path.resolve(process.cwd(), '..', 'media');
const mediaDir = fs.existsSync(cwdMedia) ? cwdMedia : backendMedia;
ensureDir(mediaDir);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, mediaDir),
    filename: (_req, file, cb) => cb(null, makeMediaFilename(file.originalname))
  }),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));

if (corsOrigin) {
  app.use(cors({ origin: corsOrigin, credentials: false }));
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Статика: фронтенд и media
app.use('/media', express.static(mediaDir));

// Если запускаем из корня — раздаём текущую папку,
// если из backend — раздаём родителя (где index.html).
const staticRoot = fs.existsSync(path.resolve(process.cwd(), 'index.html'))
  ? process.cwd()
  : path.resolve(process.cwd(), '..');
app.use(express.static(staticRoot));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/public', publicRouter);

// Админ: условный multer - только для роутов с файлами
app.use(
  '/api/admin',
  requireAuth,
  requireAdmin,
  (req, res, next) => {
    // Для роутов /users не используем multer (JSON запросы)
    if (req.path.startsWith('/users')) {
      return next();
    }
    // Для остальных роутов используем multer
    return upload.fields([
      { name: 'authorPhoto', maxCount: 1 },
      { name: 'aboutImage', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
      { name: 'avatar', maxCount: 1 }
    ])(req, res, next);
  },
  adminRouter
);

app.listen(port, () => {
  console.log(`Server: http://localhost:${port}`);
  console.log(`Static root: ${staticRoot}`);
  console.log(`Media dir: ${mediaDir}`);
});

