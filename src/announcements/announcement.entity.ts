// proyecto/school-sync-backend/src/announcements/announcement.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Class } from '../classes/class.entity';

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: false,
  })
  title: string;

  @Column({
    type: 'text',
    name: 'content',
    nullable: false,
  })
  content: string;

  @Column({
    name: 'image_url',
    type: 'text',
    nullable: true,
  })
  imageUrl?: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.createdAnnouncements, { // FIXED: Cambiado 'user.announcements' a 'user.createdAnnouncements'
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'author_id' })
  author?: User;

  @Column({ type: 'uuid', name: 'author_id', nullable: true })
  authorId?: string;

  @ManyToOne(() => Class, (classEntity) => classEntity.announcements, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Column({ type: 'uuid', name: 'class_id', nullable: false })
  classId: string;
}