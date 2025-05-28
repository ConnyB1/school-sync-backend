import { ClassEnrollment } from '../class-enrollments/class-enrollment.entity';
import { Announcement } from '../announcements/announcement.entity';
import { Class } from '../classes/class.entity';
import { Message } from '../chat/entities/message.entity';
import { Assignment } from '../assignments/assignment.entity';
import { Submission } from '../assignments/submission.entity';
export declare enum UserRole {
    Alumno = "Alumno",
    Profesor = "Profesor",
    Padre = "Padre",
    Admin = "admin"
}
export declare class User {
    id: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    pictureUrl?: string;
    roles: UserRole[];
    enrollments: ClassEnrollment[];
    sentMessages: Message[];
    receivedMessages: Message[];
    taughtClasses: Class[];
    createdAnnouncements: Announcement[];
    assignments: Assignment[];
    submissions: Submission[];
    createdAt: Date;
    updatedAt: Date;
}
