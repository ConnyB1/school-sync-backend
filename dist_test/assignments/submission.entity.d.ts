import { User } from '../users/user.entity';
import { Assignment } from './assignment.entity';
export declare class Submission {
    id: string;
    assignment: Assignment;
    assignmentId: string;
    student: User;
    studentId: string;
    filePath?: string | null;
    submissionDate: Date;
    grade?: number | null;
    feedback?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
