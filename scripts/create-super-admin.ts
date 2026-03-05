import { DataSource } from 'typeorm';
import { User } from '../src/modules/users/entities/user.entity';
import { UserRole } from '../src/common/user-role.enum';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

config();

async function createSuperAdmin() {
  const dbHost = process.env.DB_HOST;
  const useSqlite = !dbHost || dbHost === 'your_production_database_host';

  const dataSource = new DataSource(
    useSqlite
      ? {
          type: 'sqlite',
          database: 'database.sqlite',
          entities: [User],
          synchronize: true,
        }
      : {
          type: 'mysql',
          host: dbHost,
          port: parseInt(process.env.DB_PORT || '3306', 10),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
          entities: [User],
          synchronize: false,
        },
  );

  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);

  const username = 'systems@saaslink.tech';
  const password = 'revolution2026';

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  const superAdmin = userRepository.create({
    username,
    password_hash: hashedPassword, // Corrected field name
    role: UserRole.SUPER_ADMIN,
  });

  await userRepository.save(superAdmin);

  console.log('Super admin created successfully');
  await dataSource.destroy();
}

createSuperAdmin();
