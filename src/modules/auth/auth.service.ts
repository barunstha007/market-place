import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UserRepository } from 'src/database/repositories/user.repository';
import { LoginDto } from './dto/login.dto';
import { RedisService } from 'src/redis/redis.service';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly userRepository: UserRepository,
  ) {}

  async register(createAuthDto: CreateAuthDto) {
    const { email, password, firstName, lastName, role } = createAuthDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) throw new BadRequestException('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
    });

    if (!user) throw new BadRequestException('User not created');
    return user;
  }

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.validateUser(dto.email, dto.password);
    const tokens = this.generateTokens(user.id, user.email, user.role);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // or 'none' if using cross-site cookies
      maxAge: 15 * 60 * 1000,
    });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return tokens;
  }

  async refresh(refreshToken: string) {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.redisService.exists(refreshToken);
      if (isBlacklisted) throw new UnauthorizedException('Token invalidated');

      const payload: any = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const newAccessToken = this.jwtService.sign(
        { sub: payload.sub, email: payload.email, role: payload.role },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: this.configService.get('JWT_ACCESS_TTL'),
        },
      );

      return newAccessToken;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token', error.message);
    }
  }

  async logout(refreshToken: string, res: Response) {
    try {
      const decoded: any = this.jwtService.decode(refreshToken);
      if (!decoded?.exp) throw new BadRequestException('Invalid token');

      const now = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - now;

      if (ttl > 0) {
        await this.redisService.add(refreshToken, ttl);
      }

      // Clear cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });
      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new BadRequestException('Failed to logout', error.message);
    }
  }

  private generateTokens(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_TTL'),
    });

    return { accessToken, refreshToken };
  }
}
