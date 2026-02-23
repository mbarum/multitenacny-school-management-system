import { Controller, Get, Req, Res, Param, UseGuards } from '@nestjs/common';
import { SsoService } from './sso.service';
import { SsoProvider } from './sso-configuration.entity';
import * as passport from 'passport';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth/sso')
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  @Get(':slug/:provider')
  async ssoLogin(@Param('slug') slug: string, @Param('provider') provider: SsoProvider, @Req() req, @Res() res) {
    const strategy = await this.ssoService.getSsoStrategy(slug, provider);
    passport.use(provider, strategy);
    passport.authenticate(provider, { session: false })(req, res);
  }

  @Get('callback/:provider')
  @UseGuards(AuthGuard('openidconnect'))
  async ssoCallback(@Req() req, @Res() res) {
    // The user profile is attached to req.user by passport
    const schoolId = req.query.state; // We'll need to pass the schoolId in the state parameter
    const tokens = await this.ssoService.processSsoCallback(req.user, schoolId);
    // Redirect user with tokens
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?accessToken=${tokens.access_token}`);
  }
}
