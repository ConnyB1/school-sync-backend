// Ubicación: proyecto/school-sync-backend/src/chat/entities/message.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity'; // Asegúrate que la ruta sea correcta
import { Class } from '../../classes/class.entity'; // Asegúrate que la ruta sea correcta

export enum RoomType {
  CLASS = 'class',
  DIRECT = 'direct',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @CreateDateColumn({
    name: 'timestamp',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  timestamp: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // --- Relación con el remitente (User) ---
  @ManyToOne(
    () => User,
    (user) => user.sentMessages, // Relación en User.entity
    {
      eager: true,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'sender_id' }) // Nombre de la columna FK en la BD
  sender: User;

  @Column({ name: 'sender_id', type: 'uuid' }) // Columna que almacena el ID
  senderId: string;

  // --- Identificador de la Sala ---
  @Column({ name: 'room_id', type: 'varchar', length: 255 })
  roomId: string; // Ej: 'class_uuid' o 'direct_user1uuid_user2uuid'

  // --- Tipo de Sala ---
  @Column({
    name: 'room_type',
    type: 'enum',
    enum: RoomType,
  })
  roomType: RoomType;

  // --- Relación con la Clase (si roomType es 'class') ---
  @ManyToOne(
    () => Class,
    (classEntity) => classEntity.messages, // Relación en Class.entity
    {
      nullable: true,
      onDelete: 'SET NULL',
      eager: false,
    },
  )
  @JoinColumn({ name: 'class_id' })
  classInstance?: Class; // Propiedad para la instancia de la clase

  @Column({ name: 'class_id', type: 'uuid', nullable: true })
  classId?: string; // Columna FK para el ID de la clase

  // --- Relación con el destinatario (User) (si roomType es 'direct') ---
  @ManyToOne(
    () => User,
    (user) => user.receivedMessages, // Relación en User.entity
    {
      nullable: true,
      onDelete: 'SET NULL',
      eager: false,
    }
  )
  @JoinColumn({ name: 'recipient_id' }) // Nombre de la columna FK en la BD
  recipient?: User;

  @Column({ name: 'recipient_id', type: 'uuid', nullable: true })
  recipientId?: string; // Columna FK para el ID del destinatario
}