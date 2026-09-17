const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const cleanLine = line.startsWith('export ') ? line.slice(7).trim() : line;
      const eqIdx = cleanLine.indexOf('=');
      if (eqIdx === -1) continue;

      const key = cleanLine.slice(0, eqIdx).trim();
      let val = cleanLine.slice(eqIdx + 1).trim();

      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }

      if (key) {
        env[key] = val;
      }
    }
  } catch (err) {
    console.warn(`[PM2 ecosystem] Warning: Failed to read env file at ${filePath}:`, err.message);
  }

  return env;
}

const envFile = path.resolve(__dirname, '.env');
const loadedEnv = parseEnvFile(envFile);

module.exports = {
  apps: [
    {
      name: 'saaslink-emis',
      cwd: __dirname,
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 2000,
      env_file: fs.existsSync(envFile) ? envFile : undefined,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        ...loadedEnv,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        ...loadedEnv,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        ...loadedEnv,
      },
      error_file: path.resolve(__dirname, 'logs', 'pm2-err.log'),
      out_file: path.resolve(__dirname, 'logs', 'pm2-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
