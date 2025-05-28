import { User } from '../../users/user.entity';
import { Class } from '../../classes/class.entity';
export declare enum RoomType {
    CLASS = "class",
    DIRECT = "direct"
}
export declare class Message {
    id: string;
    content: string;
    timestamp: Date;
    updatedAt: Date;
    sender: User;
    senderId: string;
    roomId: string;
    roomType: RoomType;
    classInstance?: Class;
    classId?: string;
    recipient?: User;
    recipientId?: string;
}
