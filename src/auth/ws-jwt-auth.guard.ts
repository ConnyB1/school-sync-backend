import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/user.entity'; // Importa la entidad User para Omit

// FIXED: Eliminamos la interfaz AuthenticatedUserSocketData
// Usaremos directamente Omit<User, 'password'> para client.data.user

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();

    // FIXED: Si client.data.user ya fue establecido por handleConnection, lo consideramos autenticado.
    // Esto evita la re-autenticación y es el punto de falla que reportaste.
    if ((client.data as any).user && ((client.data as any).user as Omit<User, 'password'>).id) {
      this.logger.verbose(`WsJwtAuthGuard: Usuario ya autenticado en socket ${client.id} por handleConnection.`);
      return true;
    }
    
    this.logger.verbose(`WsJwtAuthGuard: client.data.user no encontrado, intentando autenticar para socket ${client.id}...`);
    const token = this.getToken(client);

    if (!token) {
      this.logger.warn(`WsJwtAuthGuard: Token no proporcionado para socket ${client.id}.`);
      this.emitAuthErrorAndDisconnect(client, 'Token not provided.');
      return false;
    }

    try {
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        this.logger.error('WsJwtAuthGuard: JWT_SECRET no está configurado.');
        throw new Error('Server configuration error.');
      }
      const payload = await this.jwtService.verifyAsync(token, { secret: jwtSecret });
      
      // `usersService.findOneById` ya devuelve `Omit<User, 'password'>`
      const user = await this.usersService.findOneById(payload.sub);

      // FIXED: Almacenar el objeto user (Omit<User, 'password'>) directamente
      (client.data as any).user = user;
      this.logger.verbose(`WsJwtAuthGuard: Usuario ${user.email} autenticado exitosamente para socket ${client.id}.`);
      return true;
    } catch (error) {
      this.logger.warn(`WsJwtAuthGuard: Error de autenticación para socket ${client.id} - ${error.message}`);
      let errorMessage = 'Invalid token.';
      if (error.name === 'TokenExpiredError') {
        errorMessage = 'Token expired.';
      } else if (error.message === 'Server configuration error.') {
        errorMessage = 'Server configuration error during authentication.';
      } else if (error.name === 'NotFoundException') {
        errorMessage = 'Invalid user or user not found.';
      }
      this.emitAuthErrorAndDisconnect(client, errorMessage);
      return false;
    }
  }

  private getToken(client: Socket): string | null {
    const tokenFromAuth = client.handshake.auth?.token as string;
    if (tokenFromAuth) {
      this.logger.debug(`WsJwtAuthGuard: Token encontrado en handshake.auth.token para ${client.id}`);
      return tokenFromAuth;
    }

    const authHeader = client.handshake.headers?.authorization as string;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      this.logger.debug(`WsJwtAuthGuard: Token encontrado en Authorization header para ${client.id}`);
      return authHeader.split(' ')[1];
    }
    
    this.logger.debug(`WsJwtAuthGuard: No se encontró token para ${client.id}`);
    return null;
  }

  private emitAuthErrorAndDisconnect(client: Socket, message: string) {
    this.logger.warn(`WsJwtAuthGuard: Desconectando cliente ${client.id} debido a: ${message}`);
    client.emit('error', `Authentication failed: ${message}`);
    client.disconnect(true);
  }
}