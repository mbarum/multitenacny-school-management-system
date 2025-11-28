
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from '../entities/announcement.entity';
import { CommunicationLog } from '../entities/communication-log.entity';
import { GetCommunicationLogsDto } from './dto/get-logs.dto';

@Injectable()
export class CommunicationsService {
    constructor(
        @InjectRepository(Announcement) private readonly announcementRepo: Repository<Announcement>,
        @InjectRepository(CommunicationLog) private readonly logRepo: Repository<CommunicationLog>,
    ) {}

    createAnnouncement(data: Omit<Announcement, 'id' | 'sentBy'>, schoolId: string): Promise<Announcement> {
        const announcement = this.announcementRepo.create({ ...data, school: { id: schoolId } as any });
        return this.announcementRepo.save(announcement);
    }

    async findAllAnnouncements(schoolId: string): Promise<any[]> {
        const announcements = await this.announcementRepo.find({ 
            where: { schoolId: schoolId as any },
            relations: ['sentBy'], 
            order: { date: 'DESC'} 
        });
        return announcements.map(ann => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { sentBy, ...rest } = ann;
            return {
                ...rest,
                sentBy: sentBy ? sentBy.name : 'System',
            };
        });
    }

    async updateAnnouncement(id: string, data: Partial<Announcement>, schoolId: string): Promise<Announcement> {
        const announcement = await this.announcementRepo.findOne({ where: { id, schoolId: schoolId as any } });
        if (!announcement) throw new NotFoundException('Announcement not found');
        Object.assign(announcement, data);
        return this.announcementRepo.save(announcement);
    }

    async deleteAnnouncement(id: string, schoolId: string): Promise<void> {
        const result = await this.announcementRepo.delete({ id, schoolId: schoolId as any });
        if (result.affected === 0) throw new NotFoundException('Announcement not found');
    }

    createLog(data: Omit<CommunicationLog, 'id' | 'sentBy'>): Promise<CommunicationLog> {
        // Log is linked to student, so implicitly linked to school
        const log = this.logRepo.create(data);
        return this.logRepo.save(log);
    }

    createLogs(data: Omit<CommunicationLog, 'id' | 'sentBy'>[]): Promise<CommunicationLog[]> {
        const logs = this.logRepo.create(data);
        return this.logRepo.save(logs);
    }

    async findAllLogs(query: GetCommunicationLogsDto, schoolId: string): Promise<any> {
        const { page = 1, limit = 10, studentId, type } = query;
        const qb = this.logRepo.createQueryBuilder('log');
        qb.leftJoinAndSelect('log.sentBy', 'sentBy');
        qb.leftJoinAndSelect('log.student', 'student');
        
        // Multi-tenancy filter via student
        qb.where('student.schoolId = :schoolId', { schoolId });

        if (studentId) {
            qb.andWhere('log.studentId = :studentId', { studentId });
        }

        if (type) {
            qb.andWhere('log.type = :type', { type });
        }

        qb.orderBy('log.date', 'DESC');

        const skip = (page - 1) * limit;
        qb.skip(skip).take(limit);

        const [logs, total] = await qb.getManyAndCount();

        const data = logs.map(log => ({
            ...log,
            sentBy: log.sentBy ? log.sentBy.name : 'System',
            studentName: log.student ? log.student.name : 'Unknown',
        }));

        return {
            data,
            total,
            page,
            limit,
            last_page: Math.ceil(total / limit),
        };
    }
}
