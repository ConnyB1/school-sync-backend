import { Repository } from 'typeorm';
import { Message, RoomType } from './entities/message.entity';
import { User } from '../users/user.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { Class } from '../classes/class.entity';
import { ClassEnrollment } from '../class-enrollments/class-enrollment.entity';
export interface ChatRoomView {
    id: string;
    name: string;
    type: RoomType;
    originalId?: string;
    targetUserId?: string;
    lastMessage?: Pick<Message, 'content' | 'timestamp' | 'senderId'> & {
        senderName?: string;
    };
    unreadCount?: number;
}
export declare class ChatService {
    private readonly messageRepository;
    private readonly userRepository;
    private readonly classRepository;
    private readonly classEnrollmentRepository;
    private readonly logger;
    constructor(messageRepository: Repository<Message>, userRepository: Repository<User>, classRepository: Repository<Class>, classEnrollmentRepository: Repository<ClassEnrollment>);
    createMessage(createMessageDto: CreateMessageDto, sender: Omit<User, 'password'>): Promise<Message>;
    getMessagesForRoom(roomId: string, userId: string, // ID del usuario que solicita, para validación de acceso
    page?: number, limit?: number): Promise<Message[]>;
    getUserChatRooms(user: Omit<User, 'password'>): Promise<ChatRoomView[]>;
    getRoomMessages(roomId: string, user: User): Promise<any[]>;
}
