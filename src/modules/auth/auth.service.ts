import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { EmailService } from 'src/shared/email.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserRole } from 'src/common/user-role.enum';

import { RegisterSchoolDto } from './dto/register-school.dto';
import { TenantsService } from '../tenants/tenants.service';
import { SubscriptionPlan } from 'src/common/subscription.enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = (await this.usersService.findByUsername(username)) as any;
    if (user && (await bcrypt.compare(pass, user.password_hash))) {
      const result = { ...user };
      delete result.password_hash;
      return result;
    }
    return null;
  }

  login(user: User) {
    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByUsername(email);
    if (!user) {
      // Don't reveal that the user doesn't exist
      return;
    }

    const token = uuidv4();
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await this.usersService.setPasswordResetToken(user.id, token, expires);
    await this.emailService.sendPasswordResetEmail(user.username, token);
  }

  async resetPassword(token: string, password: string): Promise<User | null> {
    const user = await this.usersService.findOneByPasswordResetToken(token);

    if (!user || user.password_reset_expires < new Date()) {
      throw new Error('Password reset token is invalid or has expired.');
    }

    return this.usersService.resetPassword(user.id, password);
  }

  async register(userDto: CreateUserDto): Promise<any> {
    // Security: Force a default role to prevent privilege escalation
    // Even if the user provides a role in the DTO, it will be overridden here.
    const userWithDefaultRole = {
      ...userDto,
      role: UserRole.PARENT, // Default to least privilege
    };

    const user = (await this.usersService.create(userWithDefaultRole)) as any;

    // Security: Explicitly strip sensitive data from the response
    const result = { ...user };
    delete result.password_hash;
    return result;
  }

  async registerSchool(dto: RegisterSchoolDto): Promise<any> {
    // 1. Create Tenant
    const tenant = await this.tenantsService.create({
      name: dto.schoolName,
      domain: dto.domain,
      plan: (dto.plan as SubscriptionPlan) || SubscriptionPlan.FREE,
    });

    // 2. Create Admin User for this tenant
    // We need to bypass the normal tenancy check during registration
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(dto.adminPassword, salt);

    const adminUser = await this.usersService.createRaw({
      username: dto.adminEmail,
      password_hash,
      role: UserRole.ADMIN,
      tenantId: tenant.id,
    });

    // 3. Login the user automatically
    return this.login(adminUser);
  }
}
