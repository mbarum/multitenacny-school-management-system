import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

let loadedEnvPath: string | null = null;
let parsedEnvObject: Record<string, string> = {};

export function loadEnvConfig(): { envPath: string | null; env: NodeJS.ProcessEnv; parsed: Record<string, string> } {
  if (loadedEnvPath) {
    return { envPath: loadedEnvPath, env: process.env, parsed: parsedEnvObject };
  }

  // Multi-directory search order for .env
  const candidatePaths = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'server', '.env'),
    path.join(process.cwd(), '..', '.env'),
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '.env'),
    path.join(__dirname, '..', '..', '..', '.env'),
  ];

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        const rawContent = fs.readFileSync(candidate, 'utf-8');
        const parsed = dotenv.parse(rawContent);
        const originalPort = process.env.PORT;
        // Force-override process.env with values directly from this file to ensure .env takes precedence over stale shell variables
        for (const [key, val] of Object.entries(parsed)) {
          if (key === 'PORT' && originalPort) {
            continue;
          }
          process.env[key] = val;
        }
        parsedEnvObject = parsed;
        loadedEnvPath = candidate;
        break;
      }
    } catch {
      // Continue to next candidate path
    }
  }

  if (!loadedEnvPath) {
    const res = dotenv.config();
    if (res.parsed) {
      parsedEnvObject = res.parsed;
    }
  }

  return { envPath: loadedEnvPath, env: process.env, parsed: parsedEnvObject };
}

export interface ResolvedDbConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  database: string;
  url?: string;
  envFileUsed: string | null;
  detectedKeys: string[];
}

function cleanVal(v: string | undefined): string | undefined {
  if (v === undefined || v === null) return undefined;
  let s = String(v).trim();
  // Strip enclosing quotes if any
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  return s.trim();
}

export function getDatabaseCredentials(): ResolvedDbConfig {
  const { envPath, parsed } = loadEnvConfig();

  // Helper to read key with direct file fallback if shell environment is desynced
  const getVal = (key: string): string | undefined => {
    return cleanVal(process.env[key] || parsed[key]);
  };

  const detectedKeys: string[] = [];
  const recordKey = (key: string, val: string | undefined) => {
    if (val !== undefined && val !== '') {
      detectedKeys.push(key);
    }
  };

  // Check DATABASE_URL or MYSQL_URL
  const rawUrl = getVal('DATABASE_URL') || getVal('MYSQL_URL');
  recordKey('DATABASE_URL', rawUrl);

  if (rawUrl) {
    try {
      const parsedUrl = new URL(rawUrl);
      const urlUser = decodeURIComponent(parsedUrl.username || 'root');
      const urlPass = decodeURIComponent(parsedUrl.password || '');
      const urlDb = parsedUrl.pathname ? parsedUrl.pathname.replace(/^\//, '') : 'saaslink_db';

      return {
        host: parsedUrl.hostname || '127.0.0.1',
        port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 3306,
        username: urlUser,
        password: urlPass,
        database: urlDb,
        url: rawUrl,
        envFileUsed: envPath,
        detectedKeys,
      };
    } catch {
      // Fall through to individual variables
    }
  }

  // Detect Host
  const host = getVal('MYSQL_HOST') || getVal('DB_HOST') || '127.0.0.1';
  recordKey('MYSQL_HOST', getVal('MYSQL_HOST'));
  recordKey('DB_HOST', getVal('DB_HOST'));

  // Detect Port
  const rawPort = getVal('MYSQL_PORT') || getVal('DB_PORT') || '3306';
  const port = parseInt(rawPort, 10) || 3306;
  recordKey('MYSQL_PORT', getVal('MYSQL_PORT'));

  // Detect Username (check all common variants)
  const username =
    getVal('MYSQL_USER') ||
    getVal('DB_USER') ||
    getVal('DB_USERNAME') ||
    getVal('MYSQL_USERNAME') ||
    'root';
  recordKey('MYSQL_USER', getVal('MYSQL_USER'));
  recordKey('DB_USER', getVal('DB_USER'));

  // Detect Password (check all common variants, explicitly allowing empty string if set)
  let password = '';
  if (getVal('MYSQL_PASSWORD') !== undefined) {
    password = getVal('MYSQL_PASSWORD')!;
    recordKey('MYSQL_PASSWORD', '[set]');
  } else if (getVal('DB_PASSWORD') !== undefined) {
    password = getVal('DB_PASSWORD')!;
    recordKey('DB_PASSWORD', '[set]');
  } else if (getVal('DB_PASS') !== undefined) {
    password = getVal('DB_PASS')!;
    recordKey('DB_PASS', '[set]');
  } else if (getVal('MYSQL_ROOT_PASSWORD') !== undefined) {
    password = getVal('MYSQL_ROOT_PASSWORD')!;
    recordKey('MYSQL_ROOT_PASSWORD', '[set]');
  }

  // Detect Database Name
  const database =
    getVal('MYSQL_DATABASE') ||
    getVal('DB_NAME') ||
    getVal('DB_DATABASE') ||
    getVal('MYSQL_DB') ||
    'saaslink_db';
  recordKey('MYSQL_DATABASE', getVal('MYSQL_DATABASE'));
  recordKey('DB_NAME', getVal('DB_NAME'));

  return {
    host,
    port,
    username,
    password,
    database,
    envFileUsed: envPath,
    detectedKeys,
  };
}
