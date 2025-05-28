import { User } from '../users/user.entity';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { JoinClassDto } from './dto/join-class.dto';
import { Class } from './class.entity';
export declare class ClassesController {
    private readonly classesService;
    private readonly logger;
    constructor(classesService: ClassesService);
    create(createClassDto: CreateClassDto, req: {
        user: User;
    }): Promise<Class>;
    join(joinClassDto: JoinClassDto, req: {
        user: User;
    }): Promise<Class>;
    findAllForUser(req: {
        user: User;
    }): Promise<Class[]>;
    findOne(classId: string, req: {
        user: User;
    }): Promise<Class>;
    findClassMembers(classId: string, req: {
        user: User;
    }): Promise<{
        teachers: User[];
        students: User[];
    }>;
    importClasses(file: Express.Multer.File, req: {
        user: User;
    }): Promise<any>;
}
