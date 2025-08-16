import {
  Repository,
  DataSource,
  DeepPartial,
  FindOneOptions,
  FindManyOptions,
  In,
} from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export class BaseRepository<T> {
  protected repo: Repository<T>;

  constructor(
    private readonly dataSource: DataSource,
    entity: new () => T,
  ) {
    this.repo = this.dataSource.getRepository(entity);
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    try {
      return await this.repo.findOne(options);
    } catch (error) {
      throw new BadRequestException(error.message || 'Error fetching record.');
    }
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    try {
      return await this.repo.find(options);
    } catch (error) {
      throw new BadRequestException(error.message || 'Error fetching record.');
    }
  }

  async create(data: DeepPartial<T>): Promise<T> {
    try {
      const entity = this.repo.create(data);
      return await this.repo.save(entity);
    } catch (error) {
      throw new BadRequestException(error.message || 'Error creating record.');
    }
  }

  async update(criteria: any, data: QueryDeepPartialEntity<T>): Promise<T> {
    try {
      await this.repo.update(criteria, data);
      return await this.repo.findOne({ where: criteria } as any);
    } catch (error) {
      throw new BadRequestException(error.message || 'Error updating record.');
    }
  }

  async delete(criteria: any): Promise<void> {
    try {
      await this.repo.softDelete(criteria);
    } catch (error) {
      throw new BadRequestException(error.message || 'Error deleting record.');
    }
  }
  async findAndCountAll(options?: FindManyOptions<T>): Promise<[T[], number]> {
    try {
      return await this.repo.findAndCount(options);
    } catch (error) {
      console.error('Error in findAndCountAll:', error.message);
      throw new BadRequestException('Unable to retrieve records.');
    }
  }

  async findByIds(ids: number[], options?: FindManyOptions<T>): Promise<T[]> {
    if (!ids || ids.length === 0) return [];

    try {
      return await this.repo.find({
        where: { id: In(ids) } as any, // cast to satisfy TypeScript
        ...options,
      });
    } catch (error) {
      throw new BadRequestException(error.message || 'Error fetching records.');
    }
  }
}
