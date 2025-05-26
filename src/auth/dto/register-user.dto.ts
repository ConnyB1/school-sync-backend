import { IsEmail, IsString, MinLength, MaxLength, IsArray, IsOptional, IsEnum } from 'class-validator';

export enum UserRole {
  Alumno = 'Alumno',
  Profesor = 'Profesor',
  Padre = 'Padre',
  Admin = 'admin',
}

export class RegisterUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  lastName?: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3) 
  password: string;

  @IsArray()
  @IsEnum(UserRole, { each: true }) 
  roles: UserRole[];
}