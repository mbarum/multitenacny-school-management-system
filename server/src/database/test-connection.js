const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

// Find active .env file
const candidates = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'server', '.env'),
  path.join(process.cwd(), '..', '.env'),
  path.join(__dirname, '..', '..', '.env'),
];

let activePath = null;
let parsed = {};
for (const p of candidates) {
  if (fs.existsSync(p) && fs.statSync(p).isFile()) {
    const raw = fs.readFileSync(p, 'utf-8');
    parsed = dotenv.parse(raw);
    for (const [k, v] of Object.entries(parsed)) {
      process.env[k] = v;
    }
    activePath = p;
    break;
  }
}

function clean(v) {
  if (v === undefined || v === null) return undefined;
  let s = String(v).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  return s.trim();
}

const getVal = (k) => clean(process.env[k] || parsed[k]);

const host = getVal('MYSQL_HOST') || getVal('DB_HOST') || '127.0.0.1';
const port = parseInt(getVal('MYSQL_PORT') || getVal('DB_PORT') || '3306', 10);
const user = getVal('MYSQL_USER') || getVal('DB_USER') || getVal('MYSQL_USERNAME') || 'root';
const password = getVal('MYSQL_PASSWORD') !== undefined 
  ? getVal('MYSQL_PASSWORD') 
  : (getVal('DB_PASSWORD') !== undefined 
      ? getVal('DB_PASSWORD') 
      : (getVal('MYSQL_ROOT_PASSWORD') !== undefined ? getVal('MYSQL_ROOT_PASSWORD') : ''));
const database = getVal('MYSQL_DATABASE') || getVal('DB_NAME') || 'saaslink_db';

console.log('------------------------------------------------------------');
console.log('🔍  MYSQL CONNECTION DIAGNOSTIC TEST');
console.log(`📁  .env file used : ${activePath || 'NONE'}`);
console.log(`🌐  Host           : ${host}:${port}`);
console.log(`👤  User           : ${user}`);
console.log(`🔑  Password       : ${password ? 'CONFIGURED (' + password.length + ' chars)' : 'EMPTY / NOT SET'}`);
console.log(`🗄️   Database       : ${database}`);
console.log('------------------------------------------------------------');

async function testConnection() {
  try {
    console.log(`⏳ Testing TCP connection and credentials with MySQL...`);
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database: undefined,
    });

    console.log(`✅  Authentication successful for user "${user}"!`);
    
    // Check if database exists
    const [rows] = await connection.query(`SHOW DATABASES LIKE ?`, [database]);
    if (rows.length > 0) {
      console.log(`✅  Database "${database}" exists.`);
    } else {
      console.log(`⚠️   Database "${database}" does not exist yet.`);
      console.log(`⏳ Creating database "${database}"...`);
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✅  Database "${database}" successfully created!`);
    }

    await connection.end();
    console.log('------------------------------------------------------------');
    console.log('🎉  ALL CHECKS PASSED: Your MySQL credentials are working.');
    console.log('------------------------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('------------------------------------------------------------');
    console.error('❌  CONNECTION FAILED:');
    console.error(`Error Code   : ${err.code}`);
    console.error(`Error Number : ${err.errno}`);
    console.error(`Message      : ${err.message}`);
    console.log('------------------------------------------------------------');
    process.exit(1);
  }
}

testConnection();
