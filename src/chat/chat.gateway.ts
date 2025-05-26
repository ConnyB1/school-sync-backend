// proyecto/school-sync-backend/src/chat/chat.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { Logger, UseGuards, Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { WsJwtAuthGuard } from '../auth/ws-jwt-auth.guard';
import { User } from '../users/user.entity'; // Importa la entidad User para Omit

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RoomType } from './entities/message.entity';

// FIXED: Eliminamos la interfaz AuthenticatedUserSocketData
// Usaremos directamente Omit<User, 'password'> para client.data.user

@WebSocketGateway({
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:8080'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
@Injectable()
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('ChatGateway inicializado y listo!');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Nuevo cliente intentando conectar: ${client.id}`);
    const token = client.handshake.auth?.token as string || client.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      this.logger.warn(`Cliente ${client.id}: Token no proporcionado. Desconectando.`);
      client.emit('error', 'Authentication failed: Token not provided.');
      client.disconnect(true);
      return;
    }

    try {
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret) {
          this.logger.error('JWT_SECRET no está configurado en el servidor.');
          throw new Error('Error de configuración del servidor.');
      }
      const payload = await this.jwtService.verifyAsync(token, { secret: jwtSecret });
      
      // FIXED: Almacena directamente el objeto User (Omit<User, 'password'>)
      // `usersService.findOneById` ya devuelve `Omit<User, 'password'>`
      const user = await this.usersService.findOneById(payload.sub); 

      // Asigna el usuario a client.data.user. Socket.IO permite extender el objeto client.data.
      (client.data as any).user = user; 

      this.logger.log(`Cliente ${client.id} (Usuario: ${user.email}) autenticado y conectado exitosamente.`);
      client.emit('authenticated'); 
    } catch (error) {
      this.logger.warn(`Cliente ${client.id}: Autenticación fallida en handleConnection - ${error.message}. Desconectando.`);
      let errorMessage = 'Authentication failed: Invalid token.';
      if (error.name === 'TokenExpiredError') {
        errorMessage = 'Authentication failed: Token expired.';
      } else if (error.message === 'Error de configuración del servidor.') {
        errorMessage = 'Server configuration error during authentication.';
      } else if (error.name === 'NotFoundException') { 
        errorMessage = 'Authentication failed: User not found.';
      }
      client.emit('error', errorMessage);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    // FIXED: Accede al usuario de client.data como Omit<User, 'password'>
    const user = (client.data as any).user as Omit<User, 'password'>; 
    if (user) {
      this.logger.log(`Cliente ${client.id} (Usuario: ${user.email}) desconectado.`);
    } else {
      this.logger.log(`Cliente ${client.id} desconectado (no autenticado previamente).`);
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() roomId: string): Promise<void> {
    // FIXED: Accede al usuario de client.data como Omit<User, 'password'>
    const user = (client.data as any).user as Omit<User, 'password'>; 
    
    this.logger.log(`Usuario ${user.email} (Socket: ${client.id}) solicitando unirse a la sala: ${roomId}`);
    try {
      client.join(roomId);
      this.logger.log(`Usuario ${user.email} se unió exitosamente a la sala: ${roomId}`);
      this.server.to(client.id).emit('joinedRoom', roomId); 
    } catch (error) {
      this.logger.error(`Error al unir usuario ${user.email} a sala ${roomId}: ${error.message}`);
      this.server.to(client.id).emit('error', `No se pudo unir a la sala ${roomId}: ${error.message || 'Permiso denegado'}`);
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('message')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: CreateMessageDto): Promise<void> {
    // FIXED: Accede al usuario de client.data como Omit<User, 'password'>
    const userSocketData = (client.data as any).user as Omit<User, 'password'>; 

    this.logger.debug(`RAW PAYLOAD RECIBIDO en handleMessage: ${JSON.stringify(payload)}`);

    try {
      const messageToSave: CreateMessageDto = {
        content: payload.content,
        roomId: payload.roomId,
        roomType: payload.roomType,
        classId: payload.roomType === RoomType.CLASS ? payload.classId : undefined,
      };
      
      // FIXED: Pasa userSocketData que ahora es de tipo Omit<User, 'password'>
      const savedMessage = await this.chatService.createMessage(messageToSave, userSocketData); 

      this.logger.log(`Mensaje de ${userSocketData.email} para sala ${payload.roomId} guardado.`);
      
      const messageToEmit = {
        id: savedMessage.id,
        content: savedMessage.content,
        timestamp: savedMessage.timestamp,
        roomId: savedMessage.roomId,
        roomType: savedMessage.roomType,
        classId: savedMessage.classId,
        recipientId: savedMessage.recipientId, 
        sender: { // Asegúrate de que el objeto sender emitido coincida con lo que el frontend espera
          id: userSocketData.id,
          firstName: userSocketData.firstName,
          lastName: userSocketData.lastName,
          email: userSocketData.email,
        },
      };

      this.server.to(payload.roomId).emit('newMessage', messageToEmit);
      this.logger.log(`Mensaje de ${userSocketData.email} emitido a la sala ${payload.roomId}`);
    } catch (error) {
      this.logger.error(`Error procesando mensaje de ${userSocketData.email} para ${payload.roomId}: ${error.message}`, error.stack);
      this.server.to(client.id).emit('error', `Error al enviar mensaje: ${error.message}`); 
    }
  }
}