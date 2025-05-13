import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
// Descomenta la siguiente línea si tienes un UsersController
// import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthModule), // Usa forwardRef para romper la dependencia circular
  ],
  // controllers: [UsersController], // Descomenta si tienes UsersController
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}