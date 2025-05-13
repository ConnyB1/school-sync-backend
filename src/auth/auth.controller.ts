import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, HttpStatus, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard'; 

export class LoginDto {
  email: string;
  password?: string;
}

@Controller('auth') 
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login') 
  async login(@Body() loginDto: LoginDto) {
    if (!loginDto.password) {
      throw new BadRequestException('Password is required');
    }
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.authService.login(user);
  }
  @UseGuards(JwtAuthGuard)
  @Get('profile') 
  getProfile(@Request() req) {
    return req.user;
  }

}