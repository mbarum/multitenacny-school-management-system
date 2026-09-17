const fs = require('fs');
const path = require('path');

/**
 * Parses a .env file and extracts key-value pairs into a clean dictionary.
 * Does not depend on external packages so PM2 can always load it reliably.
 */
function parseEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const rawLine of lines) {
      const line = rawLine.trim();
      // Skip comments and empty lines
      if (!line || line.startsWith('#')) continue;

      // Strip 'export ' prefix if present
      const cleanLine = line.startsWith('export ') ? line.slice(7).trim() : line;
      const eqIdx = cleanLine.indexOf('=');
      if (eqIdx === -1) continue;

      const key = cleanLine.slice(0, eqIdx).trim();
      let val = cleanLine.slice(eqIdx + 1).trim();

      // Strip matching outer quotes
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

// Search order for backend environment files
const serverDir = path.resolve(__dirname, 'server');
const serverEnv = path.resolve(serverDir, '.env');
const rootEnv = path.resolve(__dirname, '.env');

// Merge environment: server/.env takes precedence, falling back to root .env
const loadedEnv = {
  ...parseEnvFile(rootEnv),
  ...parseEnvFile(serverEnv),
};

const activeEnvFile = fs.existsSync(serverEnv) ? serverEnv : fs.existsSync(rootEnv) ? rootEnv : undefined;

module.exports = {
  apps: [
    {
      name: 'saaslink-emis',
      cwd: serverDir,
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 2000,
      env_file: activeEnvFile,
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
      error_file: path.resolve(serverDir, 'logs', 'pm2-err.log'),
      out_file: path.resolve(serverDir, 'logs', 'pm2-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
