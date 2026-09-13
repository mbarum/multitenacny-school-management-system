const mysql = require('mysql2/promise');

async function ensureDatabaseExists(host, port, user, password, database) {
  try {
    const conn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database: null,
    });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.end();
    return true;
  } catch (err) {
    // If user lacks permission to CREATE DATABASE (or already exists), proceed and let TypeORM attempt connection
    return false;
  }
}

module.exports = { ensureDatabaseExists };
