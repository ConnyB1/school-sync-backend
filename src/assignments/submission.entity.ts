// proyecto/school-sync-backend/src/assignments/submission.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Assignment } from './assignment.entity';

@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Assignment, assignment => assignment.submissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignment_id' }) // Cambiado a snake_case
  assignment: Assignment;

  @Column({ name: 'assignment_id' }) // Mapea explícitamente la propiedad a la columna snake_case
  assignmentId: string; // El nombre de la propiedad puede seguir siendo camelCase

  @ManyToOne(() => User, user => user.submissions)
  @JoinColumn({ name: 'student_id' }) // Cambiado a snake_case
  student: User;

  @Column({ name: 'student_id' }) // Mapea explícitamente la propiedad a la columna snake_case
  studentId: string; // El nombre de la propiedad puede seguir siendo camelCase

  // Propiedades añadidas/corregidas
  @Column({ type: 'varchar', name: 'file_path', nullable: true }) // Asegúrate de que el nombre de columna también coincida aquí si fue afectado por la migración
  filePath?: string | null;

  @Column({ type: 'timestamptz', name: 'submission_date' }) // Asegúrate de que el nombre de columna también coincida
  submissionDate: Date;

  @Column({ type: 'int', nullable: true }) // 'grade' probablemente no necesita un 'name' si la columna se llama 'grade'
  grade?: number | null;

  @Column({ type: 'text', nullable: true }) // 'feedback' probablemente no necesita un 'name'
  feedback?: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}