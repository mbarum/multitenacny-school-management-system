
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
  async performDailyBackup() {
    this.logger.log('Starting daily database backup...');

    const host = this.configService.get<string>('MYSQL_HOST', 'localhost');
    const user = this.configService.get<string>('MYSQL_USER', 'root');
    const password = this.configService.get<string>('MYSQL_ROOT_PASSWORD', '');
    const database = this.configService.get<string>('MYSQL_DATABASE', 'saaslink_db');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${database}-${timestamp}.sql`;
    const filePath = path.join(this.backupDir, filename);

    // Note: This requires 'mysqldump' to be available in the system PATH.
    // In Docker, ensure the container has mysql-client installed.
    const command = `mysqldump -h ${host} -u ${user} ${password ? `-p${password}` : ''} ${database} > "${filePath}"`;

    try {
      await execAsync(command);
      this.logger.log(`Backup completed successfully: ${filename}`);
      
      // Cleanup: Keep only last 7 days
      this.cleanOldBackups();
    } catch (error) {
      this.logger.error('Database backup failed', error);
    }
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
