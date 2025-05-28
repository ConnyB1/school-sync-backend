import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
export declare class WsJwtAuthGuard implements CanActivate {
    private readonly jwtService;
    private readonly usersService;
    private readonly configService;
    private readonly logger;
    constructor(jwtService: JwtService, usersService: UsersService, configService: ConfigService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getToken;
    private emitAuthErrorAndDisconnect;
}
