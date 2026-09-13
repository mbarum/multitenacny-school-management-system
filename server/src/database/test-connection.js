require('dotenv').config();
const mysql = require('mysql2/promise');

const host = process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1';
const port = parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10);
const user = process.env.MYSQL_USER || process.env.DB_USER || 'root';
const password = process.env.MYSQL_PASSWORD !== undefined
  ? process.env.MYSQL_PASSWORD
  : (process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '');
const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'saaslink_db';

console.log('------------------------------------------------------------');
console.log('🔍  MYSQL CONNECTION DIAGNOSTIC TEST');
console.log(`🌐  Host      : ${host}:${port}`);
console.log(`👤  User      : ${user}`);
console.log(`🔑  Password  : ${password ? 'CONFIGURED (' + password.length + ' chars)' : 'EMPTY / NOT SET'}`);
console.log(`🗄️   Database  : ${database}`);
console.log('------------------------------------------------------------');

async function testConnection() {
  try {
    console.log(`⏳ Testing TCP connection and credentials with MySQL...`);
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database: null, // Test user authentication first without selecting database
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
    console.error('------------------------------------------------------------');
    
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n🛠️   HOW TO FIX (Access Denied):');
      console.log(`1. Your MySQL server rejected the credentials for '${user}'@'${host}'.`);
      console.log(`2. If your database user is different (e.g. saaslink_user), edit your .env:`);
      console.log(`   MYSQL_USER=saaslink_user`);
      console.log(`   MYSQL_PASSWORD=your_actual_password`);
      console.log(`3. Or grant privileges in MySQL as root:`);
      console.log(`   sudo mysql -e "CREATE USER IF NOT EXISTS '${user}'@'localhost' IDENTIFIED BY '${password || 'your_password'}';"`);
      console.log(`   sudo mysql -e "GRANT ALL PRIVILEGES ON \`${database}\`.* TO '${user}'@'localhost'; FLUSH PRIVILEGES;"`);
    } else if (err.code === 'ECONNREFUSED') {
      console.log('\n🛠️   HOW TO FIX (Connection Refused):');
      console.log(`1. Ensure MySQL service is running: sudo systemctl start mysql`);
    }
    process.exit(1);
  }
}

testConnection();
