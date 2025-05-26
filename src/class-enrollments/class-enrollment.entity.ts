// proyecto/school-sync-backend/src/class-enrollments/class-enrollment.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Class } from '../classes/class.entity';

@Entity('class_enrollments')
@Unique(['userId', 'classId'])
export class ClassEnrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'class_id' })
  classId: string;

  @ManyToOne(() => User, user => user.enrollments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Class, classEntity => classEntity.studentEnrollments)
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}