// proyecto/school-sync-backend/src/classes/classes.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Class } from './class.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service'; // Para buscar/crear usuarios
import { SendGridService } from '../sendgrid/sendgrid.service'; // Para enviar correos
import * as XLSX from 'xlsx';
import { CreateClassDto } from './dto/create-class.dto';
import { JoinClassDto } from './dto/join-class.dto';
import { ImportClassesDto, ExcelClassRowDto } from './dto/import-classes.dto'; // Crearemos estos DTOs

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);

  constructor(
    @InjectRepository(Class)
    private classesRepository: Repository<Class>,
    @InjectRepository(User) // Necesario si interactuamos directamente con User aquí
    private usersRepository: Repository<User>,
    private usersService: UsersService,
    private sendgridService: SendGridService,
  ) {}

  private generateAccessCode(length: number = 6): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  async create(createClassDto: CreateClassDto, teacherAuth0Id: string): Promise<Class> {
    const teacher = await this.usersService.findOneByAuth0Id(teacherAuth0Id);
    if (!teacher) {
      throw new NotFoundException(`Maestro con Auth0 ID ${teacherAuth0Id} no encontrado.`);
    }
    // Verificar que el usuario tenga rol de maestro
    if (!teacher.roles || !teacher.roles.includes('Profesor')) {
        throw new ForbiddenException('Solo los maestros pueden crear clases.');
    }

    let accessCode = this.generateAccessCode();
    let existingClassByCode = await this.classesRepository.findOne({ where: { accessCode } });
    while (existingClassByCode) { // Asegurar unicidad del código
      accessCode = this.generateAccessCode();
      existingClassByCode = await this.classesRepository.findOne({ where: { accessCode } });
    }

    const newClass = this.classesRepository.create({
      ...createClassDto,
      teacher,
      accessCode,
      students: [],
    });

    try {
      return await this.classesRepository.save(newClass);
    } catch (error) {
      if (error.code === '23505') { // Error de unicidad (ej. si el nombre de clase debe ser único por maestro)
        throw new ConflictException('Ya existe una clase con un nombre similar o código de acceso.');
      }
      this.logger.error('Error creando clase:', error);
      throw new InternalServerErrorException('No se pudo crear la clase.');
    }
  }

  async joinClass(joinClassDto: JoinClassDto, studentAuth0Id: string): Promise<Class> {
    const student = await this.usersService.findOneByAuth0Id(studentAuth0Id);
    if (!student) {
      throw new NotFoundException(`Alumno con Auth0 ID ${studentAuth0Id} no encontrado.`);
    }
     // Verificar que el usuario tenga rol de alumno
    if (!student.roles || !student.roles.includes('alumno')) {
        throw new ForbiddenException('Solo los alumnos pueden unirse a clases.');
    }


    const classToJoin = await this.classesRepository.findOne({
      where: { accessCode: joinClassDto.accessCode },
      relations: ['students', 'teacher'],
    });

    if (!classToJoin) {
      throw new NotFoundException(`Clase con código de acceso "${joinClassDto.accessCode}" no encontrada.`);
    }

    // Verificar si el alumno ya está en la clase
    const isAlreadyEnrolled = classToJoin.students.some(s => s.id === student.id);
    if (isAlreadyEnrolled) {
      this.logger.log(`El alumno ${student.email} ya está inscrito en la clase ${classToJoin.name}`);
      return classToJoin; // O podrías lanzar un BadRequestException
    }

    if (classToJoin.teacherId === student.id) {
        throw new BadRequestException('Un maestro no puede unirse a su propia clase como alumno.');
    }

    classToJoin.students.push(student);
    await this.classesRepository.save(classToJoin);
    this.logger.log(`Alumno ${student.email} unido a la clase ${classToJoin.name}`);
    return classToJoin;
  }

  async findAllForUser(userAuth0Id: string): Promise<Class[]> {
    const user = await this.usersService.findOneByAuth0Id(userAuth0Id);
    if (!user) {
      throw new NotFoundException(`Usuario con Auth0 ID ${userAuth0Id} no encontrado.`);
    }

    if (user.roles?.includes('Profesor') || user.roles?.includes('maestro')) {
      // Encuentra clases donde el usuario es el maestro
      return this.classesRepository.find({
        where: { teacher: { id: user.id } }, // Asumiendo que `teacher` en Class es la entidad User completa o teacherId es el id del User
        relations: ['teacher', 'students'], // Carga también los alumnos de cada clase
      });
    } else if (user.roles?.includes('alumno')) {
      // Encuentra clases donde el usuario es un estudiante
      // Esto requiere que la entidad User tenga una relación `classes` que traiga las Class entities.
      // Y que Class entity cargue sus relaciones students (con { relations: ['students'] })
      // Para obtener las clases de un alumno:
      const userWithClasses = await this.usersRepository.findOne({
        where: { id: user.id },
        relations: ['classes', 'classes.teacher', 'classes.students'], // Carga las clases y sus maestros/alumnos
      });
      return userWithClasses?.classes || [];
    }
    // Padres, admins u otros roles podrían tener otra lógica
    return [];
  }

  async findById(id: string, userAuth0Id: string): Promise<Class> {
    const cls = await this.classesRepository.findOne({ where: {id}, relations: ['teacher', 'students']});
    if (!cls) {
        throw new NotFoundException(`Clase con ID ${id} no encontrada.`);
    }
    // Verificar si el usuario tiene acceso (es maestro o alumno de la clase)
    const user = await this.usersService.findOneByAuth0Id(userAuth0Id);
    if (!user) throw new NotFoundException('Usuario no encontrado.');

    const isTeacher = cls.teacher.id === user.id;
    const isStudent = cls.students.some(s => s.id === user.id);

    if (!isTeacher && !isStudent && !user.roles?.includes('admin')) { // Admin puede ver todo
        throw new ForbiddenException('No tienes acceso a esta clase.');
    }
    return cls;
  }


  async importClassesFromExcel(fileBuffer: Buffer, currentUserAuth0Id: string): Promise<{ created: number, updated: number, errors: any[] }> {
    this.logger.log(`Iniciando importación de clases para el usuario ${currentUserAuth0Id}`);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<ExcelClassRowDto>(worksheet);

    let createdCount = 0;
    let updatedCount = 0;
    const errors: any[] = [];

    const importingUser = await this.usersService.findOneByAuth0Id(currentUserAuth0Id);
    if (!importingUser || !importingUser.roles?.includes('Profesor')) { // O 'admin'
      throw new ForbiddenException('Solo maestros o administradores pueden importar clases.');
    }

    for (const row of jsonData) {
      try {
        if (!row.Clase || !row.Codigo || !row.Profesor) {
          errors.push({ row, error: 'Datos incompletos: Clase, Código y Maestro son requeridos.' });
          continue;
        }

        // 1. Maestro: Buscar o crear
        let teacher = await this.usersService.findOneByEmail(row.Profesor.trim());
        if (!teacher) {
          // Si el maestro no existe, ¿lo creamos? ¿O fallamos?
          // Por ahora, asumimos que el maestro debe existir o la fila da error si el importador no es ESE maestro
          // Si el importador es el maestro especificado en la fila:
          if (importingUser.email.toLowerCase() !== row.Profesor.trim().toLowerCase()) {
             errors.push({ row, error: `El maestro ${row.Profesor} no existe o no coincide con el usuario importador.` });
             continue;
          }
          teacher = importingUser; // El importador es el maestro
        } else {
            // Verificar que el maestro encontrado tenga el rol 'maestro'
            if(!teacher.roles?.includes('Profesor')){
                // Si no es maestro, ¿se le asigna el rol? o ¿error?
                // Por ahora, asumimos que debe serlo.
                errors.push({row, error: `El usuario ${teacher.email} no tiene el rol de maestro.`})
                continue;
            }
        }


        // 2. Clase: Buscar o crear
        let classEntity = await this.classesRepository.findOne({ where: { accessCode: row.Codigo.toString() } , relations: ['teacher', 'students']});
        if (classEntity) { // Actualizar
          if (classEntity.teacher.id !== teacher.id) {
            errors.push({ row, error: `El código de clase ${row.Codigo} ya existe y pertenece a otro maestro.` });
            continue;
          }
          classEntity.name = row.Clase;
          // classEntity.description = row.Description; // Si tienes description en el Excel
          updatedCount++;
        } else { // Crear
          classEntity = this.classesRepository.create({
            name: row.Clase,
            accessCode: row.Codigo.toString(),
            teacher: teacher,
            students: [],
          });
          createdCount++;
        }

        // 3. Alumnos
        const studentEmailsString = row.Alumnos?.toString() || '';
        const studentEmails = studentEmailsString.split(',').map(email => email.trim()).filter(email => email);
        const existingStudentsInClass = new Set(classEntity.students.map(s => s.email));


        if (studentEmails.length > 0) {
          for (const email of studentEmails) {
            if (existingStudentsInClass.has(email.toLowerCase())) continue; // Ya está en la clase

            let student = await this.usersService.findOneByEmail(email.toLowerCase());
            if (!student) {
              // Alumno no existe, ¿lo creamos? ¿o solo enviamos invitación?
              // Por ahora, crearemos un usuario placeholder o esperamos que Auth0 lo maneje
              // Si el usuario se registra vía Auth0 con este email, ya estará listo.
              // O podemos crear el usuario en Auth0 y luego en nuestra BD.
              // Por simplicidad, asumiremos que el usuario debe existir o se le invita.
              this.logger.log(`Alumno con email ${email} no encontrado. Se enviará invitación.`);
              // Podrías crear un usuario "pendiente" o solo confiar en la invitación.
            } else {
                if(!student.roles?.includes('alumno')){
                    errors.push({row, error: `El usuario ${student.email} existe pero no es un alumno.`})
                    continue;
                }
                classEntity.students.push(student);
            }
            // Enviar invitación por correo
            await this.sendgridService.sendClassInvitationEmail(email, classEntity.name, classEntity.accessCode, teacher.Nombre || teacher.email);
          }
        }
        await this.classesRepository.save(classEntity);

      } catch (error: any) {
        this.logger.error(`Error procesando fila de Excel para clase ${row.Clase}: ${error.message}`, error.stack);
        errors.push({ row: row.Clase, error: error.message });
      }
    }
    this.logger.log(`Importación finalizada. Creadas: ${createdCount}, Actualizadas: ${updatedCount}, Errores: ${errors.length}`);
    return { created: createdCount, updated: updatedCount, errors };
  }
}