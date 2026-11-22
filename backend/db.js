require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'qr_restaurant',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,   // DECIMAL columns come back as numbers, not strings
  timezone: 'Z'           // dates are handled in UTC
});
pool.on('connection', c => c.query("SET time_zone = '+00:00'"));

module.exports = pool;
