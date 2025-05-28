// proyecto/school-sync-backend/src/assignments/assignment.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
  } from 'typeorm';
  import { Class } from '../classes/class.entity';
  import { User } from '../users/user.entity';
  import { Submission } from './submission.entity';
  
  @Entity('assignments')
  export class Assignment {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 255, nullable: false })
    title: string;
  
    @Column('text', { nullable: true })
    description?: string;
  
    @Column({ type: 'timestamptz', nullable: true })
    dueDate?: Date | null;
  
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

    // Propiedad para la URL del archivo adjunto
    // Ahora permite 'string', 'undefined' o 'null'
    @Column({ name: 'assignment_file_url', type: 'text', nullable: true })
    assignmentFileUrl?: string | null; // <-- CAMBIO CRUCIAL AQUÍ

    @OneToMany(() => Submission, (submission) => submission.assignment)
    submissions: Submission[];
  
    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
    static assignmentFileUrl: string;
  }