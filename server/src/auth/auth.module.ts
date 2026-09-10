
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from '../entities/school.entity';
import { User } from '../entities/user.entity';
import { Subscription } from '../entities/subscription.entity';
import { PlatformSetting } from '../entities/platform-setting.entity';
import { CommunicationsModule } from '../communications/communications.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    CommunicationsModule,
    TypeOrmModule.forFeature([School, User, Subscription, PlatformSetting]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('FATAL: JWT_SECRET is not defined in environment variables.');
        }
        return {
          secret: secret,
          signOptions: { expiresIn: '24h' },
        };
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
