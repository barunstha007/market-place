import {
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CommonResponse } from 'src/common/helpers/common-response';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user fetched successfully.',
  })
  async getCurrentProfile(@Req() req) {
    const userId = req.user.id;
    const user = await this.usersService.getCurrentProfile(+userId);
    return new CommonResponse(
      HttpStatus.OK,
      'Current user fetched successfully.',
      user,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all admin users (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Admin users fetched successfully.',
  })
  async getAllAdmin(@Query('page') page = 1, @Query('limit') limit = 10) {
    const admins = await this.usersService.getAllAdminUsers(
      Number(page),
      Number(limit),
    );
    return new CommonResponse(
      HttpStatus.OK,
      'Admin users fetched successfully.',
      admins,
    );
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const user = await this.usersService.remove(+id);
    return new CommonResponse(HttpStatus.OK, 'User removed successfully', user);
  }
}
