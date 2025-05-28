import { UserRole } from "../../users/user.entity"; 

class SubmissionStudentDto {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export class SubmissionResponseDto {
  id: string;
  assignmentId: string;
  student: SubmissionStudentDto; 
  filePath?: string | null;
  submissionDate: Date;
  grade?: number | null;
  feedback?: string | null;
  createdAt: Date;
  updatedAt: Date;
}