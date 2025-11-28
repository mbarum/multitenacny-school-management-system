
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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

  async create(createUserDto: CreateUserDto, schoolId: string): Promise<User> {
    const existing = await this.usersRepository.findOne({ where: { email: createUserDto.email } });
    if (existing) {
        throw new ConflictException('Email already in use');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password || 'password123', salt);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      avatarUrl: `https://i.pravatar.cc/150?u=${createUserDto.email}`,
      status: 'Active',
      school: { id: schoolId } as any
    });
    
    await this.usersRepository.save(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result as User;
  }

  findAll(schoolId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { schoolId: schoolId as any },
      select: ['id', 'name', 'email', 'role', 'avatarUrl', 'status']
    });
  }
  
  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .addSelect('user.schoolId')
      .addSelect('user.role')
      .addSelect('user.status')
      .getOne();
  }

  async findOne(id: string, schoolId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id, schoolId: schoolId as any } });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result as User;
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async update(id: string, updateUserDto: Partial<UpdateUserDto>, schoolId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id, schoolId: schoolId as any } });
    
    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    // Hash password if provided
    if (updateUserDto.password) {
        const salt = await bcrypt.genSalt();
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    } else {
        delete updateUserDto.password; // Don't overwrite with undefined
    }

    // Merge changes
    Object.assign(user, updateUserDto);
    
    await this.usersRepository.save(user);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result as User;
  }

  async remove(id: string, schoolId: string): Promise<void> {
    const result = await this.usersRepository.delete({ id, schoolId: schoolId as any });
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
  }
}
