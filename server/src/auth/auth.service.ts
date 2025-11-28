
import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { School } from '../entities/school.entity';
import { User, Role } from '../entities/user.entity';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../entities/subscription.entity';
import { RegisterSchoolDto } from './dto/register-school.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(School) private schoolRepo: Repository<School>,
    private entityManager: EntityManager
  ) {
    this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST'),
        port: this.configService.get<number>('SMTP_PORT', 587),
        secure: this.configService.get<string>('SMTP_SECURE') === 'true',
        auth: {
            user: this.configService.get<string>('SMTP_USER'),
            pass: this.configService.get<string>('SMTP_PASS'),
        },
    });
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(email: string, pass: string) {
    const user = await this.validateUser(email, pass);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    if (user.status === 'Disabled') {
        throw new UnauthorizedException('Account is disabled');
    }

    // Check Subscription Status (Optional: Block login if subscription expired)
    // For now, we allow login but UI might be restricted.

    const payload = { email: user.email, sub: user.id, role: user.role, schoolId: user.schoolId };
    return {
      user,
      token: this.jwtService.sign(payload),
    };
  }

  async registerSchool(dto: RegisterSchoolDto) {
    // 1. Check if email exists
    const existingUser = await this.usersService.findOneByEmail(dto.adminEmail);
    if (existingUser) throw new ConflictException('User with this email already exists.');

    return this.entityManager.transaction(async manager => {
        // 2. Create School
        const school = manager.create(School, {
            name: dto.schoolName,
            slug: dto.schoolName.toLowerCase().replace(/ /g, '-') + '-' + Date.now().toString().slice(-4), // Simple slug gen
            email: dto.adminEmail,
            phone: dto.phone,
        });
        const savedSchool = await manager.save(school);

        // 3. Create Subscription (Trial)
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 14); // 14 Day Trial

        const sub = manager.create(Subscription, {
            school: savedSchool,
            plan: SubscriptionPlan.FREE,
            status: SubscriptionStatus.TRIAL,
            startDate,
            endDate
        });
        await manager.save(sub);

        // 4. Create Admin User
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(dto.password, salt);
        
        const user = manager.create(User, {
            name: dto.adminName,
            email: dto.adminEmail,
            password: hashedPassword,
            role: Role.Admin,
            school: savedSchool,
            status: 'Active',
            avatarUrl: `https://i.pravatar.cc/150?u=${dto.adminEmail}`
        });
        const savedUser = await manager.save(user);

        // Generate Token
        const payload = { email: savedUser.email, sub: savedUser.id, role: savedUser.role, schoolId: savedSchool.id };
        
        return {
            user: { ...savedUser, schoolId: savedSchool.id },
            token: this.jwtService.sign(payload),
            school: savedSchool
        };
    });
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findOneByEmail(email);
    
    if (!user) {
        return { success: true, message: 'If an account with this email exists, a reset link has been sent.' };
    }

    const resetToken = this.jwtService.sign({ sub: user.id, purpose: 'reset_password' }, { expiresIn: '15m' });
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM', '"Saaslink Support" <no-reply@saaslink.com>'),
        to: email,
        subject: 'Password Reset Request - Saaslink',
        html: `
            <h3>Password Reset Request</h3>
            <p>Hello ${user.name},</p>
            <p>Click the link below to reset your password:</p>
            <p><a href="${resetLink}">Reset Password</a></p>
            <p>Link expires in 15 minutes.</p>
        `,
    };

    try {
        await this.transporter.sendMail(mailOptions);
    } catch (error) {
        this.logger.error(`Failed to send email to ${email}`, error);
    }

    return {
        success: true,
        message: 'If an account with this email exists, a reset link has been sent.'
    };
  }
}
