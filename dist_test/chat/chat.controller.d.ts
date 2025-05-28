import { ChatService } from './chat.service';
import { Message } from './entities/message.entity';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
export declare class ChatController {
    private readonly chatService;
    private readonly logger;
    constructor(chatService: ChatService);
    getUserChatRooms(req: AuthenticatedRequest): Promise<any[]>;
    testRoute(): string;
    getMessagesForRoom(roomId: string, page: number, limit: number, req: AuthenticatedRequest): Promise<Message[]>;
}
