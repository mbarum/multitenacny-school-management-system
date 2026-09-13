const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Find active .env file
const candidates = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'server', '.env'),
  path.join(process.cwd(), '..', '.env'),
  path.join(__dirname, '..', '..', '.env'),
];

let activePath = null;
for (const p of candidates) {
  if (fs.existsSync(p) && fs.statSync(p).isFile()) {
    dotenv.config({ path: p, override: true });
    activePath = p;
    break;
  }
}

console.log('======================================================');
console.log('📋  ENVIRONMENT FILE (.ENV) INSPECTOR');
console.log('======================================================');
console.log(`📁 File loaded: ${activePath || 'NONE FOUND'}`);

if (!activePath) {
  console.log('❌ No .env file was found in current or parent directories.');
  process.exit(1);
}

const rawContent = fs.readFileSync(activePath, 'utf8');
const lines = rawContent.split(/\r?\n/);

console.log('\n--- Relevant Database Keys Found In File ---');
let dbKeysCount = 0;
lines.forEach((line, idx) => {
  const trimmed = line.trim();
  if (
    trimmed.startsWith('MYSQL_') ||
    trimmed.startsWith('DB_') ||
    trimmed.startsWith('DATABASE_')
  ) {
    dbKeysCount++;
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    let val = parts.slice(1).join('=').trim();
    if (key.includes('PASS') || key.includes('SECRET')) {
      val = val ? `[HIDDEN: length ${val.length} chars, starts with "${val.slice(0, 2)}..."]` : '[EMPTY]';
    }
    console.log(`Line ${String(idx + 1).padStart(2, ' ')}: ${key} = ${val}`);
  }
});

if (dbKeysCount === 0) {
  console.log('⚠️  No database keys (MYSQL_* or DB_*) found in this file!');
}

console.log('\n--- Resolved Values Actually Seen By Node ---');
console.log(`process.env.MYSQL_USER     : ${JSON.stringify(process.env.MYSQL_USER)}`);
console.log(`process.env.DB_USER        : ${JSON.stringify(process.env.DB_USER)}`);
console.log(`process.env.MYSQL_HOST     : ${JSON.stringify(process.env.MYSQL_HOST)}`);
console.log(`process.env.MYSQL_PORT     : ${JSON.stringify(process.env.MYSQL_PORT)}`);
console.log(`process.env.MYSQL_DATABASE : ${JSON.stringify(process.env.MYSQL_DATABASE)}`);
console.log(`process.env.DB_NAME        : ${JSON.stringify(process.env.DB_NAME)}`);
console.log(`process.env.DATABASE_URL   : ${JSON.stringify(process.env.DATABASE_URL)}`);
console.log('======================================================');
