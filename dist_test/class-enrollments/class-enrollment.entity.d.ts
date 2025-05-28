import { User } from '../users/user.entity';
import { Class } from '../classes/class.entity';
export declare class ClassEnrollment {
    id: string;
    userId: string;
    classId: string;
    user: User;
    class: Class;
    createdAt: Date;
    updatedAt: Date;
}
