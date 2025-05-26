// proyecto/school-sync-backend/src/assignments/assignment.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany, // Importar OneToMany
    JoinColumn,
  } from 'typeorm';
  import { Class } from '../classes/class.entity';
  import { User } from '../users/user.entity';
  import { Submission } from './submission.entity'; // Importar la nueva entidad Submission
  
  @Entity('assignments')
  export class Assignment {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 255, nullable: false })
    title: string;
  
    @Column('text', { nullable: true })
    description?: string;
  
    @Column({ type: 'timestamptz', nullable: true })
    dueDate?: Date | null; // Changed to allow null explicitly
  
    @ManyToOne(() => Class, (cls) => cls.assignments, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'class_id' })
    class: Class;
  
    @Column({ type: 'uuid', name: 'class_id', nullable: false })
    classId: string;
  
    @ManyToOne(() => User, (user) => user.assignments, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'teacher_id' })
    teacher?: User;
  
    @Column({ type: 'uuid', name: 'teacher_id', nullable: true })
    teacherId?: string;

    // Optional: for file uploads (teacher's attachment to the assignment description)
    @Column({ name: 'assignment_file_url', type: 'text', nullable: true })
    assignmentFileUrl?: string;

    // FIXED: Nueva relación OneToMany con Submission
    @OneToMany(() => Submission, (submission) => submission.assignment)
    submissions: Submission[];
  
    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
  }