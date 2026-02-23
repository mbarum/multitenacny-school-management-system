import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SsoConfiguration, SsoProvider } from './sso-configuration.entity';
import { School } from '../entities/school.entity';
import { User } from '../entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { OIDCStrategy } from 'passport-openidconnect';
import * as passport from 'passport';

@Injectable()
export class SsoService {
  constructor(
    @InjectRepository(SsoConfiguration) private ssoRepo: Repository<SsoConfiguration>,
    @InjectRepository(School) private schoolRepo: Repository<School>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private authService: AuthService,
  ) {}

  async getSsoStrategy(slug: string, provider: SsoProvider): Promise<OIDCStrategy> {
    const school = await this.schoolRepo.findOne({ where: { slug }, relations: ['ssoConfigurations'] });
    if (!school) throw new UnauthorizedException('School not found');

    const ssoConfig = school.ssoConfigurations.find(c => c.provider === provider);
    if (!ssoConfig) throw new UnauthorizedException('SSO not configured for this provider');

    return new OIDCStrategy({
      issuer: ssoConfig.issuerUrl,
      clientID: ssoConfig.clientId,
      clientSecret: ssoConfig.clientSecret,
      authorizationURL: `${ssoConfig.issuerUrl}/protocol/openid-connect/auth`,
      tokenURL: `${ssoConfig.issuerUrl}/protocol/openid-connect/token`,
      userInfoURL: `${ssoConfig.issuerUrl}/protocol/openid-connect/userinfo`,
      callbackURL: `${process.env.APP_URL}/api/auth/sso/callback/${provider}`,
      scope: 'openid profile email',
    }, (issuer, profile, done) => {
      return done(null, profile);
    });
  }

  async processSsoCallback(profile: any, schoolId: string): Promise<any> {
    const email = profile.emails[0].value;
    let user = await this.userRepo.findOne({ where: { email, schoolId } });

    if (!user) {
      user = this.userRepo.create({
        email,
        name: profile.displayName,
        school: { id: schoolId },
        // You might want to assign a default role here
      });
      await this.userRepo.save(user);
    }

    return this.authService.login(user);
  }
}
