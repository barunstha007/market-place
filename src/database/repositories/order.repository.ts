import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { Order } from '../entities/order.entity';

@Injectable()
export class OrderRepository extends BaseRepository<Order> {
  constructor(
    dataSource: DataSource,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    super(dataSource, Order); // pass entity class to base repository
  }
}
