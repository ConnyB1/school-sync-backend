import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private usersRepository;
    private readonly logger;
    constructor(usersRepository: Repository<User>);
    findOneById(id: string): Promise<Omit<User, 'password'>>;
    findOneByEmail(email: string): Promise<Omit<User, 'password'>>;
    findByIdentifier(identifier: string): Promise<Omit<User, 'password'>>;
    findOneByEmailWithPassword(email: string): Promise<User | undefined>;
    createUserInternal(userData: Partial<User> & {
        password?: string;
        roles?: UserRole[];
    }): Promise<Omit<User, 'password'>>;
    createUser(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>>;
    linkParentToStudent(parentId: string, studentId: string): Promise<void>;
    updateUserProfile(userId: string, updateData: Partial<Omit<User, 'password'>>): Promise<Omit<User, 'password'>>;
    getLinkedStudentsForParent(parentId: string): Promise<Array<Omit<User, 'password'>>>;
}
