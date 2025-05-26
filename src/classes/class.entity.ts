// proyecto/school-sync-backend/src/classes/class.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { ClassEnrollment } from '../class-enrollments/class-enrollment.entity';
import { Message } from '../chat/entities/message.entity';
import { Announcement } from '../announcements/announcement.entity';
import { Assignment } from '../assignments/assignment.entity';

@Entity('classes')
@Unique(['classCode'])
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'class_code', unique: true, type: 'varchar', length: 20 })
  classCode: string;

  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId: string;

  @ManyToOne(() => User, (user) => user.taughtClasses)
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @OneToMany(() => ClassEnrollment, (enrollment) => enrollment.class)
  studentEnrollments: ClassEnrollment[];

  @OneToMany(() => Message, (message) => message.classInstance, { cascade: ['remove'] })
  messages: Message[];

  @OneToMany(() => Announcement, (announcement) => announcement.class, { cascade: ['remove'] })
  announcements: Announcement[];

  @OneToMany(() => Assignment, (assignment) => assignment.class, { cascade: true })
  assignments: Assignment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}