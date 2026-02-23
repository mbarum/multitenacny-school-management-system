import { Issuer, Client } from 'openid-client';
import { Tenant } from './db';

const clients = new Map<string, Client>();

async function discoverIssuer(url: string): Promise<Issuer<Client>> {
  return Issuer.discover(url);
}

export async function getOidcClient(tenant: Tenant): Promise<Client> {
  let issuerUrl = '';
  switch (tenant.idpType) {
    case 'google':
      issuerUrl = 'https://accounts.google.com';
      break;
    case 'azure':
      issuerUrl = `https://login.microsoftonline.com/${tenant.config.tenantId}/v2.0`;
      break;
    case 'okta':
      issuerUrl = tenant.config.issuer!;
      break;
    default:
      throw new Error('Invalid IdP type');
  }

  if (clients.has(issuerUrl)) {
    return clients.get(issuerUrl)!;
  }

  const issuer = await discoverIssuer(issuerUrl);
  const client = new issuer.Client({
    client_id: tenant.config.clientId,
    client_secret: tenant.config.clientSecret,
    redirect_uris: [`${process.env.APP_URL}/api/auth/callback`],
    response_types: ['code'],
  });

  clients.set(issuerUrl, client);
  return client;
}
