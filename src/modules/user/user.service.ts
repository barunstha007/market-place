import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories/user.repository';
import { Role } from 'src/common/enums/role.enum';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getCurrentProfile(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getAllAdminUsers(page: number, limit: number) {
    const [users, total] = await this.userRepository.findAndCountAll({
      where: { role: Role.ADMIN },
      skip: (page - 1) * limit,
      take: limit,
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
    return {
      data: users,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async remove(id: number) {
    const order = await this.userRepository.findOne({
      where: { id },
    });
    if (!order) throw new NotFoundException('User not found');
    await this.userRepository.delete(id);
    return { success: true };
  }
}
