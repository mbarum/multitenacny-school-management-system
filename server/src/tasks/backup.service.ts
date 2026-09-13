
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.join((process as any).cwd(), 'backups');

  constructor(private configService: ConfigService) {
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async performDailyBackup(): Promise<void> {
    this.logger.log('Starting daily database backup...');

    const host = this.configService.get<string>('MYSQL_HOST', 'localhost');
    const port = String(this.configService.get<number | string>('MYSQL_PORT', 3306));
    const user = this.configService.get<string>('MYSQL_USER') || this.configService.get<string>('DB_USER', 'root');
    const password = this.configService.get<string>('MYSQL_PASSWORD') || this.configService.get<string>('MYSQL_ROOT_PASSWORD', '');
    const database = this.configService.get<string>('MYSQL_DATABASE') || this.configService.get<string>('DB_NAME', 'saaslink_db');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${database}-${timestamp}.sql`;
    const filePath = path.join(this.backupDir, filename);

    // Secure execution: use spawn with parameterized arguments and MYSQL_PWD env var
    // to completely avoid command injection and hiding passwords from 'ps aux'
    const args = ['-h', host, '-P', port, '-u', user, database];

    return new Promise((resolve) => {
      const writeStream = fs.createWriteStream(filePath);
      const child = spawn('mysqldump', args, {
        env: { ...process.env, MYSQL_PWD: password },
      });

      child.stdout.pipe(writeStream);

      let stderrData = '';
      child.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      child.on('error', (err) => {
        this.logger.error(`Database backup process failed to spawn: ${err.message}`);
        resolve();
      });

      child.on('close', (code) => {
        writeStream.end();
        if (code === 0) {
          this.logger.log(`Backup completed successfully: ${filename}`);
          this.cleanOldBackups();
        } else {
          this.logger.error(`Database backup failed with exit code ${code}: ${stderrData}`);
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch {}
          }
        }
        resolve();
      });
    });
  }

  private cleanOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const now = Date.now();
      const retentionMs = 7 * 24 * 60 * 60 * 1000; // 7 Days

      files.forEach(file => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtime.getTime() > retentionMs) {
          fs.unlinkSync(filePath);
          this.logger.log(`Deleted old backup: ${file}`);
        }
      });
    } catch (error) {
      this.logger.error('Failed to clean old backups', error);
    }
  }
}
