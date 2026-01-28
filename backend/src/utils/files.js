import fs from 'node:fs';
import path from 'node:path';
import { nanoid } from 'nanoid';

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function safeExt(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
  return allowed.has(ext) ? ext : '';
}

export function makeMediaFilename(originalName) {
  const ext = safeExt(originalName);
  return `${nanoid(16)}${ext || ''}`;
}

