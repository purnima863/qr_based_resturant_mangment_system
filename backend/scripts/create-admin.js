/* Create or reset the admin login.   Usage:  npm run create-admin -- admin "YourStrongPassword" */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../db');

(async () => {
  const [username, password] = process.argv.slice(2);
  if (!username || !password) { console.log('Usage: npm run create-admin -- <username> "<password>"'); process.exit(1); }
  if (password.length < 8) { console.log('Password must be at least 8 characters.'); process.exit(1); }
  const hash = await bcrypt.hash(password, 10);
  await pool.query('INSERT INTO admins (username, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)', [username, hash]);
  console.log(`Admin "${username}" saved. You can now log in.`);
  process.exit(0);
})().catch(e => { console.error('Failed:', e.message); process.exit(1); });
