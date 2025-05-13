// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && user.passwordHash && await bcrypt.compare(pass, user.passwordHash)) {
      const { passwordHash, ...result } = user; 
      return result; 
    }
    return null; 
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, /* añade otros datos como roles si los tienes */ };
    return {
      access_token: this.jwtService.sign(payload), 
    };
  }

  // Podrías añadir una función de registro aquí también si lo necesitas
  // async register(createUserDto: CreateUserDto, passwordRaw: string) {
  //   // Verifica si el usuario ya existe
  //   const existingUser = await this.usersService.findOneByEmail(createUserDto.email);
  //   if (existingUser) {
  //     throw new UnauthorizedException('El correo electrónico ya está registrado');
  //   }
  //   // Crea el usuario usando UsersService
  //   const newUser = await this.usersService.createUser(createUserDto, passwordRaw);
  //   // Opcionalmente, puedes loguear al usuario directamente después del registro
  //   // return this.login(newUser);
  //   return newUser; // Devuelve el usuario creado (sin hash)
  // }
}