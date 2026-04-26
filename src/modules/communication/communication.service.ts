import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Announcement } from './entities/announcement.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { TenantAwareCrudService } from 'src/core/common/tenant-aware-crud.service';

@Injectable()
export class CommunicationService extends TenantAwareCrudService<Message> {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Announcement)
    private readonly announcementRepository: Repository<Announcement>,
    tenancyService: TenancyService,
  ) {
    super(messageRepository, tenancyService);
  }

  async createAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
    const announcement = this.announcementRepository.create({
      ...data,
      tenantId: this.tenancyService.getTenantId(),
    });
    return this.announcementRepository.save(announcement);
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    return this.announcementRepository.find({
      where: { 
        tenantId: this.tenancyService.getTenantId(),
        isActive: true,
      },
      order: { createdAt: 'DESC' } as any
    });
  }
}
