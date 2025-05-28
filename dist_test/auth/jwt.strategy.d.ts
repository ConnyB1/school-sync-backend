import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
export interface JwtPayload {
    sub: string;
    email: string;
    roles: string[];
    iat?: number;
    exp?: number;
}
declare const JwtStrategy_base: new (...args: any) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly usersService;
    private readonly logger;
    constructor(configService: ConfigService, usersService: UsersService);
    validate(payload: JwtPayload): Promise<Omit<User, 'password'>>;
}
export {};
