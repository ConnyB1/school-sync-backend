// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard'; // Tu guard JWT
import { User } from '../users/user.entity';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerUserDto: RegisterUserDto) {
    this.logger.log(`Intento de registro para: ${registerUserDto.email}`);
    const user = await this.authService.register(registerUserDto);
    return { message: 'Usuario registrado exitosamente', user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginUserDto: LoginUserDto) {
    this.logger.log(`Intento de login para: ${loginUserDto.email}`);
    return this.authService.login(loginUserDto);
  }

  // Este endpoint es para obtener el perfil del usuario actualmente autenticado
  // (basado en el token JWT que envíe el cliente)
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: User }) { // req.user es poblado por JwtStrategy
    this.logger.log(`Perfil solicitado por usuario: ${req.user.email}`);
    return req.user; // JwtStrategy ya retorna el usuario sin la contraseña
  }
}