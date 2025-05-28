import { RoomType } from '../entities/message.entity';
export declare class CreateMessageDto {
    content: string;
    roomId: string;
    roomType: RoomType;
    classId?: string;
}
