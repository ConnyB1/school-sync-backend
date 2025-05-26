// proyecto/school-sync-backend/src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  NotFoundException, 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(
    registerUserDto: RegisterUserDto,
  ): Promise<Omit<User, 'password'>> {
    const { email, password, firstName, lastName, roles } = registerUserDto;

    try {
      await this.usersService.findOneByEmail(email);
      throw new ConflictException('El correo electrónico ya está en uso.');
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
      const userWithoutPassword = await this.usersService.createUserInternal({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        roles,
      });
      return userWithoutPassword; 
    } catch (error: any) {
      this.logger.error(
        `Error al registrar usuario: ${error.message}`,
        error.stack,
      );
      if (error instanceof ConflictException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al registrar el usuario.');
    }
  }
  
  async login(
    loginUserDto: LoginUserDto,
  ): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    const { email, password } = loginUserDto;
    this.logger.log(`Intento de login para: ${email}`);

    const userWithPassword = await this.usersService.findOneByEmailWithPassword(email);

    if (!userWithPassword) {
      this.logger.warn(`Login fallido para ${email}: Usuario no encontrado.`);
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const isPasswordMatching = await bcrypt.compare(password, userWithPassword.password);
    if (!isPasswordMatching) {
      this.logger.warn(`Login fallido para ${email}: Contraseña incorrecta.`);
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const { password: _omittedPassword, ...userResult } = userWithPassword; 

    const payload = {
      sub: userResult.id,
      email: userResult.email,
      roles: userResult.roles,
    };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken, user: userResult };
  }

  async validateUserById(userId: string): Promise<Omit<User, 'password'> | null> {
    this.logger.debug(`AuthService: Validando usuario por ID ${userId}`);
    try {
      const user = await this.usersService.findOneById(userId); 
      return user; 
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`AuthService: Usuario no encontrado con ID ${userId} durante validateUserById.`);
        return null; 
      }
      this.logger.error(`AuthService: Error validando usuario por ID ${userId}: ${error.message}`);
      throw new InternalServerErrorException('Error validando usuario.');
    }
  }
}