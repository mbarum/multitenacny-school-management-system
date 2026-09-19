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
  socketPath?: string;
  url?: string;
  envFileUsed: string | null;
  detectedKeys: string[];
}

function cleanVal(v: string | undefined): string | undefined {
  if (v === undefined || v === null) return undefined;
  let s = String(v).trim();
  // Strip enclosing quotes only if strictly wrapped in matching quotes
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  return s;
}

export function getDatabaseCredentials(): ResolvedDbConfig {
  const { envPath, parsed } = loadEnvConfig();

  // If active .env was loaded from disk, its parsed entries are the absolute source of truth
  const getRawVal = (key: string): string | undefined => {
    if (parsed && parsed[key] !== undefined && parsed[key] !== '') {
      return parsed[key];
    }
    if (process.env[key] !== undefined && process.env[key] !== '') {
      return process.env[key];
    }
    return undefined;
  };

  const getCleanVal = (key: string): string | undefined => {
    return cleanVal(getRawVal(key));
  };

  const detectedKeys: string[] = [];
  const recordKey = (key: string, val: string | undefined) => {
    if (val !== undefined && val !== '') {
      detectedKeys.push(key);
    }
  };

  // Check DATABASE_URL or MYSQL_URL
  const rawUrl = getCleanVal('DATABASE_URL') || getCleanVal('MYSQL_URL');
  recordKey('DATABASE_URL', rawUrl);

  if (rawUrl) {
    try {
      const parsedUrl = new URL(rawUrl);
      const urlUser = decodeURIComponent(parsedUrl.username || 'root');
      const urlPass = decodeURIComponent(parsedUrl.password || '');
      const urlDb = parsedUrl.pathname ? parsedUrl.pathname.replace(/^\//, '') : 'emis';

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

  // Detect Host: support both DB_HOST and MYSQL_HOST, prioritizing the active .env definition
  const host = getCleanVal('DB_HOST') || getCleanVal('MYSQL_HOST') || '127.0.0.1';
  recordKey('DB_HOST', getCleanVal('DB_HOST'));
  recordKey('MYSQL_HOST', getCleanVal('MYSQL_HOST'));

  // Detect Port
  const rawPort = getCleanVal('DB_PORT') || getCleanVal('MYSQL_PORT') || '3306';
  const port = parseInt(rawPort, 10) || 3306;
  recordKey('DB_PORT', getCleanVal('DB_PORT'));
  recordKey('MYSQL_PORT', getCleanVal('MYSQL_PORT'));

  // Detect Username
  const username =
    getCleanVal('DB_USER') ||
    getCleanVal('DB_USERNAME') ||
    getCleanVal('MYSQL_USER') ||
    getCleanVal('MYSQL_USERNAME') ||
    'root';
  recordKey('DB_USER', getCleanVal('DB_USER'));
  recordKey('MYSQL_USER', getCleanVal('MYSQL_USER'));

  // Detect Password: Keep raw characters intact (no trimming or quote-stripping that might mutate password)
  let password = '';
  if (getRawVal('DB_PASSWORD') !== undefined) {
    password = getRawVal('DB_PASSWORD')!;
    recordKey('DB_PASSWORD', '[set]');
  } else if (getRawVal('MYSQL_PASSWORD') !== undefined) {
    password = getRawVal('MYSQL_PASSWORD')!;
    recordKey('MYSQL_PASSWORD', '[set]');
  } else if (getRawVal('DB_PASS') !== undefined) {
    password = getRawVal('DB_PASS')!;
    recordKey('DB_PASS', '[set]');
  } else if (getRawVal('MYSQL_ROOT_PASSWORD') !== undefined) {
    password = getRawVal('MYSQL_ROOT_PASSWORD')!;
    recordKey('MYSQL_ROOT_PASSWORD', '[set]');
  }

  // Detect Database Name
  const database =
    getCleanVal('DB_DATABASE') ||
    getCleanVal('DB_NAME') ||
    getCleanVal('MYSQL_DATABASE') ||
    getCleanVal('MYSQL_DB') ||
    'emis';
  recordKey('DB_DATABASE', getCleanVal('DB_DATABASE'));
  recordKey('MYSQL_DATABASE', getCleanVal('MYSQL_DATABASE'));

  // Detect Socket Path if specified
  const socketPath =
    getCleanVal('DB_SOCKET') ||
    getCleanVal('MYSQL_SOCKET') ||
    getCleanVal('DB_SOCKET_PATH') ||
    getCleanVal('MYSQL_SOCKET_PATH');

  return {
    host,
    port,
    username,
    password,
    database,
    socketPath,
    envFileUsed: envPath,
    detectedKeys,
  };
}
