import { Injectable, OnModuleInit, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolSetting, GradingSystem } from '../entities/school-setting.entity';
import { DarajaSetting } from '../entities/daraja-setting.entity';
import { UpdateSchoolInfoDto } from './dto/update-school-info.dto';
import { UpdateDarajaSettingsDto } from './dto/update-daraja-settings.dto';

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(SchoolSetting)
    private readonly schoolSettingRepository: Repository<SchoolSetting>,
    @InjectRepository(DarajaSetting)
    private readonly darajaSettingRepository: Repository<DarajaSetting>,
  ) {}

  async onModuleInit() {
    // Wrap initialization in try-catch to prevent boot crash if DB is unavailable
    try {
        await this.ensureDefaultSchoolSetting();
        await this.ensureDefaultDarajaSetting();
    } catch (error) {
        this.logger.error('Failed to initialize default settings. Database might be unreachable.', error);
        // Do not rethrow. Allow app to start up even if DB logic fails here.
    }
  }

  private async ensureDefaultSchoolSetting() {
    const count = await this.schoolSettingRepository.count();
    if (count === 0) {
      this.logger.log('No school settings found, creating default entry.');
      const defaultInfo: Omit<SchoolSetting, 'id'> = {
        name: "Springfield Elementary",
        address: "123 Main St, Springfield",
        phone: "555-1234",
        email: "contact@springfield.edu",
        logoUrl: "https://i.imgur.com/pAEt4tQ.png",
        gradingSystem: GradingSystem.Traditional,
        schoolCode: 'SPE',
      };
      const setting = this.schoolSettingRepository.create(defaultInfo);
      await this.schoolSettingRepository.save(setting);
    }
  }

  private async ensureDefaultDarajaSetting() {
    const count = await this.darajaSettingRepository.count();
    if (count === 0) {
      this.logger.log('No Daraja settings found, creating default entry.');
      const defaultDaraja: Omit<DarajaSetting, 'id'> = {
        consumerKey: '',
        consumerSecret: '',
        shortCode: '',
        passkey: '',
        paybillNumber: ''
      };
      const setting = this.darajaSettingRepository.create(defaultDaraja);
      await this.darajaSettingRepository.save(setting);
    }
  }

  async getSchoolInfo(): Promise<SchoolSetting> {
    try {
        const setting = await this.schoolSettingRepository.findOne({ where: {} });
        if (!setting) {
          // Return default object instead of throwing to allow frontend to render
          return {
             id: 0,
             name: 'Default School',
             address: 'Address',
             phone: '',
             email: '',
             schoolCode: 'SCH',
             gradingSystem: GradingSystem.Traditional
          } as SchoolSetting;
        }
        return setting;
    } catch (error) {
        this.logger.error('Error fetching school info', error);
        throw new NotFoundException('School settings not accessible.');
    }
  }

  async updateSchoolInfo(data: UpdateSchoolInfoDto): Promise<SchoolSetting> {
    let setting = await this.schoolSettingRepository.findOne({ where: {} });
    if (!setting) {
       // Try to create if missing
       setting = this.schoolSettingRepository.create({
         name: 'New School', address: '', phone: '', email: '', schoolCode: 'SCH', gradingSystem: GradingSystem.Traditional
       });
       await this.schoolSettingRepository.save(setting);
    }
    const updatedSetting = this.schoolSettingRepository.merge(setting, data);
    return this.schoolSettingRepository.save(updatedSetting);
  }
  
  async getDarajaSettings(): Promise<DarajaSetting> {
    try {
        const setting = await this.darajaSettingRepository.findOne({ where: {} });
        if (!setting) {
           return { id: 0, consumerKey: '', consumerSecret: '', shortCode: '', passkey: '', paybillNumber: '' } as DarajaSetting;
        }
        return setting;
    } catch (error) {
         this.logger.warn('Failed to fetch Daraja settings', error);
         return { id: 0, consumerKey: '', consumerSecret: '', shortCode: '', passkey: '', paybillNumber: '' } as DarajaSetting;
    }
  }

  async updateDarajaSettings(data: UpdateDarajaSettingsDto): Promise<DarajaSetting> {
    let setting = await this.darajaSettingRepository.findOne({ where: {} });
     if (!setting) {
        setting = this.darajaSettingRepository.create({});
        await this.darajaSettingRepository.save(setting);
    }
    const updatedSetting = this.darajaSettingRepository.merge(setting, data);
    return this.darajaSettingRepository.save(updatedSetting);
  }
}