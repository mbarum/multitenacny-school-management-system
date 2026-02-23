export interface Tenant {
  id: string;
  domain: string;
  idpType: 'google' | 'azure' | 'okta';
  config: {
    clientId: string;
    clientSecret: string;
    tenantId?: string; // For Azure AD
    issuer?: string; // For Okta
  };
}

// In a real application, this would come from a database.
const tenants: Tenant[] = [
  {
    id: 'tenant-google',
    domain: 'gmail.com', // Using a common domain for easy testing
    idpType: 'google',
    config: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  {
    id: 'tenant-azure',
    domain: 'outlook.com', // Using a common domain for easy testing
    idpType: 'azure',
    config: {
      clientId: process.env.AZURE_CLIENT_ID!,
      clientSecret: process.env.AZURE_CLIENT_SECRET!,
      tenantId: process.env.AZURE_TENANT_ID!,
    },
  },
  {
    id: 'tenant-okta',
    domain: 'okta.com', // A placeholder domain
    idpType: 'okta',
    config: {
      clientId: process.env.OKTA_CLIENT_ID!,
      clientSecret: process.env.OKTA_CLIENT_SECRET!,
      issuer: process.env.OKTA_ISSUER!,
    },
  },
];

export async function findTenantByDomain(domain: string): Promise<Tenant | null> {
  const tenant = tenants.find((t) => t.domain === domain);
  return tenant || null;
}

export async function findTenantById(id: string): Promise<Tenant | null> {
  const tenant = tenants.find((t) => t.id === id);
  return tenant || null;
}

export async function findUserById(id: string) {
  // Mock user lookup
  return { id, email: `user-${id}@example.com`, name: `User ${id}` };
}
