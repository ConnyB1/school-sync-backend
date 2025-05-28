import { User } from '../users/user.entity';
import { ClassEnrollment } from '../class-enrollments/class-enrollment.entity';
import { Message } from '../chat/entities/message.entity';
import { Announcement } from '../announcements/announcement.entity';
import { Assignment } from '../assignments/assignment.entity';
export declare class Class {
    id: string;
    name: string;
    description?: string;
    classCode: string;
    teacherId: string;
    teacher: User;
    studentEnrollments: ClassEnrollment[];
    messages: Message[];
    announcements: Announcement[];
    assignments: Assignment[];
    createdAt: Date;
    updatedAt: Date;
}
