import { DataSource } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

ConfigModule.forRoot({ isGlobal: true });
const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  entities: [],
  migrations: [
    'src/migrations/*{.ts,.js}',
    // 'src/migrations/1755241549860-product-seeder.ts',
  ],
  schema: configService.get<string>('DB_SCHEMA') || 'public',
});
