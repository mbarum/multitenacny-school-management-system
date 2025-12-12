
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

  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    @InjectRepository(DarajaSetting)
    private readonly darajaSettingRepository: Repository<DarajaSetting>,
    @InjectRepository(PlatformSetting)
    private readonly platformSettingRepository: Repository<PlatformSetting>,
  ) {}

  async getPublicSchoolInfo(): Promise<School> {
    const school = await this.schoolRepository.findOne({ 
        where: {}, 
        order: { createdAt: 'ASC' } 
    });
    
    if (!school) {
        return { 
            name: 'Saaslink School System', 
            logoUrl: '', 
            address: '', 
            phone: '', 
            email: '', 
            id: '', 
            slug: '', 
            schoolCode: 'SIS', 
            gradingSystem: 'Traditional' 
        } as unknown as School;
    }
    
    return {
        name: school.name,
        logoUrl: school.logoUrl,
        address: school.address,
        phone: school.phone,
        email: school.email,
        schoolCode: school.schoolCode,
        gradingSystem: school.gradingSystem
    } as School;
  }
  
  async getPlatformPricing(): Promise<PlatformSetting> {
      const setting = await this.platformSettingRepository.findOne({ where: {} });
      if (!setting) {
          // Return defaults if not initialized (though seed should handle this)
          return { 
              id: 'default', 
              basicMonthlyPrice: 3000, 
              basicAnnualPrice: 30000, 
              premiumMonthlyPrice: 5000, 
              premiumAnnualPrice: 50000 
          } as unknown as PlatformSetting;
      }
      return setting;
  }

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
  
  async getDarajaSettings(schoolId: string): Promise<DarajaSetting> {
    const setting = await this.darajaSettingRepository.findOne({ where: { schoolId: schoolId as any } });
    if (!setting) {
        // Return blank object if not set yet, preserving the structure
        return { 
            id: 'default', 
            consumerKey: '', 
            consumerSecret: '', 
            shortCode: '', 
            passkey: '', 
            paybillNumber: '', 
            schoolId 
        } as unknown as DarajaSetting;
    }
    return setting;
  }

  async updateDarajaSettings(schoolId: string, data: UpdateDarajaSettingsDto): Promise<DarajaSetting> {
    let setting = await this.darajaSettingRepository.findOne({ where: { schoolId: schoolId as any } });
    
    if (!setting) {
        setting = this.darajaSettingRepository.create({
            school: { id: schoolId } as any,
            ...data
        });
    } else {
        this.darajaSettingRepository.merge(setting, data);
    }
    
    return this.darajaSettingRepository.save(setting);
  }
}
