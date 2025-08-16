import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { OrderItem } from '../entities/order-item.entity';

@Injectable()
export class OrderItemRepository extends BaseRepository<OrderItem> {
  constructor(
    dataSource: DataSource,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    super(dataSource, OrderItem); // pass entity class to base repository
  }
}
