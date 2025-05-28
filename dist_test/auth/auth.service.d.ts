import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
export declare class AuthService {
    private usersService;
    private jwtService;
    private readonly logger;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(registerUserDto: RegisterUserDto): Promise<Omit<User, 'password'>>;
    login(loginUserDto: LoginUserDto): Promise<{
        accessToken: string;
        user: Omit<User, 'password'>;
    }>;
    validateUserById(userId: string): Promise<Omit<User, 'password'> | null>;
}
