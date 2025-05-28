// proyecto/school-sync-backend/src/chat/chat.service.ts
import { Injectable, Logger, NotFoundException, ForbiddenException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Message, RoomType } from './entities/message.entity';
import { User } from '../users/user.entity'; // Asegúrate que User esté importado
import { CreateMessageDto } from './dto/create-message.dto';
import { Class } from '../classes/class.entity'; // Asegúrate que Class esté importado
import { ClassEnrollment } from '../class-enrollments/class-enrollment.entity';

export interface ChatRoomView {
  id: string;
  name: string;
  type: RoomType;
  originalId?: string; // Por ejemplo, classId para RoomType.CLASS
  targetUserId?: string; // Para RoomType.DIRECT
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
        classId: createMessageDto.classId,
        userId: sender.id
      });

      if (!isEnrolledAsStudent && classExists.teacherId !== sender.id) {
        this.logger.warn(`Usuario ${sender.email} intentando enviar mensaje a clase ${createMessageDto.classId} sin ser miembro o profesor.`);
        throw new ForbiddenException('No tienes permiso para enviar mensajes a esta clase.');
      }

      if (createMessageDto.roomId !== `class-${createMessageDto.classId}`) {
        this.logger.warn(`El roomId '${createMessageDto.roomId}' no coincide con el formato esperado 'class-${createMessageDto.classId}'. RoomId se mantendrá como enviado.`);
        // Podrías considerar normalizarlo aquí si fuera necesario:
        // createMessageDto.roomId = `class-${createMessageDto.classId}`;
      }

    } else if (createMessageDto.roomType === RoomType.DIRECT) {
      const participants = createMessageDto.roomId.replace(/^dm-/, '').split('-');
      if (participants.length !== 2 || !participants.includes(sender.id)) {
        this.logger.warn(`Usuario ${sender.email} intentando enviar a DM ${createMessageDto.roomId} con formato inválido o sin ser participante.`);
        throw new ForbiddenException('Formato de sala directa inválido o no eres participante.');
      }
      const otherParticipantId = participants.find(id => id !== sender.id);
      if (otherParticipantId) {
        const otherUserExists = await this.userRepository.findOneBy({ id: otherParticipantId });
        if (!otherUserExists) {
          throw new NotFoundException(`El otro usuario en el chat directo (ID: ${otherParticipantId}) no fue encontrado.`);
        }
        // if ('recipientId' in createMessageDto && !createMessageDto.recipientId) {
        //   (createMessageDto as any).recipientId = otherParticipantId; // Asignar si es necesario para la entidad Message
        // }
      } else {
        this.logger.error(`No se pudo identificar al otro participante en el DM room: ${createMessageDto.roomId} para sender: ${sender.id}`);
        throw new InternalServerErrorException('Error al procesar el chat directo.');
      }
    }

    const newMessageData: Partial<Message> = {
      content: createMessageDto.content,
      roomId: createMessageDto.roomId,
      roomType: createMessageDto.roomType,
      classId: createMessageDto.roomType === RoomType.CLASS ? createMessageDto.classId : undefined,
      senderId: sender.id,
      sender: sender as User,
      timestamp: new Date(),
    };
    
    if (createMessageDto.roomType === RoomType.DIRECT) {
        const participants = createMessageDto.roomId.replace(/^dm-/, '').split('-');
        const otherParticipantId = participants.find(id => id !== sender.id);
        if (otherParticipantId) {
            newMessageData.recipientId = otherParticipantId; // Asumiendo que tu entidad Message tiene `recipientId`
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
    userId: string,
    page = 1,
    limit = 50,
  ): Promise<Message[]> {
    this.logger.log(`Usuario ${userId} obteniendo mensajes para la sala: ${roomId}, página ${page}, límite ${limit}`);

    // Lógica de validación de acceso (ya existente y parece correcta)
    if (roomId.startsWith('dm-')) {
      const participants = roomId.replace(/^dm-/, '').split('-');
      if (!participants.includes(userId)) {
        this.logger.warn(`Usuario ${userId} intentó acceder a sala DM ${roomId} sin ser participante.`);
        throw new ForbiddenException('No tienes acceso a esta sala de chat directo.');
      }
    } else if (roomId.startsWith('class-')) {
      const classId = roomId.replace(/^class-/, '');
      const classExists = await this.classRepository.findOneBy({id: classId });
      if (!classExists) {
          this.logger.warn(`Intento de obtener mensajes para sala de clase inexistente: ${classId} por ${userId}`);
          throw new NotFoundException(`Clase para sala ${roomId} no encontrada.`);
      }

      const isEnrolled = await this.classEnrollmentRepository.findOneBy({ classId, userId });
      if (!isEnrolled && classExists.teacherId !== userId) {
        this.logger.warn(`Usuario ${userId} intentó acceder a sala de clase ${roomId} sin ser miembro o profesor.`);
        throw new ForbiddenException('No tienes acceso a esta sala de clase.');
      }
    } else {
        this.logger.warn(`Formato de roomId desconocido al obtener mensajes: ${roomId} para usuario ${userId}`);
        throw new BadRequestException('Formato de sala desconocido.');
    }

    const findOptions: FindManyOptions<Message> = {
      where: { roomId },
      order: { timestamp: 'DESC' },
      relations: ['sender'],
      take: limit,
      skip: (page - 1) * limit,
    };

    const messages = await this.messageRepository.find(findOptions);
    return messages.reverse(); // Los mensajes se devuelven en orden cronológico ascendente
  }

  async getUserChatRooms(user: Omit<User, 'password'> & { roles?: string[] }): Promise<ChatRoomView[]> {
    this.logger.log(`Obteniendo salas de chat para usuario ${user.email} con roles: ${user.roles?.join(', ')}`);
    
    let classRoomsFromEnrollments: ChatRoomView[] = [];
    try {
      const enrollments = await this.classEnrollmentRepository.find({
        where: { userId: user.id },
        relations: ['class'], 
      });

      classRoomsFromEnrollments = enrollments
        .filter(enrollment => enrollment.class) 
        .map(enrollment => ({
          id: `class-${enrollment.class.id}`, // Usar class.id para consistencia
          name: enrollment.class.name,
          type: RoomType.CLASS,
          originalId: enrollment.class.id,
        }));
      this.logger.debug(`Salas de clase por inscripción para ${user.email}: ${classRoomsFromEnrollments.length}`);
    } catch (error) {
      this.logger.error(`Error obteniendo salas por inscripción para ${user.email}: ${error.message}`, error.stack);
    }
    
    let taughtClassRooms: ChatRoomView[] = [];
    if (user.roles && user.roles.includes('Profesor')) { // Asegúrate que 'Profesor' sea el nombre exacto del rol
      try {
        const taughtClasses = await this.classRepository.find({
          where: { teacherId: user.id }, 
        });

        taughtClassRooms = taughtClasses
          .map(classEntity => ({
            id: `class-${classEntity.id}`, // Generar ID de sala consistentemente
            name: classEntity.name,
            type: RoomType.CLASS,
            originalId: classEntity.id,
          }));
        this.logger.debug(`Salas de clase enseñadas por ${user.email}: ${taughtClassRooms.length}`);
      } catch (error) {
        this.logger.error(`Error obteniendo salas enseñadas por ${user.email}: ${error.message}`, error.stack);
      }
    }

    const allClassRooms = [...classRoomsFromEnrollments, ...taughtClassRooms];
    const uniqueClassRooms = Array.from(new Map(allClassRooms.map(room => [room.id, room])).values());
    this.logger.debug(`Total de salas de clase únicas para ${user.email}: ${uniqueClassRooms.length}`);

    let directRooms: ChatRoomView[] = [];
    try {
      // Lógica mejorada para obtener salas de DM únicas y nombres de los otros participantes
      const directMessages = await this.messageRepository
        .createQueryBuilder("message")
        .where("message.roomType = :roomType", { roomType: RoomType.DIRECT })
        .andWhere("(message.senderId = :userId OR message.recipientId = :userId)", { userId: user.id })
        .select(["message.roomId", "message.senderId", "message.recipientId"])
        .distinctOn(["message.roomId"]) // Obtener solo una entrada por roomId para identificar las salas
        // .orderBy("message.roomId") // No es necesario ordenar aquí si solo queremos los IDs de sala
        .getRawMany(); // Usar getRawMany para campos seleccionados

      const directRoomDetailsPromises = directMessages.map(async (msgFields) => {
        const roomId = msgFields.message_roomId;
        if (!roomId) return null;

        const participants = roomId.replace(/^dm-/, '').split('-');
        const otherUserId = participants.find(id => id !== user.id);
        
        let otherUserName = 'Usuario Desconocido';
        if (otherUserId) {
          const otherUser = await this.userRepository.findOne({ 
            where: { id: otherUserId }, 
            select: ['firstName', 'lastName', 'email']
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
      });
      
      directRooms = (await Promise.all(directRoomDetailsPromises)).filter(Boolean) as ChatRoomView[];
      this.logger.debug(`Salas de chat directo para ${user.email}: ${directRooms.length}`);
    } catch (error) {
      this.logger.error(`Error obteniendo salas de chat directo para ${user.email}: ${error.message}`, error.stack);
    }
    
    const finalRooms = [...uniqueClassRooms, ...directRooms];
    this.logger.log(`Total de salas (${finalRooms.length}) devueltas para ${user.email}`);
    return finalRooms;
  }

  async canUserJoinRoom(user: Omit<User, 'password'> & { roles?: string[] }, roomId: string): Promise<boolean> {
    this.logger.debug(`Verificando permiso para unirse: Usuario ${user.email}, Sala ${roomId}`);
    if (roomId.startsWith('class-')) {
      const classId = roomId.replace(/^class-/, '');
      const classEntity = await this.classRepository.findOneBy({ id: classId });
      if (!classEntity) {
        this.logger.warn(`Intento de unirse a sala de clase inexistente: ${classId} por ${user.email}`);
        return false;
      }
      
      if (classEntity.teacherId === user.id) {
        this.logger.debug(`Permiso concedido (join): ${user.email} es profesor de la clase ${classId}`);
        return true;
      }
      
      const enrollment = await this.classEnrollmentRepository.findOneBy({ userId: user.id, classId: classId });
      if (enrollment) {
        this.logger.debug(`Permiso concedido (join): ${user.email} está inscrito en la clase ${classId}`);
        return true;
      }
      
      this.logger.warn(`Permiso denegado (join): ${user.email} no es profesor ni está inscrito en la clase ${classId}`);
      return false;

    } else if (roomId.startsWith('dm-')) {
      const participants = roomId.replace(/^dm-/, '').split('-');
      if (participants.includes(user.id)) {
        this.logger.debug(`Permiso concedido (join): ${user.email} es participante del DM ${roomId}`);
        return true;
      }
      this.logger.warn(`Permiso denegado (join): ${user.email} no es participante del DM ${roomId}`);
      return false;
    }
    
    this.logger.warn(`Formato de roomId desconocido en canUserJoinRoom: ${roomId}`);
    return false;
  }

  // Este método getRoomMessages es el que parece ser referenciado internamente o era una versión anterior.
  // El método getMessagesForRoom es el que se expone en el controlador.
  // Mantengo este por si hay alguna dependencia interna, pero la lógica de permisos es similar.
  async getRoomMessages(roomId: string, user: User): Promise<any[]> {
    this.logger.log(`(Legacy getRoomMessages) Obteniendo mensajes para sala ${roomId} (usuario: ${user.email})`);

    const canAccess = await this.canUserJoinRoom(user, roomId); // Reutilizar la lógica de canUserJoinRoom
    if (!canAccess) {
         this.logger.warn(`(Legacy getRoomMessages) Usuario ${user.email} intentó acceder a sala ${roomId} sin permiso.`);
         throw new ForbiddenException(`No tienes acceso a esta sala de chat: ${roomId}`);
    }

    const messages = await this.messageRepository.find({
      where: { roomId },
      relations: ['sender'], 
      order: { timestamp: 'ASC' },
    });

    return messages.map(message => ({
      id: message.id,
      content: message.content,
      timestamp: message.timestamp,
      roomId: message.roomId,
      senderId: message.sender?.id, 
      senderName: message.sender ? `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() || message.sender.email : 'Desconocido',
    }));
  }
}