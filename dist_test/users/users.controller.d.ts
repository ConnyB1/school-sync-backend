import { UsersService } from './users.service';
import { LinkStudentDto } from './dto/link-student.dto';
import { User } from './user.entity';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
export declare class UsersController {
    private readonly usersService;
    private readonly logger;
    constructor(usersService: UsersService);
    findUserByIdentifier(identifier: string, req: {
        user: User;
    }): Promise<Omit<User, "password">>;
    linkStudentToParent(req: {
        user: User;
    }, linkStudentDto: LinkStudentDto): Promise<{
        message: string;
    }>;
    updateUserProfile(req: {
        user: User;
    }, updateUserProfileDto: UpdateUserProfileDto, profilePicture?: Express.Multer.File): Promise<Omit<User, "password">>;
}
