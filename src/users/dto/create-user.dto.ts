// src/users/dto/create-user.dto.ts (Alineado con registro local, si se usa directamente)
// PERO ES MEJOR USAR RegisterUserDto de src/auth/dto/register-user.dto.ts y que AuthService lo maneje.

import { IsEmail, IsString, MinLength, IsArray, IsOptional, ArrayNotEmpty, IsEnum } from 'class-validator';
import { UserRole } from '../../auth/dto/register-user.dto'; // Reutilizar UserRole enum

export class CreateUserDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser válido.' })
  email: string;

  // Si este DTO es para un endpoint que crea usuarios directamente (ej. admin), la contraseña debe ser manejada.
  // Si es para el registro de usuario, AuthService.register se encarga del password.
  @IsString({ message: 'La contraseña debe ser un texto.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @IsOptional() // Hacerlo opcional aquí si AuthService.register es el principal para nuevos usuarios con contraseña
  password?: string;

  @IsString()
  @MinLength(2)
  @IsOptional()
  firstName?: string;

  @IsString()
  @MinLength(2)
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  pictureUrl?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(UserRole, { each: true, message: 'Rol inválido.'})
  @IsOptional() // Hacerlo opcional aquí si AuthService.register asigna roles por defecto
  roles?: UserRole[];

  // auth0Id ya no es necesario para la creación local
  // @IsString()
  // @IsOptional()
  // auth0Id?: string;
}