// proyecto/school-sync-backend/src/classes/classes.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { Class } from './class.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { ClassEnrollment } from '../class-enrollments/class-enrollment.entity';
import { SendGridModule } from '../sendgrid/sendgrid.module';
import { AuthModule } from '../auth/auth.module';
import { Assignment } from '../assignments/assignment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Class, User, ClassEnrollment, Assignment]),
    forwardRef(() => UsersModule),
    SendGridModule,
    AuthModule,
  ],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}