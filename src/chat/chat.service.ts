// proyecto/school-sync-backend/src/chat/chat.service.ts
import { Injectable, Logger, NotFoundException, ForbiddenException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm'; // Brackets no se usa aquí directamente
import { Message, RoomType } from './entities/message.entity';
import { User } from '../users/user.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { Class } from '../classes/class.entity';
import { ClassEnrollment } from '../class-enrollments/class-enrollment.entity';

export interface ChatRoomView {
  id: string;
  name: string;
  type: RoomType;
  originalId?: string;
  targetUserId?: string;
  lastMessage?: Pick<Message, 'content' | 'timestamp' | 'senderId'> & { senderName?: string };
  unreadCount?: number;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(ClassEnrollment)
    private readonly classEnrollmentRepository: Repository<ClassEnrollment>,
  ) {}

  async createMessage(createMessageDto: CreateMessageDto, sender: Omit<User, 'password'>): Promise<Message> {
    this.logger.log(`Creando mensaje en sala ${createMessageDto.roomId} de usuario ${sender.email}`);

    // Validaciones (usando 'sender' en lugar de 'user')
    if (createMessageDto.roomType === RoomType.CLASS) {
      if (!createMessageDto.classId) {
        this.logger.warn(`Intento de crear mensaje de clase sin classId para room ${createMessageDto.roomId}`);
        throw new ForbiddenException('Se requiere classId para mensajes de tipo CLASS.');
      }
      const classExists = await this.classRepository.findOneBy({ id: createMessageDto.classId });
      if (!classExists) {
        throw new NotFoundException(`Clase con ID ${createMessageDto.classId} no encontrada.`);
      }

      const isEnrolledAsStudent = await this.classEnrollmentRepository.findOneBy({
          classId: createMessageDto.classId, // Corregido para buscar por classId directamente
          userId: sender.id
      });

      if (!isEnrolledAsStudent && classExists.teacherId !== sender.id) {
        this.logger.warn(`Usuario ${sender.email} intentando enviar mensaje a clase ${createMessageDto.classId} sin ser miembro o profesor.`);
        throw new ForbiddenException('No tienes permiso para enviar mensajes a esta clase.');
      }

      // Opcional: Validar o corregir roomId para mensajes de clase
      if (createMessageDto.roomId !== `class-${createMessageDto.classId}`) {
        this.logger.warn(`El roomId '${createMessageDto.roomId}' no coincide con el formato esperado 'class-${createMessageDto.classId}'. Considerar corrección o validación estricta.`);
        // createMessageDto.roomId = `class-${createMessageDto.classId}`; // Podrías corregirlo si es necesario
      }

    } else if (createMessageDto.roomType === RoomType.DIRECT) {
      const participants = createMessageDto.roomId.replace(/^dm-/, '').split('-'); // Asegura quitar 'dm-' solo al inicio
      if (participants.length !== 2 || !participants.includes(sender.id)) {
        this.logger.warn(`Usuario ${sender.email} intentando enviar a DM ${createMessageDto.roomId} con formato inválido o sin ser participante listado en el ID.`);
        throw new ForbiddenException('Formato de sala directa inválido o no eres participante.');
      }
      const otherParticipantId = participants.find(id => id !== sender.id);
      if (otherParticipantId) {
        const otherUserExists = await this.userRepository.findOneBy({ id: otherParticipantId });
        if (!otherUserExists) {
          throw new NotFoundException(`El otro usuario en el chat directo (ID: ${otherParticipantId}) no fue encontrado.`);
        }
        // Asignar recipientId si la entidad Message tiene este campo y es un DM
        if ('recipientId' in createMessageDto && !createMessageDto.recipientId) {
            createMessageDto.recipientId = otherParticipantId;
        }
      } else {
        this.logger.error(`No se pudo identificar al otro participante en el DM room: ${createMessageDto.roomId} para sender: ${sender.id}`);
        throw new InternalServerErrorException('Error al procesar el chat directo.');
      }
    }

    // ÚNICA declaración y creación de newMessageEntity
    const newMessageData: Partial<Message> = {
      content: createMessageDto.content,
      roomId: createMessageDto.roomId,
      roomType: createMessageDto.roomType,
      classId: createMessageDto.roomType === RoomType.CLASS ? createMessageDto.classId : undefined,
      senderId: sender.id,
      sender: sender as User, // Cast Omit<User, 'password'> a User para la relación
      timestamp: new Date(),
    };
    
    // Si es un mensaje directo y tienes recipientId en tu entidad Message y quieres asignarlo:
    if (createMessageDto.roomType === RoomType.DIRECT) {
        const participants = createMessageDto.roomId.replace(/^dm-/, '').split('-');
        const otherParticipantId = participants.find(id => id !== sender.id);
        if (otherParticipantId) {
            newMessageData.recipientId = otherParticipantId;
        }
    }

    const newMessageEntity = this.messageRepository.create(newMessageData);

    try {
      const savedMessage = await this.messageRepository.save(newMessageEntity);
      this.logger.log(`Mensaje guardado con ID: ${savedMessage.id} en sala ${savedMessage.roomId}`);
      return savedMessage;
    } catch (error) {
      this.logger.error(`Error al guardar mensaje de ${sender.email} en sala ${createMessageDto.roomId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error interno al guardar el mensaje.');
    }
  }

  async getMessagesForRoom(
    roomId: string,
    userId: string, // ID del usuario que solicita, para validación de acceso
    page = 1,
    limit = 50,
  ): Promise<Message[]> {
    this.logger.log(`Usuario ${userId} obteniendo mensajes para la sala: ${roomId}, página ${page}, límite ${limit}`);

    if (roomId.startsWith('dm-')) {
      const participants = roomId.replace(/^dm-/, '').split('-');
      if (!participants.includes(userId)) {
        this.logger.warn(`Usuario ${userId} intentó acceder a sala DM ${roomId} sin ser participante.`);
        throw new ForbiddenException('No tienes acceso a esta sala de chat directo.');
      }
    } else if (roomId.startsWith('class-')) {
      const classId = roomId.replace(/^class-/, '');
      const classExists = await this.classRepository.findOneBy({id: classId });
      if (!classExists) throw new NotFoundException(`Clase para sala ${roomId} no encontrada.`);

      const isEnrolled = await this.classEnrollmentRepository.findOneBy({ classId, userId });
      if (!isEnrolled && classExists.teacherId !== userId) {
        this.logger.warn(`Usuario ${userId} intentó acceder a sala de clase ${roomId} sin ser miembro o profesor.`);
        throw new ForbiddenException('No tienes acceso a esta sala de clase.');
      }
    } else {
        this.logger.warn(`Formato de roomId desconocido: ${roomId} para usuario ${userId}`);
        throw new ForbiddenException('Formato de sala desconocido.');
    }

    const findOptions: FindManyOptions<Message> = {
      where: { roomId },
      order: { timestamp: 'DESC' },
      relations: ['sender'], // Asegura que el sender se cargue con sus campos (sin contraseña si Message.sender usa User y User.password es select:false)
      take: limit,
      skip: (page - 1) * limit,
    };

    const messages = await this.messageRepository.find(findOptions);
    return messages.reverse();
  }

  async getUserChatRooms(user: Omit<User, 'password'>): Promise<ChatRoomView[]> {
    this.logger.log(`Obteniendo salas de chat para usuario ${user.email}`);
    
    const enrollments = await this.classEnrollmentRepository.find({
      where: { userId: user.id },
      relations: ['class'], // Carga la entidad Class relacionada
    });

    const classRooms: ChatRoomView[] = enrollments
      .filter(enrollment => enrollment.class) // Filtrar por si alguna clase fuera null
      .map(enrollment => ({
        id: `class-${enrollment.classId}`,
        name: enrollment.class.name, // Acceder a class.name
        type: RoomType.CLASS,
        originalId: enrollment.classId,
    }));

    // Para mensajes directos, la consulta original con LIKE puede ser ineficiente.
    // Es mejor si guardas recipientId en la entidad Message.
    // Si Message tiene senderId y recipientId para DMs:
    const directMessagesFromUser = await this.messageRepository.find({
        where: [
            { senderId: user.id, roomType: RoomType.DIRECT },
            { recipientId: user.id, roomType: RoomType.DIRECT }
        ],
        select: ['roomId', 'senderId', 'recipientId'], // Seleccionar solo lo necesario
        order: { timestamp: 'DESC' } // Para obtener el último mensaje si es necesario después
    });
    
    const directRoomIds = new Set<string>();
    directMessagesFromUser.forEach(msg => msg.roomId && directRoomIds.add(msg.roomId));

    const directRooms = await Promise.all(
      Array.from(directRoomIds).map(async (roomId) => {
        const participants = roomId.replace(/^dm-/, '').split('-');
        const otherUserId = participants.find(id => id !== user.id);
        
        let otherUserName = 'Usuario Desconocido';
        if (otherUserId) {
          const otherUser = await this.userRepository.findOne({ 
            where: { id: otherUserId }, 
            select: ['firstName', 'lastName', 'email'] // Seleccionar solo lo necesario, sin contraseña
          });
          if (otherUser) {
            otherUserName = `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email;
          }
        }
        
        return {
          id: roomId,
          name: otherUserName,
          type: RoomType.DIRECT,
          targetUserId: otherUserId || 'unknown',
        };
      })
    );

    return [...classRooms, ...directRooms];
  }

  // El método getRoomMessages original parece bien, pero el parámetro 'user' es tipo 'User'
  // Si lo llamas desde un sitio donde tienes Omit<User, 'password'>, necesitarás castear o ajustar.
  // Por ahora lo dejo como está, asumiendo que el contexto de llamada maneja el tipo 'User'.
  async getRoomMessages(roomId: string, user: User): Promise<any[]> { // user aquí es User completo
    this.logger.log(`Obteniendo mensajes para sala ${roomId} (usuario: ${user.email})`);

    // Lógica de verificación de acceso (ya existente)
    if (roomId.startsWith('class-')) {
      const classId = roomId.replace(/^class-/, '');
      const classEntity = await this.classRepository.findOneBy({ id: classId }); // Cache or ensure loaded
      if (!classEntity) throw new NotFoundException(`Clase ${classId} no encontrada`);
      const enrollment = await this.classEnrollmentRepository.findOne({
        where: { userId: user.id, classId: classId }, // classId directo aquí
      });
      if (!enrollment && classEntity.teacherId !== user.id ) { // Asume que classEntity.teacherId existe
        throw new ForbiddenException(`No tienes acceso a esta clase`);
      }
    } else if (roomId.startsWith('dm-')) {
      const participants = roomId.replace(/^dm-/, '').split('-');
      if (!participants.includes(user.id)) {
        throw new ForbiddenException(`No tienes acceso a esta conversación`);
      }
    } else {
        throw new BadRequestException("Formato de roomId desconocido.");
    }

    const messages = await this.messageRepository.find({
      where: { roomId },
      relations: ['sender'], // Para acceder a sender.firstName, sender.lastName
      order: { timestamp: 'ASC' },
    });

    return messages.map(message => ({
      id: message.id,
      content: message.content,
      timestamp: message.timestamp,
      roomId: message.roomId,
      senderId: message.sender?.id, // Añadir ? por si sender no se carga
      senderName: message.sender ? `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() || message.sender.email : 'Desconocido',
    }));
  }
}