// proyecto/school-sync-backend/src/assignments/assignments.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { Assignment } from './assignment.entity';
import { Submission } from './submission.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { Class } from '../classes/class.entity'; // Importar la entidad Class

@Module({
  imports: [
    TypeOrmModule.forFeature([Assignment, Submission, Class]), // <-- Asegúrate de que 'Class' esté aquí
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
  providers: [AssignmentsService],
  controllers: [AssignmentsController],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}