
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../entities/school.entity';
import { DarajaSetting } from '../entities/daraja-setting.entity';
import { UpdateSchoolInfoDto } from './dto/update-school-info.dto';
import { UpdateDarajaSettingsDto } from './dto/update-daraja-settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    @InjectRepository(DarajaSetting)
    private readonly darajaSettingRepository: Repository<DarajaSetting>,
  ) {}

  async getSchoolInfo(schoolId: string): Promise<any> {
    const school = await this.schoolRepository.findOne({ where: { id: schoolId } });
    if (!school) {
        throw new NotFoundException('School settings not accessible.');
    }
    return school;
  }

  async updateSchoolInfo(schoolId: string, data: UpdateSchoolInfoDto): Promise<School> {
    const school = await this.schoolRepository.findOne({ where: { id: schoolId } });
    if (!school) {
       throw new NotFoundException('School not found');
    }
    const updatedSchool = this.schoolRepository.merge(school, data);
    return this.schoolRepository.save(updatedSchool);
  }
  
  // NOTE: DarajaSetting is currently global/singleton in this schema. 
  // For true multi-tenancy, Daraja credentials should move to the School entity.
  // We will assume for now we return global settings or update the entity to be school-linked later.
  // Ideally: Add schoolId to DarajaSetting.
  async getDarajaSettings(): Promise<DarajaSetting> {
    // Return mock for now or implement multi-tenant table
    const setting = await this.darajaSettingRepository.findOne({ where: {} });
    if (!setting) return { id: 0, consumerKey: '', consumerSecret: '', shortCode: '', passkey: '', paybillNumber: '' } as DarajaSetting;
    return setting;
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
