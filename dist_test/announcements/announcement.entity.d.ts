import { User } from '../users/user.entity';
import { Class } from '../classes/class.entity';
export declare class Announcement {
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    author?: User;
    authorId?: string;
    class: Class;
    classId: string;
}
