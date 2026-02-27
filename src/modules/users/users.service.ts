import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { TenancyService } from 'src/core/tenancy/tenancy.service';
import { TenantAwareCrudService } from 'src/core/common/tenant-aware-crud.service';

@Injectable()
export class UsersService extends TenantAwareCrudService<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    tenancyService: TenancyService,
  ) {
    super(userRepository, tenancyService);
  }

  async create(userDto: Partial<User>): Promise<User> {
    if (!userDto.password_hash) {
      throw new Error('Password is required to create a user.');
    }
    const salt = await bcrypt.genSalt();
    const password_hash = await bcrypt.hash(userDto.password_hash, salt);

    const newUser = this.userRepository.create({
      ...userDto,
      password_hash,
      tenantId: this.tenancyService.getTenantId(),
    });

    return this.userRepository.save(newUser as any);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      where: { tenantId: this.tenancyService.getTenantId() },
    });
  }

  async update(id: string, userDto: Partial<User>): Promise<User> {
    await this.userRepository.update(id, userDto);
    const updatedUser = await this.userRepository.findOne({ where: { id } });
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { 
        username, 
        tenantId: this.tenancyService.getTenantId() 
      },
    });
  }

  async setPasswordResetToken(id: string, token: string, expires: Date): Promise<void> {
    await this.userRepository.update(id, { password_reset_token: token, password_reset_expires: expires });
  }

  async findOneByPasswordResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { password_reset_token: token } });
  }

  async resetPassword(id: string, password: string): Promise<User | null> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    await this.userRepository.update(id, {
      password_hash: hashedPassword,
      password_reset_token: undefined,
      password_reset_expires: undefined,
    });
    return this.userRepository.findOne({ where: { id } });
  }
}
