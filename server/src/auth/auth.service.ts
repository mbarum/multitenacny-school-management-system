
import { Injectable, UnauthorizedException, NotFoundException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
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

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      user,
      token: this.jwtService.sign(payload),
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findOneByEmail(email);
    
    // We behave as if success to prevent user enumeration
    if (!user) {
        return { success: true, message: 'If an account with this email exists, a reset link has been sent.' };
    }

    // Generate a temporary token (valid for 15 mins)
    const resetToken = this.jwtService.sign({ sub: user.id, purpose: 'reset_password' }, { expiresIn: '15m' });
    
    // Use the FRONTEND_URL env var, fallback to localhost if not set
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM', '"Saaslink Support" <no-reply@saaslink.com>'),
        to: email,
        subject: 'Password Reset Request - Saaslink',
        html: `
            <h3>Password Reset Request</h3>
            <p>Hello ${user.name},</p>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <p><a href="${resetLink}">Reset Password</a></p>
            <p>If you did not request this, please ignore this email.</p>
            <p>This link expires in 15 minutes.</p>
        `,
    };

    try {
        await this.transporter.sendMail(mailOptions);
        this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
        this.logger.error(`Failed to send email to ${email}`, error);
        // We still return success to the frontend to not expose failure details
    }

    return {
        success: true,
        message: 'If an account with this email exists, a reset link has been sent.'
    };
  }
}
