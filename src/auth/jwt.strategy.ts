// proyecto/school-sync-backend/src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException, Logger, NotFoundException } from '@nestjs/common'; // Añadido NotFoundException
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity'; // Para el tipo Omit<User, 'password'>

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
    this.logger.log('JwtStrategy (local) inicializada.');
    if (!configService.get<string>('JWT_SECRET')) {
      this.logger.error('FATAL ERROR: JWT_SECRET no está definido en la configuración.');
      // Considera lanzar un error aquí para detener el inicio de la aplicación si el secreto no está.
    }
  }

  async validate(payload: JwtPayload): Promise<Omit<User, 'password'>> {
    this.logger.debug(`Validando payload JWT: Usuario ID ${payload.sub}, Email ${payload.email}`);

    if (!payload || !payload.sub) {
      this.logger.warn('Intento de validación con payload JWT inválido o ausente de "sub".');
      throw new UnauthorizedException('Token inválido: payload incorrecto.');
    }

    try {
      // usersService.findOneById devuelve Omit<User, 'password'> o lanza NotFoundException
      const user = await this.usersService.findOneById(payload.sub); 
      // user aquí es Omit<User, 'password'>
      
      // La línea 58 original donde ocurría el error TS2339 no debería intentar acceder a 'password'
      // ya que 'user' no lo tiene. Si había una desestructuración como:
      // const { password, ...result } = user; // Esto causaría el error en esta línea.
      // Ya no es necesaria porque 'user' ya es seguro.

      this.logger.log(`Usuario ${user.email} (ID: ${user.id}) autenticado exitosamente vía JWT.`);
      return user; // Devolver 'user' directamente, ya es Omit<User, 'password'>
    } catch (error) {
      if (error instanceof NotFoundException) { // Si findOneById lanza NotFoundException
        this.logger.warn(`Usuario no encontrado con ID (sub): ${payload.sub} durante la validación del JWT.`);
        throw new UnauthorizedException('Token inválido o usuario no encontrado.');
      }
      // Para otros posibles errores de usersService.findOneById o errores inesperados
      this.logger.error(`Error inesperado durante la validación del JWT para sub ${payload.sub}: ${error.message || error}`);
      throw new UnauthorizedException('Error de autenticación.');
    }
  }
}