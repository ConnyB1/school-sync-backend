// proyecto/school-sync-backend/src/users/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ClassEnrollment } from '../class-enrollments/class-enrollment.entity';
import { Announcement } from '../announcements/announcement.entity';
import { Class } from '../classes/class.entity';
import { Message } from '../chat/entities/message.entity';
import { Assignment } from '../assignments/assignment.entity';
import { Submission } from '../assignments/submission.entity';

export enum UserRole {
  Alumno = 'Alumno',
  Profesor = 'Profesor',
  Padre = 'Padre',
  Admin = 'admin',
}

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string; // Tipo `string` sin longitud para coincidir con la migración

  @Column({ select: false })
  password: string; // Tipo `string` sin longitud para coincidir con la migración

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName?: string; // Columna 'firstName'

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName?: string; // Columna 'lastName'

  @Column({ name: 'picture_url', type: 'text', nullable: true })
  pictureUrl?: string;

  @Column({ type: 'text', array: true, default: [] })
  roles: UserRole[];

  // Relaciones
  @OneToMany(() => ClassEnrollment, (enrollment) => enrollment.user)
  enrollments: ClassEnrollment[];

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @OneToMany(() => Message, (message) => message.recipient)
  receivedMessages: Message[];

  @OneToMany(() => Class, (classEntity) => classEntity.teacher)
  taughtClasses: Class[];

  @OneToMany(() => Announcement, (announcement) => announcement.author)
  createdAnnouncements: Announcement[];

  @OneToMany(() => Assignment, (assignment) => assignment.teacher)
  assignments: Assignment[];

  @OneToMany(() => Submission, (submission) => submission.student)
  submissions: Submission[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}