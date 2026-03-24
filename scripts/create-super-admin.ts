import { DataSource } from 'typeorm';
import { User } from '../src/modules/users/entities/user.entity';
import { Tenant } from '../src/modules/tenants/entities/tenant.entity';
import { UserRole } from '../src/common/user-role.enum';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

config();

async function createSuperAdmin() {
  const dbHost = process.env.DB_HOST;
  if (!dbHost || dbHost === 'your_production_database_host') {
    throw new Error('CRITICAL: Database host (DB_HOST) is not configured. Please set your MySQL credentials in the environment variables.');
  }

  const dataSource = new DataSource({
    type: 'mysql',
    host: dbHost,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [User, Tenant],
    synchronize: process.env.NODE_ENV !== 'production',
  });

  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);
  const tenantRepository = dataSource.getRepository(Tenant);

  // Ensure a System tenant exists for the Super Admin
  let systemTenant = await tenantRepository.findOne({ where: { name: 'System' } });
  if (!systemTenant) {
    systemTenant = tenantRepository.create({
      name: 'System',
      domain: 'system.saaslink.tech',
    });
    await tenantRepository.save(systemTenant);
    console.log('System tenant created');
  }

  const username = 'systems@saaslink.tech';
  const password = 'revolution2026';

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  let superAdmin = await userRepository.findOne({ where: { username } });
  if (!superAdmin) {
    superAdmin = userRepository.create({
      username,
      password_hash: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      tenantId: systemTenant.id,
    });
    await userRepository.save(superAdmin);
    console.log('Super admin created successfully');
  } else {
    console.log('Super admin already exists');
  }

  await dataSource.destroy();
}

createSuperAdmin();
