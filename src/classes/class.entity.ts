import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  RelationId,
  OneToMany, // <-- Agrega esta importación
} from 'typeorm';
import { User } from '../users/user.entity';
import { Announcement } from '../announcements/announcement.entity'; // <-- Importa Announcement

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, nullable: true })
  description?: string;

  @Column({ unique: true, length: 10 })
  @Index()
  accessCode: string;

  @ManyToOne(() => User, (user) => user.teachingClasses, { eager: true })
  teacher: User;

  @RelationId((cls: Class) => cls.teacher)
  teacherId: string;

  @ManyToMany(() => User, (user) => user.classes)
  @JoinTable({
    name: 'class_students_user',
    joinColumn: { name: 'class_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  students: User[];

  @OneToMany(() => Announcement, (announcement) => announcement.class)
  announcements: Announcement[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}