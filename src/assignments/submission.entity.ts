// proyecto/school-sync-backend/src/assignments/submission.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Assignment } from './assignment.entity';
import { User } from '../users/user.entity';

@Entity('submissions')
@Unique(['assignmentId', 'studentId']) // Un estudiante solo puede tener una entrega por tarea
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'submission_file_url', type: 'text', nullable: true })
  submissionFileUrl?: string; // URL al archivo entregado

  @Column({ name: 'submission_message', type: 'text', nullable: true })
  submissionMessage?: string; // Mensaje opcional del alumno

  @Column({ name: 'grade', type: 'decimal', precision: 5, scale: 2, nullable: true })
  grade?: number; // Calificación de la tarea

  @Column({ name: 'feedback', type: 'text', nullable: true })
  feedback?: string; // Comentarios del profesor

  @Column({ name: 'submitted_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  submittedAt: Date; // Fecha de la entrega

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date; // Fecha de la última actualización

  @ManyToOne(() => Assignment, (assignment) => assignment.submissions, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'assignment_id' })
  assignment: Assignment;

  @Column({ name: 'assignment_id', type: 'uuid' })
  assignmentId: string;

  @ManyToOne(() => User, (user) => user.submissions, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;
}