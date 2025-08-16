import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CommonResponse } from 'src/common/helpers/common-response';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { GetOrdersDto } from './dto/get-order.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from 'src/database/entities/user.entity';
import { Order } from './entities/order.entity';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: User,
  })
  async createOrder(@Req() req, @Body() dto: CreateOrderDto) {
    const userId = req.user.id;
    const order = await this.orderService.create(userId, dto);
    return new CommonResponse(
      HttpStatus.CREATED,
      'Order created successfully',
      order,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOrder(@Param('id') id: number, @Req() req) {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const order = await this.orderService.findOne(+id, userId, isAdmin);
    return new CommonResponse(
      HttpStatus.OK,
      'Order fetched successfully',
      order,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get order details' })
  @ApiResponse({ status: 200, description: 'Order details', type: Order })
  async getOrders(@Query() dto: GetOrdersDto, @Req() req) {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const { data, total } = await this.orderService.findAll(
      dto,
      userId,
      isAdmin,
    );
    return new CommonResponse(HttpStatus.OK, 'Orders fetched successfully', {
      data,
      total,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update order status (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated',
    type: Order,
  })
  async updateStatus(
    @Param('id') id: number,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req,
  ) {
    const userId = req.user.id;
    const order = await this.orderService.updateStatus(+id, dto, userId);
    return new CommonResponse(
      HttpStatus.OK,
      'Order status updated successfully',
      order,
    );
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Softdelete order' })
  @ApiResponse({
    status: 200,
    description: 'Order Delete',
    type: Order,
  })
  async delete(@Param('id') id: string) {
    const order = await this.orderService.remove(+id);
    return new CommonResponse(
      HttpStatus.OK,
      'Order removed successfully',
      order,
    );
  }
}
