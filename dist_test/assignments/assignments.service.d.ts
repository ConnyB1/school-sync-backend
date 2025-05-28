import { Repository } from 'typeorm';
import { Assignment } from './assignment.entity';
import { Class } from '../classes/class.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { Submission } from './submission.entity';
import { UsersService } from '../users/users.service';
import { SendGridService } from '../sendgrid/sendgrid.service';
export declare class AssignmentsService {
    private assignmentsRepository;
    private submissionsRepository;
    private usersService;
    private classesRepository;
    private readonly sendgridService;
    private readonly logger;
    constructor(assignmentsRepository: Repository<Assignment>, submissionsRepository: Repository<Submission>, usersService: UsersService, classesRepository: Repository<Class>, sendgridService: SendGridService);
    private saveFile;
    private deleteFile;
    createAssignment(createAssignmentDto: CreateAssignmentDto, teacherId: string, file?: Express.Multer.File): Promise<Assignment>;
    findAllAssignments(userId: string): Promise<Assignment[]>;
    findAllByClassId(classId: string, userId: string): Promise<Assignment[]>;
    findOneAssignment(assignmentId: string, userId: string): Promise<Assignment>;
    updateAssignment(id: string, updateAssignmentDto: UpdateAssignmentDto, teacherId: string, file?: Express.Multer.File): Promise<Assignment>;
    removeAssignment(id: string, teacherId: string): Promise<void>;
    submitAssignment(assignmentId: string, studentId: string, file: Express.Multer.File): Promise<Submission>;
    getSubmissionsForAssignment(assignmentId: string): Promise<Submission[]>;
    getMySubmissionForAssignment(assignmentId: string, studentId: string): Promise<Submission>;
    gradeSubmission(submissionId: string, grade: number, feedback: string, teacherId: string): Promise<Submission>;
}
