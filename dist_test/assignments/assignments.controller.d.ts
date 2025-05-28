import { User } from '../users/user.entity';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { Assignment } from './assignment.entity';
import { Submission } from './submission.entity';
import { Response } from 'express';
export declare class AssignmentsController {
    private readonly assignmentsService;
    private readonly logger;
    constructor(assignmentsService: AssignmentsService);
    create(createAssignmentDto: CreateAssignmentDto, req: {
        user: User;
    }, file?: Express.Multer.File): Promise<Assignment>;
    findAll(req: {
        user: User;
    }): Promise<Assignment[]>;
    findAllByClassId(classId: string, req: {
        user: User;
    }): Promise<Assignment[]>;
    findOne(assignmentId: string, req: {
        user: User;
    }): Promise<Assignment>;
    update(id: string, updateAssignmentDto: UpdateAssignmentDto, req: {
        user: User;
    }, file?: Express.Multer.File): Promise<Assignment>;
    remove(id: string, req: {
        user: User;
    }): Promise<void>;
    submitAssignment(assignmentId: string, file: Express.Multer.File, req: {
        user: User;
    }): Promise<Submission>;
    getSubmissionsForAssignment(assignmentId: string, req: {
        user: User;
    }): Promise<Submission[]>;
    getMySubmissionForAssignment(assignmentId: string, req: {
        user: User;
    }): Promise<Submission>;
    gradeSubmission(submissionId: string, grade: number, feedback: string, req: {
        user: User;
    }): Promise<Submission>;
    seeUploadedFile(folder: string, filename: string, res: Response): void;
}
