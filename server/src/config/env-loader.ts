import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

let loadedEnvPath: string | null = null;

export function loadEnvConfig(): { envPath: string | null; env: NodeJS.ProcessEnv } {
  if (loadedEnvPath) {
    return { envPath: loadedEnvPath, env: process.env };
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
        const result = dotenv.config({ path: candidate });
        if (!result.error) {
          loadedEnvPath = candidate;
          break;
        }
      }
    } catch {
      // Continue to next candidate path
    }
  }

  if (!loadedEnvPath) {
    dotenv.config(); // fallback default
  }

  return { envPath: loadedEnvPath, env: process.env };
}

export interface ResolvedDbConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  database: string;
  url?: string;
  envFileUsed: string | null;
}

export function getDatabaseCredentials(): ResolvedDbConfig {
  const { envPath } = loadEnvConfig();

  // If full DATABASE_URL or MYSQL_URL is provided:
  const rawUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      return {
        host: parsed.hostname || 'localhost',
        port: parsed.port ? parseInt(parsed.port, 10) : 3306,
        username: decodeURIComponent(parsed.username || 'root'),
        password: decodeURIComponent(parsed.password || ''),
        database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'saaslink_db',
        url: rawUrl,
        envFileUsed: envPath,
      };
    } catch {
      // If parsing fails, fall back to individual variables below
    }
  }

  const host = process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10);
  const username = process.env.MYSQL_USER || process.env.DB_USER || process.env.MYSQL_USERNAME || 'root';
  
  // Check password keys in order of precedence
  const password = process.env.MYSQL_PASSWORD !== undefined
    ? process.env.MYSQL_PASSWORD
    : (process.env.DB_PASSWORD !== undefined
        ? process.env.DB_PASSWORD
        : (process.env.MYSQL_ROOT_PASSWORD !== undefined ? process.env.MYSQL_ROOT_PASSWORD : ''));

  const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || process.env.MYSQL_DB || 'saaslink_db';

  return {
    host,
    port,
    username,
    password,
    database,
    envFileUsed: envPath,
  };
}
