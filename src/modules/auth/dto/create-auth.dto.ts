import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';
import { Role } from 'src/common/enums/role.enum';
import { Column } from 'typeorm';
import { Transform } from 'class-transformer';
export class CreateAuthDto {
  @IsNotEmpty()
  @Column({ type: 'varchar', length: 255 })
  firstName: string;

  @IsNotEmpty()
  @Column({ type: 'varchar', length: 255 })
  lastName: string;

  @IsEmail()
  @Column({ type: 'varchar', unique: true })
  email: string;

  @MinLength(6)
  @Column({ type: 'varchar' })
  password: string;

  @IsOptional()
  @IsEnum(Role)
  @Transform(({ value }) => value?.toString().toUpperCase())
  role?: Role;
}
