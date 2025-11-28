
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Staff } from '../entities/staff.entity';
import { User, Role } from '../entities/user.entity';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { CsvUtil } from '../utils/csv.util';
import * as bcrypt from 'bcrypt';
import { Buffer } from 'buffer';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff) private readonly staffRepository: Repository<Staff>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly entityManager: EntityManager,
  ) {}

  private mapStaffToResponse(staff: Staff | null): any {
    if (!staff || !staff.user) return null;
    return {
      id: staff.id,
      userId: staff.user.id,
      name: staff.name,
      email: staff.user.email,
      role: staff.role,
      userRole: staff.user.role,
      photoUrl: staff.photoUrl,
      salary: staff.salary,
      joinDate: staff.joinDate,
      bankName: staff.bankName,
      accountNumber: staff.accountNumber,
      kraPin: staff.kraPin,
      nssfNumber: staff.nssfNumber,
      shaNumber: staff.shaNumber,
    };
  }

  async create(createStaffDto: CreateStaffDto): Promise<any> {
    const existingUser = await this.userRepository.findOne({ where: { email: createStaffDto.email } });
    if (existingUser) {
      throw new ConflictException(`User with email ${createStaffDto.email} already exists.`);
    }

    const newStaffId = await this.entityManager.transaction(async transactionalEntityManager => {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(createStaffDto.password || 'password123', salt);
      
      const user = transactionalEntityManager.create(User, {
        name: createStaffDto.name,
        email: createStaffDto.email,
        password: hashedPassword,
        role: createStaffDto.userRole,
        avatarUrl: createStaffDto.photoUrl || `https://i.pravatar.cc/150?u=${createStaffDto.email}`,
        status: 'Active',
      });
      const savedUser = await transactionalEntityManager.save(user);

      const staffMember = transactionalEntityManager.create(Staff, {
        name: createStaffDto.name,
        role: createStaffDto.role,
        salary: createStaffDto.salary,
        joinDate: createStaffDto.joinDate,
        bankName: createStaffDto.bankName,
        accountNumber: createStaffDto.accountNumber,
        kraPin: createStaffDto.kraPin,
        nssfNumber: createStaffDto.nssfNumber,
        shaNumber: createStaffDto.shaNumber,
        photoUrl: savedUser.avatarUrl,
        user: savedUser,
      });
      const savedStaff = await transactionalEntityManager.save(staffMember);
      return savedStaff.id;
    });

    // Reload to get full relations for mapping
    const reloadedStaff = await this.staffRepository.findOne({ where: { id: newStaffId }, relations: ['user'] });
    return this.mapStaffToResponse(reloadedStaff);
  }

  async findAll(): Promise<any[]> {
    const staffList = await this.staffRepository.find({ relations: ['user'] });
    return staffList.map(s => this.mapStaffToResponse(s));
  }

  async findOne(id: string): Promise<any> {
    const staff = await this.staffRepository.findOne({ where: { id }, relations: ['user'] });
    if (!staff) {
      throw new NotFoundException(`Staff member with ID "${id}" not found`);
    }
    return this.mapStaffToResponse(staff);
  }

  async update(id: string, updateStaffDto: UpdateStaffDto): Promise<any> {
    await this.entityManager.transaction(async transactionalEntityManager => {
      const staffRepo = transactionalEntityManager.getRepository(Staff);
      const userRepo = transactionalEntityManager.getRepository(User);
      
      const staffMember = await staffRepo.findOne({ where: { id }, relations: ['user'] });
      if (!staffMember) {
        throw new NotFoundException(`Staff with ID "${id}" not found`);
      }

      if (staffMember.user) {
        const user = staffMember.user;
        if (updateStaffDto.name) user.name = updateStaffDto.name;
        if (updateStaffDto.email) user.email = updateStaffDto.email;
        if (updateStaffDto.userRole) user.role = updateStaffDto.userRole;
        if (updateStaffDto.photoUrl) user.avatarUrl = updateStaffDto.photoUrl;
        await userRepo.save(user);
      }

      // Update staff fields
      staffMember.name = updateStaffDto.name ?? staffMember.name;
      staffMember.role = updateStaffDto.role ?? staffMember.role;
      staffMember.salary = updateStaffDto.salary ?? staffMember.salary;
      staffMember.joinDate = updateStaffDto.joinDate ?? staffMember.joinDate;
      staffMember.bankName = updateStaffDto.bankName ?? staffMember.bankName;
      staffMember.accountNumber = updateStaffDto.accountNumber ?? staffMember.accountNumber;
      staffMember.kraPin = updateStaffDto.kraPin ?? staffMember.kraPin;
      staffMember.nssfNumber = updateStaffDto.nssfNumber ?? staffMember.nssfNumber;
      staffMember.shaNumber = updateStaffDto.shaNumber ?? staffMember.shaNumber;
      staffMember.photoUrl = updateStaffDto.photoUrl ?? staffMember.photoUrl;

      await staffRepo.save(staffMember);
    });

    const reloadedStaff = await this.staffRepository.findOne({ where: { id }, relations: ['user'] });
    return this.mapStaffToResponse(reloadedStaff!);
  }

  async remove(id: string): Promise<void> {
    const staff = await this.staffRepository.findOne({ where: { id } });
    if (!staff) {
      throw new NotFoundException(`Staff member with ID "${id}" not found`);
    }

    // By deleting the user, the staff profile will be cascade-deleted
    // due to the `onDelete: 'CASCADE'` on the Staff entity's user relation.
    await this.userRepository.delete(staff.userId);
  }

  async exportStaff(): Promise<string> {
    const staffList = await this.staffRepository.find({ relations: ['user'] });
    const data = staffList.map(s => ({
      Name: s.name,
      Email: s.user.email,
      Role: s.role,
      UserRole: s.user.role,
      Salary: s.salary,
      JoinDate: s.joinDate,
      KRA: s.kraPin,
    }));
    return CsvUtil.generate(data, ['Name', 'Email', 'Role', 'UserRole', 'Salary', 'JoinDate', 'KRA']);
  }

  async importStaff(buffer: Buffer): Promise<{ imported: number; failed: number; errors: any[] }> {
    const records = await CsvUtil.parse(buffer);
    let imported = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const record of records) {
      try {
        const dto: CreateStaffDto = {
          name: record.name || 'Unknown',
          email: record.email || `staff${Date.now()}@example.com`,
          password: record.password || 'password123',
          userRole: (record.userRole as Role) || Role.Teacher,
          role: record.role || 'Staff',
          salary: Number(record.salary) || 0,
          joinDate: record.joinDate || new Date().toISOString().split('T')[0],
          bankName: record.bankName || '',
          accountNumber: record.accountNumber || '',
          kraPin: record.kraPin || '',
          nssfNumber: record.nssfNumber || '',
          shaNumber: record.shaNumber || '',
          photoUrl: ''
        };
        
        await this.create(dto);
        imported++;
      } catch (err) {
        failed++;
        errors.push({ record, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    return { imported, failed, errors };
  }
}
