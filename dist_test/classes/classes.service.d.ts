import { Repository } from 'typeorm';
import { Class } from './class.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { SendGridService } from '../sendgrid/sendgrid.service';
import { CreateClassDto } from './dto/create-class.dto';
import { JoinClassDto } from './dto/join-class.dto';
import { ClassEnrollment } from '../class-enrollments/class-enrollment.entity';
export declare class ClassesService {
    private classesRepository;
    private usersService;
    private sendgridService;
    private classEnrollmentRepository;
    private readonly logger;
    constructor(classesRepository: Repository<Class>, usersService: UsersService, sendgridService: SendGridService, classEnrollmentRepository: Repository<ClassEnrollment>);
    private generateClassCode;
    create(createClassDto: CreateClassDto, teacherId: string): Promise<Class>;
    joinClass(joinClassDto: JoinClassDto, studentId: string): Promise<Class>;
    findAllForUser(userId: string): Promise<Class[]>;
    findById(classId: string, userId: string, relations?: string[]): Promise<Class>;
    findClassMembers(classId: string): Promise<{
        teachers: User[];
        students: User[];
    }>;
    importClassesFromExcel(fileBuffer: Buffer, uploaderId: string): Promise<any>;
    isUserEnrolledInClass(classId: string, userId: string): Promise<boolean>;
}
