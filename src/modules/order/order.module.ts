import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderRepository } from 'src/database/repositories/order.repository';
import { OrderItemRepository } from 'src/database/repositories/order-item.repository';
import { ProductRepository } from 'src/database/repositories/product.repository';
import { Order } from 'src/database/entities/order.entity';
import { OrderItem } from 'src/database/entities/order-item.entity';
import { Product } from 'src/database/entities/product.entity';
import { OrderGateway } from './order.gateway';
import { OrderProcessor } from './order.processor';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Product])],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderRepository,
    OrderItemRepository,
    ProductRepository,
    OrderGateway,
    OrderProcessor,
    {
      provide: 'ORDER_QUEUE',
      useFactory: (config: ConfigService) => {
        return new Queue('orders', {
          connection: new IORedis(config.get<string>('REDIS_URL')),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['ORDER_QUEUE'],
})
export class OrderModule {}
