// proyecto/school-sync-backend/src/assignments/assignments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from './assignment.entity';
import { Submission } from './submission.entity'; // Importa la nueva entidad Submission
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { UsersModule } from '../users/users.module';
import { ClassesModule } from '../classes/classes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assignment, Submission]), // Añade Submission aquí
    UsersModule,
    ClassesModule,
  ],
  providers: [AssignmentsService],
  controllers: [AssignmentsController],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}