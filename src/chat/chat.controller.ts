import { Controller, Get, Param, Query, UseGuards, Req, Logger, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Message } from './entities/message.entity';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  async getUserChatRooms(@Req() req: AuthenticatedRequest): Promise<any[]> {
    this.logger.log(`Usuario ${req.user.email} solicitando su lista de salas de chat.`);
    // Pasa el objeto user completo
    return this.chatService.getUserChatRooms(req.user); 
  }
  

  @Get('test-route')
  testRoute() {
    this.logger.log('Ruta de prueba alcanzada!');
    return 'Chat test route is working!';
  }

  @Get('messages/:roomId')
  async getMessagesForRoom(
    @Param('roomId') roomId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<Message[]> {
    this.logger.log(`Usuario ${req.user.email} solicitando mensajes para la sala ${roomId} (página ${page}, límite ${limit})`);
    return this.chatService.getMessagesForRoom(roomId, req.user.id, page, limit);
  }
}