import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from '../users/user.entity';
export declare class AuthController {
    private authService;
    private readonly logger;
    constructor(authService: AuthService);
    register(registerUserDto: RegisterUserDto): Promise<{
        message: string;
        user: Omit<User, "password">;
    }>;
    login(loginUserDto: LoginUserDto): Promise<{
        accessToken: string;
        user: Omit<User, "password">;
    }>;
    getProfile(req: {
        user: User;
    }): User;
}
