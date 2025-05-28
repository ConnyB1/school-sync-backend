import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
export declare class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    private readonly jwtService;
    private readonly configService;
    private readonly usersService;
    server: Server;
    private readonly logger;
    constructor(chatService: ChatService, jwtService: JwtService, configService: ConfigService, usersService: UsersService);
    afterInit(server: Server): void;
    handleConnection(client: Socket, ...args: any[]): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(client: Socket, roomId: string): Promise<void>;
    handleMessage(client: Socket, payload: CreateMessageDto): Promise<void>;
}
