import { UserRole } from '../../auth/dto/register-user.dto';
export declare class CreateUserDto {
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    pictureUrl?: string;
    roles?: UserRole[];
}
