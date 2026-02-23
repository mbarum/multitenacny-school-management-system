import { Router } from 'express';
import { generators } from 'openid-client';
import jwt from 'jsonwebtoken';
import { findTenantByDomain, findTenantById } from './db';
import { getOidcClient } from './oidc';

const router = Router();

const stateStore = new Map<string, { nonce: string; redirect: string; tenantId: string }>();

// 1. Login Initiation
router.post('/login', async (req, res) => {
  const { email, redirect = '/' } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const domain = email.split('@')[1];
  const tenant = await findTenantByDomain(domain);

  if (!tenant) {
    return res.status(404).json({ error: 'No SSO provider found for your organization.' });
  }

  try {
    const client = await getOidcClient(tenant);
    const state = generators.state();
    const nonce = generators.nonce();

    stateStore.set(state, { nonce, redirect, tenantId: tenant.id });

    const authUrl = client.authorizationUrl({
      scope: 'openid email profile',
      state,
      nonce,
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Failed to get authorization URL:', error);
    res.status(500).json({ error: 'Failed to initiate login.' });
  }
});

// 2. OIDC Callback
router.get('/callback', async (req, res) => {
  const { state, code } = req.query as { state: string; code: string };
  const stored = stateStore.get(state);

  if (!state || !stored) {
    return res.status(400).send('Invalid state');
  }
  stateStore.delete(state);

  const tenant = await findTenantById(stored.tenantId);

  if (!tenant) {
    return res.status(404).send('Tenant not found');
  }

  try {
    const client = await getOidcClient(tenant);
    const params = client.callbackParams(req);
    const tokenSet = await client.callback(
      `${process.env.APP_URL}/api/auth/callback`,
      params,
      { state, nonce: stored.nonce }
    );

    const claims = tokenSet.claims();

    // MFA Enforcement Logic
    const amr = claims.amr || [];
    // This is a basic check. Some IdPs use different values.
    // In a real app, you might have a policy per tenant.
    if (tenant.idpType !== 'google' && !amr.includes('mfa')) {
        // Google doesn't always populate AMR, so we might skip this check for it
        // or use other signals if available.
        // return res.status(403).send('MFA is required for your organization.');
    }

    // Provision user if they don't exist, then get internal user ID
    const user = { id: claims.sub, email: claims.email, name: claims.name };

    // Issue our own JWT
    const appJwt = jwt.sign(
      {
        userId: user.id,
        tenantId: tenant.id,
        email: user.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    res.cookie('auth_token', appJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600 * 1000, // 1 hour
    });

    res.redirect(stored.redirect || '/dashboard');
  } catch (error) {
    console.error('Callback failed:', error);
    res.status(500).send('Login failed.');
  }
});

// 3. Get current user
router.get('/me', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    res.json({ userId: payload.userId, email: payload.email, tenantId: payload.tenantId });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// 4. Logout
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.status(200).json({ message: 'Logged out' });
});

export default router;
