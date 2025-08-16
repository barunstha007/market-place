import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';
import { CommonResponse } from 'src/common/helpers/common-response';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { LoginThrottlerGuard } from 'src/common/guards/rate-limit.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createAuthDto: CreateAuthDto) {
    const user = await this.authService.register(createAuthDto);
    return new CommonResponse(
      HttpStatus.OK,
      'User Registered Successfully.',
      user,
    );
  }
  @Post('login')
  @UseGuards(ThrottlerGuard)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(loginDto, res);
    return new CommonResponse(
      HttpStatus.OK,
      'User logged in successfully.',
      tokens,
    );
  }

  @Post('refresh')
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies['refreshToken'];
    const newAccessToken = await this.authService.refresh(refreshToken);
    return new CommonResponse(
      HttpStatus.OK,
      'Access token generated successfully.',
      { accessToken: newAccessToken },
    );
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) throw new BadRequestException('No active session found');

    await this.authService.logout(refreshToken, res);
    return new CommonResponse(HttpStatus.OK, 'Logged out successfully');
  }
}
