
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password || 'password123', salt);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      avatarUrl: `https://i.pravatar.cc/150?u=${createUserDto.email}`,
      status: 'Active',
    });
    
    await this.usersRepository.save(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result as User;
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'name', 'email', 'role', 'avatarUrl', 'status'] // Exclude password
    });
  }
  
  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .getOne();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result as User;
  }

  // Safer method for Auth Strategy that returns null instead of throwing
  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.preload({
        id: id,
        ...updateUserDto,
    });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    if (updateUserDto.password) {
        const salt = await bcrypt.genSalt();
        user.password = await bcrypt.hash(updateUserDto.password, salt);
    }
    await this.usersRepository.save(user);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
  }
}
