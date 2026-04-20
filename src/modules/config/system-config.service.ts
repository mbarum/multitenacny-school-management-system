import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './entities/system-config.entity';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class SystemConfigService {
  constructor(
    @InjectRepository(SystemConfig)
    private readonly systemConfigRepository: Repository<SystemConfig>,
    private readonly nestConfigService: NestConfigService,
  ) {}

  async get(key: string): Promise<string | null> {
    const dbConfig = await this.systemConfigRepository.findOne({ where: { key } });
    if (dbConfig && dbConfig.value) {
      return dbConfig.value;
    }
    // Fallback to environment variables
    return this.nestConfigService.get<string>(key) || null;
  }

  async getAllSettings(): Promise<Record<string, string>> {
    const configs = await this.systemConfigRepository.find();
    const result: Record<string, string> = {};
    configs.forEach(c => {
      result[c.key] = c.value || '';
    });
    return result;
  }

  async set(key: string, value: string): Promise<void> {
    const config = new SystemConfig();
    config.key = key;
    config.value = value;
    await this.systemConfigRepository.save(config);
  }

  async setMultiple(settings: Record<string, string>): Promise<void> {
    const promises = Object.entries(settings).map(async ([key, value]) => {
      return this.set(key, value);
    });
    await Promise.all(promises);
  }
}
