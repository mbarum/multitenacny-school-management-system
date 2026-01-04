
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../entities/school.entity';
import { DarajaSetting } from '../entities/daraja-setting.entity';
import { PlatformSetting } from '../entities/platform-setting.entity';
import { UpdateSchoolInfoDto } from './dto/update-school-info.dto';
import { UpdateDarajaSettingsDto } from './dto/update-daraja-settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private ratesCache: { timestamp: number, rates: any } | null = null;

  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    @InjectRepository(DarajaSetting)
    private readonly darajaSettingRepository: Repository<DarajaSetting>,
    @InjectRepository(PlatformSetting)
    private readonly platformSettingRepository: Repository<PlatformSetting>,
  ) {}

  async getPublicSchoolInfo(): Promise<School> {
    return {
        name: 'Saaslink School Portal',
        logoUrl: 'https://i.imgur.com/S5o7W44.png',
        address: 'Service Cloud',
        phone: '+254...',
        email: 'support@saaslink.com',
        schoolCode: 'SIS',
        gradingSystem: 'Traditional',
        currency: 'KES'
    } as unknown as School;
  }

  async getExchangeRates(base: string = 'KES'): Promise<Record<string, number>> {
      const now = Date.now();
      const ONE_HOUR = 3600 * 1000;
      if (this.ratesCache && (now - this.ratesCache.timestamp < ONE_HOUR)) {
          return this.ratesCache.rates;
      }
      try {
          const response = await fetch(`https://open.er-api.com/v6/latest/${base}`);
          const data = await response.json();
          if (data && data.rates) {
              this.ratesCache = { timestamp: now, rates: data.rates };
              return data.rates;
          }
          throw new Error("Invalid API response");
      } catch (error) {
          return { KES: 1, USD: 0.0077, UGX: 28.5, TZS: 19.8, RWF: 9.8, BIF: 22.0 };
      }
  }
  
  async getPlatformPricing(): Promise<PlatformSetting> {
      const setting = await this.platformSettingRepository.findOne({ where: {} });
      return setting || ({ basicMonthlyPrice: 3000 } as PlatformSetting);
  }

  async getSchoolInfo(schoolId: string): Promise<any> {
    const school = await this.schoolRepository.findOne({ 
      where: { id: schoolId },
      relations: ['subscription'] // Load the subscription details
    });
    if (!school) throw new NotFoundException('School settings not accessible.');
    return school;
  }

  async updateSchoolInfo(schoolId: string, data: UpdateSchoolInfoDto): Promise<School> {
    const school = await this.schoolRepository.findOne({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');
    const updatedSchool = this.schoolRepository.merge(school, data);
    return this.schoolRepository.save(updatedSchool);
  }
  
  async getDarajaSettings(schoolId: string): Promise<DarajaSetting> {
    const setting = await this.darajaSettingRepository.findOne({ where: { schoolId: schoolId as any } });
    return setting || ({ consumerKey: '', schoolId } as DarajaSetting);
  }

  async updateDarajaSettings(schoolId: string, data: UpdateDarajaSettingsDto): Promise<DarajaSetting> {
    let setting = await this.darajaSettingRepository.findOne({ where: { schoolId: schoolId as any } });
    if (!setting) {
        setting = this.darajaSettingRepository.create({ school: { id: schoolId } as any, ...data });
    } else {
        this.darajaSettingRepository.merge(setting, data);
    }
    return this.darajaSettingRepository.save(setting);
  }
}
