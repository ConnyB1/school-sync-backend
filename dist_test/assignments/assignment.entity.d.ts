import { Class } from '../classes/class.entity';
import { User } from '../users/user.entity';
import { Submission } from './submission.entity';
export declare class Assignment {
    id: string;
    title: string;
    description?: string;
    dueDate?: Date | null;
    class: Class;
    classId: string;
    teacher?: User;
    teacherId?: string;
    assignmentFileUrl?: string | null;
    submissions: Submission[];
    createdAt: Date;
    updatedAt: Date;
}
