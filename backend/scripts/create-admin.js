import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { query } from '../src/db.js';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Администратор';

  if (!email || !password) {
    console.error('ADMIN_EMAIL/ADMIN_PASSWORD не заданы');
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 10);

  const rows = await query('SELECT id FROM users WHERE email=? LIMIT 1', [email.toLowerCase()]);
  if (rows[0]) {
    await query('UPDATE users SET name=?, password_hash=?, role="admin" WHERE id=?', [name, password_hash, rows[0].id]);
    console.log(`Admin обновлён: ${email}`);
    return;
  }

  await query('INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, "admin")', [
    email.toLowerCase(),
    name,
    password_hash
  ]);
  console.log(`Admin создан: ${email}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

