
import { Injectable, UnauthorizedException, ConflictException, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { School } from '../entities/school.entity';
import { User, Role } from '../entities/user.entity';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../entities/subscription.entity';
import { PlatformSetting } from '../entities/platform-setting.entity';
import { CommunicationsService } from '../communications/communications.service';
import Stripe from 'stripe';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');
  private stripe: Stripe | undefined;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private communicationsService: CommunicationsService,
    @InjectRepository(School) private schoolRepo: Repository<School>,
    @InjectRepository(PlatformSetting) private platformSettingRepo: Repository<PlatformSetting>,
    private entityManager: EntityManager
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey) {
        this.stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    }
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(email: string, pass: string) {
    this.logger.log(`Attempting login for: ${email}`);
    const user = await this.validateUser(email, pass);
    
    if (!user) {
        this.logger.warn(`Login failed: Invalid credentials for ${email}`);
        throw new UnauthorizedException('Invalid credentials');
    }
    
    if (user.status === 'Disabled') {
        this.logger.warn(`Login failed: Account disabled for ${email}`);
        throw new UnauthorizedException('Account is disabled');
    }

    // We no longer block PENDING_APPROVAL status here. 
    // This allows /api/auth/me to work so the frontend knows the user is logged in but pending.
    const payload = { email: user.email, sub: user.id, role: user.role, schoolId: user.schoolId };
    return { user, token: this.jwtService.sign(payload) };
  }

  async registerSchool(dto: any) {
    const { paymentMethod, paymentIntentId, invoiceNumber, ...baseDto } = dto;
    
    this.logger.log(`📥 INCOMING REGISTRATION: ${baseDto.schoolName} (${paymentMethod})`);

    const existingUser = await this.usersService.findOneByEmail(baseDto.adminEmail);
    if (existingUser) {
        this.logger.error(`Registration failed: Email ${baseDto.adminEmail} already exists.`);
        throw new ConflictException('A user with this email address is already registered.');
    }

    try {
        const result = await this.entityManager.transaction(async manager => {
            // 1. Create School
            const school = manager.create(School, {
                name: baseDto.schoolName,
                slug: baseDto.schoolName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4),
                email: baseDto.adminEmail,
                phone: baseDto.phone,
                currency: baseDto.currency || 'KES',
            });
            const savedSchool = await manager.save(school);

            // 2. Determine Subscription Status & Dates
            const isManual = (paymentMethod === 'WIRE' && baseDto.plan !== SubscriptionPlan.FREE);
            const status = isManual ? SubscriptionStatus.PENDING_APPROVAL : SubscriptionStatus.ACTIVE;

            const startDate = new Date();
            const endDate = new Date();
            
            if (baseDto.plan === SubscriptionPlan.FREE) {
                endDate.setFullYear(endDate.getFullYear() + 10);
            } else if (isManual) {
                // Grant a 7-day grace period for bank verification so they aren't locked out of 'me' endpoint
                endDate.setDate(endDate.getDate() + 7);
            } else {
                endDate.setDate(endDate.getDate() + (baseDto.billingCycle === 'ANNUALLY' ? 365 : 30));
            }

            // 3. Create Subscription
            const subscription = manager.create(Subscription, {
                school: savedSchool,
                plan: baseDto.plan || SubscriptionPlan.FREE,
                status,
                invoiceNumber: isManual ? invoiceNumber : undefined,
                startDate,
                endDate
            });
            await manager.save(subscription);

            // 4. Create Admin User
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash(baseDto.password, salt);
            
            const user = manager.create(User, {
                name: baseDto.adminName,
                email: baseDto.adminEmail,
                password: hashedPassword,
                role: Role.Admin,
                school: savedSchool,
                status: 'Active',
                avatarUrl: `https://i.pravatar.cc/150?u=${baseDto.adminEmail}`
            });
            const savedUser = await manager.save(user);
            
            this.logger.log(`✅ SUCCESS: School ${savedSchool.name} registered (ID: ${savedSchool.id})`);

            // 5. Notifications (Async)
            this.communicationsService.sendEmail(
                savedUser.email, 
                isManual ? 'Application Received - Verification Pending' : 'Account Active - Welcome to Saaslink', 
                `<h1>Welcome ${savedUser.name}!</h1><p>Your portal for ${savedSchool.name} is ${isManual ? 'awaiting wire verification.' : 'now live.'}</p>`
            ).catch(e => this.logger.error(`Notification failed: ${e.message}`));

            const payload = { email: savedUser.email, sub: savedUser.id, role: savedUser.role, schoolId: savedSchool.id };
            const token = this.jwtService.sign(payload);
            
            return { 
                user: savedUser, 
                token, 
                school: savedSchool, 
                status: isManual ? 'PENDING' : 'ACTIVE' 
            };
        });

        return result;
    } catch (error: any) {
        this.logger.error(`❌ REGISTRATION ATOMIC FAILURE: ${error.message}`, error.stack);
        if (error instanceof ConflictException || error instanceof BadRequestException) throw error;
        throw new InternalServerErrorException('A system error occurred during registration. Please check if your database is running.');
    }
  }

  async createPaymentIntent(plan: string, billingCycle: string, email: string) {
      if (!this.stripe) throw new InternalServerErrorException('Stripe is not configured.');
      let pricing = await this.platformSettingRepo.findOne({ where: {} });
      if (!pricing) pricing = { basicMonthlyPrice: 3000, basicAnnualPrice: 30000, premiumMonthlyPrice: 5000, premiumAnnualPrice: 50000 } as PlatformSetting;

      let baseAmount = 0;
      if (plan === SubscriptionPlan.BASIC) baseAmount = billingCycle === 'MONTHLY' ? pricing.basicMonthlyPrice : pricing.basicAnnualPrice;
      else if (plan === SubscriptionPlan.PREMIUM) baseAmount = billingCycle === 'MONTHLY' ? pricing.premiumMonthlyPrice : pricing.premiumAnnualPrice;

      const totalAmount = baseAmount * 1.16;

      const intent = await this.stripe.paymentIntents.create({
          amount: Math.round(totalAmount * 100),
          currency: 'kes',
          receipt_email: email,
          metadata: { plan, billingCycle, vatRate: '16%' }
      });
      return { clientSecret: intent.client_secret, amount: totalAmount };
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) return { success: true, message: 'Link sent if account exists.' };

    const token = this.jwtService.sign({ sub: user.id, purpose: 'reset_password' }, { expiresIn: '15m' });
    const resetLink = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

    try {
        await this.communicationsService.sendEmail(
            user.email,
            'Password Reset Request - Saaslink',
            `<p>Reset link: <a href="${resetLink}">Reset Password</a></p>`
        );
    } catch (e: any) { 
        this.logger.error(`Could not queue reset email: ${e.message}`);
    }

    return { success: true, message: 'Reset link sent.' };
  }
}
