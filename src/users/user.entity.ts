import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany } from 'typeorm';
import { Class } from '../classes/class.entity'; // Importa Class

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  auth0Id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'Nombre' })
  Nombre?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'Apellido' })
  Apellido?: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  picture?: string;

  @Column({ type: 'jsonb', nullable: true })
  roles?: string[];

  @CreateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', name: 'updatedAt' })
  updatedAt: Date;

  // RELACIONES CON CLASS
  @OneToMany(() => Class, (cls) => cls.teacher)
  teachingClasses: Class[]; // Clases que este usuario enseña

  @ManyToMany(() => Class, (cls) => cls.students)
  classes: Class[]; // Clases a las que este usuario (alumno) está inscrito
}