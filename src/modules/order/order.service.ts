import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { OrderRepository } from 'src/database/repositories/order.repository';
import { ProductRepository } from 'src/database/repositories/product.repository';
import { OrderItemRepository } from 'src/database/repositories/order-item.repository';
import { Queue } from 'bullmq';
import { OrderItem } from 'src/database/entities/order-item.entity';
import { DeepPartial, Repository } from 'typeorm';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { GetOrdersDto } from './dto/get-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderProcessor } from './order.processor';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { OrderGateway } from './order.gateway';
@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderQueryRepository: Repository<Order>,
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly orderItemRepository: OrderItemRepository,
    private readonly orderProcessor: OrderProcessor,
    private readonly orderGateway: OrderGateway,
    @Inject('ORDER_QUEUE') private readonly orderQueue: Queue,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(userId: number, dto: CreateOrderDto): Promise<Order> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.productRepository.findByIds(productIds);

    if (products.length !== dto.items.length) {
      throw new NotFoundException('Some products not found');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalAmount = 0;
    const orderItems: DeepPartial<OrderItem>[] = [];

    for (const item of dto.items) {
      const product = productMap.get(item.productId);

      if (!product)
        throw new NotFoundException(`Product ${item.productId} not found`);

      if (product.stock < item.quantity)
        throw new BadRequestException(`Insufficient stock for ${product.name}`);

      // Decrease stock
      product.stock -= item.quantity;
      await this.productRepository.update(item.productId, {
        stock: product.stock,
      });

      totalAmount += Number(product.price) * item.quantity;

      orderItems.push({
        product,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const orderData = {
      userId,
      status: OrderStatus.PENDING,
      totalAmount,
      items: orderItems,
    };

    const order = await this.orderRepository.create(orderData);

    // Add job to queue
    await this.orderQueue.add('process-order', {
      orderId: order.id,
      status: order.status,
    });

    // WebSocket notifications
    this.orderGateway.sendNewOrderNotification(order.id);

    return order;
  }

  async findOne(
    orderId: number,
    userId: number,
    isAdmin: boolean,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product'],
    });
    if (!order) throw new NotFoundException('Order not found');

    // Owner or admin check
    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async findAll(
    dto: GetOrdersDto,
    userId: number,
    isAdmin: boolean,
  ): Promise<{ data: any[]; total: number }> {
    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const status = dto.status || 'all';

    // Build unique cache key
    const cacheKey = `orders:${userId}:page=${page}:limit=${limit}:status=${status}`;
    // 1. Try cache first
    const cached = await this.cacheManager.get<{ data: any[]; total: number }>(
      cacheKey,
    );
    if (cached) {
      return cached;
    }

    // 2. Build query
    const orderItems = this.orderQueryRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.product', 'product');

    if (!isAdmin) {
      orderItems.where('order.userId = :userId', { userId });
    }

    if (dto.status && dto.status !== 'all') {
      orderItems.andWhere('order.status = :status', { status: dto.status });
    }

    const [data, total] = await orderItems
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const result = {
      data: JSON.parse(JSON.stringify(data)),
      total,
    };

    //Set cache
    await this.cacheManager.set(cacheKey, result);

    return result;
  }
  async invalidateOrdersCache(userId: number) {
    const store = (this.cacheManager as any).store;

    if (!store) {
      console.error('Cache store not found!');
      return;
    }

    const client = store.client;
    if (!client) {
      console.error('Redis client not found on cache store!');
      return;
    }

    // Match all orders for this user
    const pattern = `orders:${userId}:*`;
    const keys = await client.keys(pattern);

    if (keys.length) {
      await client.del(...keys);
      console.log('Deleted cache keys:', keys);
    }
  }

  async updateStatus(
    orderId: number,
    dto: UpdateOrderStatusDto,
    userId: number,
  ): Promise<Order> {
    await this.orderRepository.update(orderId, { status: dto.status });
    const updatedOrder = await this.orderRepository.findOne({
      where: { id: orderId },
    });
    // Invalidate cache for this user
    await this.invalidateOrdersCache(updatedOrder.userId);
    // WebSocket notification
    this.orderGateway.sendOrderStatusUpdate(
      userId,
      updatedOrder.id,
      updatedOrder.status,
    );
    return updatedOrder;
  }
  async remove(id: number) {
    const order = await this.orderRepository.findOne({
      where: { id },
    });
    if (!order) throw new NotFoundException('Order not found');
    await this.orderRepository.delete(id);
    return { success: true };
  }
}
