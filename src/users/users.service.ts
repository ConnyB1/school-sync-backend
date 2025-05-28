// proyecto/school-sync-backend/src/users/users.service.ts
import {
  Injectable,
  Logger,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Busca un usuario por ID y carga relaciones especificadas.
   */
  async findOneByIdWithRelations(id: string, relationsToLoad: string[]): Promise<User> {
    this.logger.debug(`Buscando usuario por ID con relaciones: ${id}, relaciones: ${relationsToLoad}`);
    if (!id) {
      this.logger.warn('findOneByIdWithRelations llamado con ID nulo o indefinido.');
      throw new BadRequestException('ID de usuario no proporcionado.');
    }
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: relationsToLoad,
    });
    if (!user) {
      this.logger.debug(`Usuario no encontrado con ID: ${id}`);
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }
    return user;
  }

  // Método findOneById actualizado para devolver el User completo (incluyendo relaciones si se requiere en el futuro)
  async findOneById(id: string): Promise<User> {
    this.logger.debug(`Buscando usuario por ID (entidad completa): ${id}`);
    if (!id) {
      this.logger.warn('findOneById llamado con ID nulo o indefinido.');
      throw new BadRequestException('ID de usuario no proporcionado.');
    }
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      this.logger.debug(`Usuario no encontrado con ID: ${id}`);
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }
    return user;
  }

  /**
   * Busca un usuario por ID y omite la contraseña en el resultado.
   */
  async findOneByIdWithoutPassword(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.findOneById(id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findOneByEmail(email: string): Promise<Omit<User, 'password'>> {
    this.logger.debug(`Buscando usuario por email: ${email}`);
    if (!email) {
      this.logger.warn('findOneByEmail llamado con email nulo o indefinido.');
      throw new BadRequestException('Email no proporcionado.');
    }
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      this.logger.debug(`Usuario no encontrado con email: ${email}`);
      throw new NotFoundException(`Usuario con email "${email}" no encontrado.`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByIdentifier(identifier: string): Promise<Omit<User, 'password'>> {
    this.logger.debug(`Buscando usuario por identificador (email): ${identifier}`);
    if (!identifier) {
      throw new BadRequestException('Identificador no proporcionado.');
    }
    const user = await this.usersRepository.findOne({ where: { email: identifier } });

    if (!user) {
      this.logger.warn(`Usuario no encontrado con identificador "${identifier}"`);
      throw new NotFoundException(`Usuario con identificador "${identifier}" no encontrado.`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findOneByEmailWithPassword(email: string): Promise<User | undefined> {
    this.logger.debug(`Buscando usuario por email (con contraseña) para login: ${email}`);
    if (!email) {
      this.logger.warn('findOneByEmailWithPassword llamado con email nulo o indefinido.');
      return undefined;
    }
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .getOne();

    if (!user) {
      this.logger.debug(`Usuario no encontrado para login con email: ${email}`);
      return undefined;
    }
    return user;
  }

  async createUserInternal(
    userData: Partial<User> & { password?: string; roles?: UserRole[] },
  ): Promise<Omit<User, 'password'>> {
    const { email, password, firstName, lastName, pictureUrl, roles } = userData;
    this.logger.log(`Intentando crear internamente usuario con email: ${email}`);

    if (!email || !password) {
      throw new BadRequestException('Email y contraseña son requeridos para crear un usuario.');
    }

    const existingUserCheck = await this.usersRepository.findOne({ where: { email } });
    if (existingUserCheck) {
      this.logger.warn(`Conflicto: El correo electrónico "${email}" ya está registrado.`);
      throw new ConflictException(`El correo electrónico "${email}" ya está registrado.`);
    }

    const newUserEntity = this.usersRepository.create({
      email,
      password,
      firstName,
      lastName,
      pictureUrl,
      roles: roles && roles.length > 0 ? roles : [UserRole.Alumno],
    });

    try {
      const savedUser = await this.usersRepository.save(newUserEntity);
      this.logger.log(`Usuario creado internamente con ID: ${savedUser.id}`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _omittedPassword, ...result } = savedUser;
      return result;
    } catch (error: any) {
      this.logger.error(`Error al guardar nuevo usuario: ${error.message}`, error.stack);
      if (error.code === '23505') {
        throw new ConflictException(`Error de unicidad: ${error.detail || 'El correo electrónico ya existe.'}`);
      }
      throw new InternalServerErrorException('Error interno al crear el usuario.');
    }
  }

  async createUser(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    this.logger.log(`createUser llamado con DTO: ${JSON.stringify(createUserDto)}`);
    if (createUserDto.password && !createUserDto.password.startsWith('$2a$') && !createUserDto.password.startsWith('$2b$')) {
      throw new BadRequestException(
        'UsersService.createUser no debe manejar contraseñas sin hashear. Use AuthService.register para el registro de usuarios.',
      );
    }
    return this.createUserInternal(createUserDto as Partial<User> & { password?: string; roles?: UserRole[] });
  }

  async linkParentToStudent(parentId: string, studentId: string): Promise<void> {
    this.logger.warn(
      `Intento de vinculación Padre ID: ${parentId}, Alumno ID: ${studentId}`,
    );
    const parent = await this.findOneByIdWithoutPassword(parentId);
    const student = await this.findOneByIdWithoutPassword(studentId);

    if (!parent.roles?.includes(UserRole.Padre) || !student.roles?.includes(UserRole.Alumno)) {
      throw new BadRequestException('Roles inválidos para la vinculación.');
    }
    this.logger.log(`Vinculación entre ${parent.email} y ${student.email} procesada (lógica pendiente).`);
  }

  async updateUserProfile(userId: string, updateData: Partial<Omit<User, 'password'>>): Promise<Omit<User, 'password'>> {
    this.logger.log(`Actualizando perfil para usuario ID: ${userId} con datos ${JSON.stringify(updateData)}`);
    
    const userToUpdate = await this.usersRepository.findOne({ where: { id: userId } });
    if (!userToUpdate) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado para actualizar.`);
    }

    if (updateData.firstName !== undefined) userToUpdate.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) userToUpdate.lastName = updateData.lastName;
    if (updateData.pictureUrl !== undefined) userToUpdate.pictureUrl = updateData.pictureUrl;

    try {
      const updatedUser = await this.usersRepository.save(userToUpdate);
      this.logger.log(`Perfil actualizado para usuario ID: ${updatedUser.id}`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _omittedPassword, ...result } = updatedUser;
      return result;
    } catch (error: any) {
      this.logger.error(`Error al actualizar perfil del usuario ${userId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al actualizar el perfil.');
    }
  }

  async getLinkedStudentsForParent(parentId: string): Promise<Array<Omit<User, 'password'>>> {
    this.logger.warn(
      `FUNCIONALIDAD NO IMPLEMENTADA: getLinkedStudentsForParent (Padre ID: ${parentId})`,
    );
    const parent = await this.findOneByIdWithoutPassword(parentId);
    if (!parent.roles?.includes(UserRole.Padre)) {
      throw new NotFoundException('Padre no encontrado o rol incorrecto.');
    }
    return [];
  }
}