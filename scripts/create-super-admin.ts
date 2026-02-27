import { createConnection } from 'typeorm';
import { User } from '../src/modules/users/entities/user.entity';
import { UserRole } from '../src/common/user-role.enum';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

config();

async function createSuperAdmin() {
  const connection = await createConnection({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [User],
    synchronize: false,
  });

  const userRepository = connection.getRepository(User);

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
  await connection.close();
}

createSuperAdmin();
