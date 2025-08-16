// src/orders/order.processor.ts
import { Injectable } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { OrderRepository } from 'src/database/repositories/order.repository';
import { OrderGateway } from './order.gateway';
import IORedis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from 'src/common/enums/order-status.enum';

@Injectable()
export class OrderProcessor {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly configService: ConfigService,
    private readonly orderGateway: OrderGateway,
  ) {
    this.initWorker();
  }

  initWorker() {
    const connection = new IORedis(
      this.configService.get<string>('REDIS_URL'),
      { maxRetriesPerRequest: null },
    );

    new Worker(
      'orders',
      async (job: Job) => {
        const orderId = job.data.orderId;

        // simulate processing delay
        await new Promise((res) => setTimeout(res, 5000));

        const order = await this.orderRepository.findOne({
          where: { id: orderId },
        });
        if (!order) throw new Error('Order not found');

        await this.orderRepository.update(orderId, {
          status: OrderStatus.PROCESSING,
        });

        // websocket broadcast status update
        this.orderGateway.sendOrderStatusUpdate(
          order.userId,
          orderId,
          order.status,
        );

        return { success: true };
      },
      { connection },
    );
  }
}
