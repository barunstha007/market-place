import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(
    dataSource: DataSource,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    super(dataSource, User); // pass entity class to base repository
  }
}
