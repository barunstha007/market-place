import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductRepository extends BaseRepository<Product> {
  constructor(
    dataSource: DataSource,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    super(dataSource, Product); // pass entity class to base repository
  }
}
