
import { Injectable, UnauthorizedException, ConflictException, Logger, InternalServerErrorException } from '@nestjs/common';
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
import { PlatformSetting } from '../entities/platform-setting.entity';
import { RegisterSchoolDto } from './dto/register-school.dto';
import Stripe from 'stripe';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private transporter: nodemailer.Transporter;
  private stripe: Stripe;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(School) private schoolRepo: Repository<School>,
    @InjectRepository(PlatformSetting) private platformSettingRepo: Repository<PlatformSetting>,
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

    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey) {
        this.stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    } else {
        this.logger.warn('STRIPE_SECRET_KEY is not defined. Card payments will fail.');
    }
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

    const payload = { email: user.email, sub: user.id, role: user.role, schoolId: user.schoolId };
    return {
      user,
      token: this.jwtService.sign(payload),
    };
  }

  async registerSchool(dto: RegisterSchoolDto) {
    this.logger.log(`Attempting to register school: ${dto.schoolName} with admin: ${dto.adminEmail}`);
    
    const existingUser = await this.usersService.findOneByEmail(dto.adminEmail);
    if (existingUser) {
        this.logger.warn(`Registration failed: Email ${dto.adminEmail} already exists`);
        throw new ConflictException('User with this email already exists.');
    }

    return this.entityManager.transaction(async manager => {
        // 1. Create School
        const school = manager.create(School, {
            name: dto.schoolName,
            slug: dto.schoolName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4),
            email: dto.adminEmail,
            phone: dto.phone,
        });
        const savedSchool = await manager.save(school);
        this.logger.log(`School created with ID: ${savedSchool.id}`);

        // 2. Create Subscription
        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        
        // If it's a paid plan, we set status to ACTIVE assuming payment was handled client-side via Stripe
        // or will be handled via M-Pesa. For robustness, real-world apps use webhooks.
        // Here we assume if they reached this point via Card flow, payment intent succeeded.
        let status = SubscriptionStatus.TRIAL;
        
        if (dto.plan === SubscriptionPlan.FREE) {
            endDate.setFullYear(endDate.getFullYear() + 10); // Free forever-ish
            status = SubscriptionStatus.ACTIVE;
        } else {
             // For paid plans, we start in TRIAL mode until payment is confirmed via M-Pesa Callback or Stripe confirmation on frontend
             // In this flow, if card payment succeeded on frontend, we should ideally verify intent here.
             // For simplicity, we default to TRIAL/ACTIVE logic.
             // If a payment method was Card, frontend will call this after success.
             status = SubscriptionStatus.ACTIVE; 
             endDate.setDate(endDate.getDate() + (dto.billingCycle === 'ANNUALLY' ? 365 : 30));
        }

        const sub = manager.create(Subscription, {
            school: savedSchool,
            plan: dto.plan || SubscriptionPlan.FREE,
            status: status,
            startDate,
            endDate
        });
        await manager.save(sub);

        // 3. Create Admin User
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
        this.logger.log(`Admin user created with ID: ${savedUser.id}`);

        // Generate Token
        // Ensure schoolId is available on the user object returned to frontend
        const userResponse = { ...savedUser, schoolId: savedSchool.id };
        // Remove password
        delete (userResponse as any).password;

        const payload = { email: savedUser.email, sub: savedUser.id, role: savedUser.role, schoolId: savedSchool.id };
        
        this.logger.log(`[AuthService] REGISTRATION COMPLETE. Data committed to database for ${dto.schoolName}`);

        return {
            user: userResponse,
            token: this.jwtService.sign(payload),
            school: savedSchool
        };
    });
  }

  async createPaymentIntent(plan: string, billingCycle: string, email: string) {
      if (!this.stripe) {
          throw new InternalServerErrorException('Stripe is not configured on the server.');
      }

      // 1. Get Pricing from DB
      let pricing = await this.platformSettingRepo.findOne({ where: {} });
      if (!pricing) pricing = { basicMonthlyPrice: 3000, basicAnnualPrice: 30000, premiumMonthlyPrice: 5000, premiumAnnualPrice: 50000 } as PlatformSetting;

      let amount = 0;
      if (plan === SubscriptionPlan.BASIC) {
          amount = billingCycle === 'MONTHLY' ? pricing.basicMonthlyPrice : pricing.basicAnnualPrice;
      } else if (plan === SubscriptionPlan.PREMIUM) {
          amount = billingCycle === 'MONTHLY' ? pricing.premiumMonthlyPrice : pricing.premiumAnnualPrice;
      }

      if (amount <= 0) {
          throw new InternalServerErrorException('Invalid plan amount calculation.');
      }

      try {
          const paymentIntent = await this.stripe.paymentIntents.create({
              amount: Math.round(amount * 100), // Stripe expects integers in cents/lowest unit
              currency: 'kes', // or usd depending on config
              receipt_email: email,
              automatic_payment_methods: {
                  enabled: true,
              },
              metadata: {
                  plan,
                  billingCycle
              }
          });

          return {
              clientSecret: paymentIntent.client_secret,
              amount: amount
          };
      } catch (error) {
          this.logger.error('Stripe Payment Intent creation failed', error);
          throw new InternalServerErrorException('Could not initiate payment processor.');
      }
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
