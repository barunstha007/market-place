import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { Column } from 'typeorm';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @Column({ type: 'varchar', unique: true })
  email: string;

  @MinLength(6)
  @IsNotEmpty()
  @Column({ type: 'varchar' })
  password: string;
}
