// proyecto/school-sync-backend/src/classes/classes.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  ForbiddenException,
  forwardRef,
  Inject,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Class } from './class.entity';
import { User, UserRole } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { SendGridService } from '../sendgrid/sendgrid.service';
import * as XLSX from 'xlsx';
import { CreateClassDto } from './dto/create-class.dto';
import { JoinClassDto } from './dto/join-class.dto';
import { ExcelClassRowDto } from './dto/import-classes.dto';
import { ClassEnrollment } from '../class-enrollments/class-enrollment.entity';

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);

  constructor(
    @InjectRepository(Class)
    private classesRepository: Repository<Class>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private sendgridService: SendGridService,
    @InjectRepository(ClassEnrollment)
    private classEnrollmentRepository: Repository<ClassEnrollment>,
  ) {}

  private generateClassCode(length: number = 6): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }

  async create(
    createClassDto: CreateClassDto,
    teacherId: string,
  ): Promise<Class> {
    this.logger.log(`Intentando crear clase con DTO: ${JSON.stringify(createClassDto)} por profesor ID: ${teacherId}`);

    const teacher = await this.usersService.findOneById(teacherId);

    if (
      !teacher.roles?.includes(UserRole.Profesor) &&
      !teacher.roles?.includes(UserRole.Admin)
    ) {
      throw new ForbiddenException(
        'Solo los profesores o administradores pueden crear clases.',
      );
    }

    let classCode: string;
    let existingClassByCode: Class | null;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      classCode = this.generateClassCode();
      existingClassByCode = await this.classesRepository.findOne({
        where: { classCode },
      });
      attempts++;
      if (attempts > maxAttempts) {
        this.logger.error(
          'No se pudo generar un código de clase único después de varios intentos.',
        );
        throw new InternalServerErrorException(
          'No se pudo generar un código de clase único.',
        );
      }
    } while (existingClassByCode);
    
    const newClassPartial: Partial<Class> = {
      name: createClassDto.name,
      description: createClassDto.description,
      teacherId: teacher.id,
      teacher: teacher as User,
      classCode: classCode,
    };

    const newClass = this.classesRepository.create(newClassPartial);
    
    try {
      const savedClass = await this.classesRepository.save(newClass);
      this.logger.log(`Clase creada con ID: ${savedClass.id}, Código: ${savedClass.classCode}`);
      return savedClass;
    } catch (error) {
      this.logger.error(
        `Error al guardar la nueva clase: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Error al crear la clase.');
    }
  }

  async joinClass(
    joinClassDto: JoinClassDto,
    studentId: string,
  ): Promise<Class> {
    const student = await this.usersService.findOneById(studentId);
    if (
      !student.roles?.includes(UserRole.Alumno) &&
      !student.roles?.includes(UserRole.Admin)
    ) {
      throw new ForbiddenException(
        'Solo los alumnos o administradores pueden unirse a clases de esta manera.',
      );
    }

    // APLICAR .trim() AQUÍ
    const classToJoin = await this.classesRepository.findOne({
      where: { classCode: joinClassDto.classCode.trim() }, // <--- CAMBIO AQUÍ
      relations: ['studentEnrollments', 'teacher'],
    });

    if (!classToJoin) {
      throw new NotFoundException(
        `Clase con código "${joinClassDto.classCode.trim()}" no encontrada.`, // <--- CAMBIO AQUÍ para mensaje
      );
    }

    const isAlreadyEnrolled = classToJoin.studentEnrollments.some(
      (enrollment) => enrollment.userId === student.id,
    );

    if (isAlreadyEnrolled) {
      this.logger.log(
        `El alumno ${student.id} ya está inscrito en la clase ${classToJoin.id}.`,
      );
      return classToJoin;
    }
    const newEnrollment = this.classEnrollmentRepository.create({
      classId: classToJoin.id,
      userId: student.id,
    });
    await this.classEnrollmentRepository.save(newEnrollment);
    this.logger.log(
      `Alumno ${student.id} inscrito exitosamente en la clase ${classToJoin.id}.`,
    );
    return this.findById(classToJoin.id, student.id);
  }

  async findAllForUser(userId: string): Promise<Class[]> {
    const user = await this.usersService.findOneById(userId);

    let classes: Class[] = [];

    if (user.roles?.includes(UserRole.Profesor) || user.roles?.includes(UserRole.Admin)) {
      const taughtClasses = await this.classesRepository.find({
        where: { teacherId: user.id },
        relations: ['teacher', 'studentEnrollments', 'studentEnrollments.user'], // Incluir usuarios en enrollments
      });
      classes = classes.concat(taughtClasses);
    }

    if (user.roles?.includes(UserRole.Alumno) || user.roles?.includes(UserRole.Admin)) {
      const enrollments = await this.classEnrollmentRepository.find({
        where: { userId: user.id },
        relations: ['class', 'class.teacher', 'class.studentEnrollments', 'class.studentEnrollments.user'], // Incluir usuarios en enrollments
      });
      // Filtrar para evitar duplicados si un usuario es profesor y alumno de la misma clase
      const enrolledClasses = enrollments.map(enrollment => enrollment.class)
                                         .filter(enrolledClass => !classes.some(c => c.id === enrolledClass.id));
      classes = classes.concat(enrolledClasses);
    }

    // Ordenar para una visualización consistente
    return classes.sort((a, b) => a.name.localeCompare(b.name));
  }

  // MODIFICADO: Agregado un parámetro opcional para cargar relaciones
  async findById(classId: string, userId: string, relations: string[] = ['teacher', 'studentEnrollments', 'studentEnrollments.user']): Promise<Class> {
    this.logger.log(`Buscando clase ID: ${classId} para usuario ID: ${userId} con relaciones: ${relations.join(', ')}`);

    const classEntity = await this.classesRepository.findOne({
      where: { id: classId },
      relations: relations, // Usar las relaciones pasadas o las predeterminadas
    });

    if (!classEntity) {
      throw new NotFoundException(`Clase con ID ${classId} no encontrada.`);
    }

    // Verificar si el usuario es el profesor o está matriculado
    const isTeacher = classEntity.teacherId === userId;
    const isStudent = classEntity.studentEnrollments.some(enrollment => enrollment.userId === userId);
    const isAdmin = (await this.usersService.findOneById(userId)).roles?.includes(UserRole.Admin);

    if (!isTeacher && !isStudent && !isAdmin) {
      throw new ForbiddenException('No tienes permiso para acceder a esta clase.');
    }

    return classEntity;
  }

  async findClassMembers(classId: string): Promise<{ teachers: User[]; students: User[] }> {
    this.logger.log(`Obteniendo miembros para la clase ID: ${classId}`);
    const classEntity = await this.classesRepository.findOne({
      where: { id: classId },
      relations: ['teacher', 'studentEnrollments', 'studentEnrollments.user'], // Asegura que la relación 'user' se carga
    });

    if (!classEntity) {
      throw new NotFoundException(`Clase con ID ${classId} no encontrada.`);
    }

    const teachers: User[] = classEntity.teacher ? [classEntity.teacher] : [];
    const students: User[] = classEntity.studentEnrollments
                                         .filter(enrollment => enrollment.user) // Filtrar si user es null/undefined
                                         .map(enrollment => enrollment.user);
    
    return { teachers, students };
  }

  async importClassesFromExcel(fileBuffer: Buffer, uploaderId: string): Promise<any> {
    const uploader = await this.usersService.findOneById(uploaderId);

    if (!uploader.roles?.includes(UserRole.Admin) && !uploader.roles?.includes(UserRole.Profesor)) {
      throw new ForbiddenException('Solo los administradores o profesores pueden importar clases.');
    }

    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: ExcelClassRowDto[] = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      throw new BadRequestException('El archivo Excel está vacío o no tiene el formato esperado.');
    }

    const newClasses: Class[] = [];
    for (const row of data) {
      const className = row.Clase;
      const classCode = row.Codigo; // Asume que el código viene en el Excel

      if (!className || !classCode) {
        this.logger.warn(`Fila omitida por datos incompletos: ${JSON.stringify(row)}`);
        continue;
      }

      // Buscar si la clase ya existe por nombre o código
      let existingClass = await this.classesRepository.findOne({ where: [{ name: className }, { classCode: classCode }] });

      if (existingClass) {
        this.logger.warn(`Clase "${className}" o código "${classCode}" ya existe. Omitiendo creación.`);
        continue; // O podrías actualizarla
      }

      const newClassPartial: Partial<Class> = {
        name: className,
        description: row.Description, // FIXED: Corregido el nombre de la propiedad
        classCode: classCode,
        teacherId: uploader.id, // El que sube el archivo es el profesor de estas clases
        teacher: uploader as User,
      };

      const newClass = this.classesRepository.create(newClassPartial);
      newClasses.push(newClass);
    }

    if (newClasses.length === 0) {
      return { message: 'No se crearon nuevas clases (ya existían o los datos eran incompletos).' };
    }

    try {
      await this.classesRepository.save(newClasses);
      return { message: `Se importaron ${newClasses.length} clases exitosamente.` };
    } catch (error) {
      this.logger.error(`Error al guardar clases importadas: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al importar clases.');
    }
  }

  // FIXED: Nuevo método para verificar si un usuario está matriculado en una clase
  async isUserEnrolledInClass(classId: string, userId: string): Promise<boolean> {
    const enrollment = await this.classEnrollmentRepository.findOne({
      where: { classId, userId },
    });
    return !!enrollment;
  }
}