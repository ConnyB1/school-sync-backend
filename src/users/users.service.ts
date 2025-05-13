import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Auth0Service } from '../auth/auth0.service';

interface Auth0ProfileData {
  auth0Id: string;
  email: string;
  Nombre?: string;
  Apellido?: string;
  picture?: string;
  rolesFromAuth0?: string[];
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private auth0Service: Auth0Service,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ relations: ['classes', 'teachingClasses'] });
  }

  async findOneById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id }, relations: ['classes', 'teachingClasses'] });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOneByAuth0Id(auth0Id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { auth0Id }, relations: ['classes', 'teachingClasses', 'roles'] });
  }

  async findOrCreateByAuth0Profile(profileData: Auth0ProfileData): Promise<User> {
    this.logger.debug(`Buscando o creando usuario para Auth0 ID: ${profileData.auth0Id}`);
    let user = await this.usersRepository.findOne({ where: { auth0Id: profileData.auth0Id } });

    if (user) {
      this.logger.log(`Usuario encontrado localmente: ${user.id} para Auth0 ID: ${profileData.auth0Id}`);
      let updated = false;
      if (profileData.Nombre && user.Nombre !== profileData.Nombre) {
        user.Nombre = profileData.Nombre;
        updated = true;
      }
      if (profileData.Apellido && user.Apellido !== profileData.Apellido) {
        user.Apellido = profileData.Apellido;
        updated = true;
      }
      if (profileData.picture && user.picture !== profileData.picture) {
        user.picture = profileData.picture;
        updated = true;
      }
      if (profileData.rolesFromAuth0 && JSON.stringify(user.roles?.sort()) !== JSON.stringify(profileData.rolesFromAuth0.sort())) {
        this.logger.log(`Actualizando roles para usuario ${user.id}. Roles anteriores: ${user.roles?.join(', ')}. Nuevos roles de Auth0: ${profileData.rolesFromAuth0.join(', ')}`);
        user.roles = [...profileData.rolesFromAuth0].sort();
        updated = true;
      }
      if (updated) {
        try {
          await this.usersRepository.save(user);
          this.logger.log(`Usuario ${user.id} actualizado.`);
        } catch (error) {
          this.logger.error(`Error actualizando usuario ${user.id}: ${error.message}`, error.stack);
          throw new InternalServerErrorException('Error al actualizar el perfil del usuario.');
        }
      }
      return user;
    } else {
      this.logger.log(`Usuario no encontrado localmente para Auth0 ID: ${profileData.auth0Id}. Creando nuevo usuario.`);
      const newUser = this.usersRepository.create({
        auth0Id: profileData.auth0Id,
        email: profileData.email,
        Nombre: profileData.Nombre,
        Apellido: profileData.Apellido,
        picture: profileData.picture,
        roles: profileData.rolesFromAuth0 ? [...profileData.rolesFromAuth0].sort() : [],
      });

      try {
        const savedUser = await this.usersRepository.save(newUser);
        this.logger.log(`Nuevo usuario creado localmente con ID: ${savedUser.id} para Auth0 ID: ${profileData.auth0Id}`);
        return savedUser;
      } catch (error: any) {
        this.logger.error(`Error creando nuevo usuario: ${error.message}`, error.stack);
        if (error.code === '23505') {
          this.logger.warn(`Conflicto al crear usuario: Datos (ej. email) podrían ya existir. Auth0 ID: ${profileData.auth0Id}, Email: ${profileData.email}`);
          throw new BadRequestException('Error al crear usuario: Ya existe un usuario con datos similares.');
        }
        throw new InternalServerErrorException('Error al guardar el nuevo usuario.');
      }
    }
  }

  async linkParentToStudent(parentAuth0Id: string, studentAuth0Id: string): Promise<void> {
    this.logger.log(`Intentando vincular alumno ${studentAuth0Id} con padre ${parentAuth0Id}`);
    const managementClient = this.auth0Service.getManagementClient();

    try {
      // Verifica que ambos usuarios existan en Auth0
      const [parentUserAuth0, studentUserAuth0] = await Promise.all([
        managementClient.users.get({ id: parentAuth0Id }).catch(() => null),
        managementClient.users.get({ id: studentAuth0Id }).catch(() => null),
      ]);

      if (!parentUserAuth0) {
        this.logger.warn(`Padre con Auth0 ID ${parentAuth0Id} no encontrado en Auth0.`);
        throw new NotFoundException(`Padre con ID ${parentAuth0Id} no encontrado en Auth0.`);
      }
      if (!studentUserAuth0) {
        this.logger.warn(`Alumno con Auth0 ID ${studentAuth0Id} no encontrado en Auth0.`);
        throw new NotFoundException(`Alumno con ID ${studentAuth0Id} no encontrado en Auth0.`);
      }

      // Get current app_metadata for the parent
      const appMetadata = (parentUserAuth0 as any).app_metadata || {};
      const linkedStudents: string[] = appMetadata.linked_students || [];

      if (!linkedStudents.includes(studentAuth0Id)) {
        linkedStudents.push(studentAuth0Id);
        await managementClient.users.update(
          { id: parentAuth0Id },
          { app_metadata: { ...appMetadata, linked_students: linkedStudents } },
        );
        this.logger.log(`Alumno ${studentAuth0Id} vinculado exitosamente al padre ${parentAuth0Id} en Auth0.`);
      } else {
        this.logger.log(`Alumno ${studentAuth0Id} ya está vinculado al padre ${parentAuth0Id} en Auth0.`);
      }
    } catch (error: any) {
      this.logger.error(`Error vinculando padre ${parentAuth0Id} con alumno ${studentAuth0Id} vía Auth0: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Fallo al vincular padre con alumno vía Auth0.');
    }
  }

  async getLinkedStudentsForParent(parentAuth0Id: string): Promise<string[]> {
    this.logger.debug(`Obteniendo alumnos vinculados para el padre ${parentAuth0Id}`);
    const managementClient = this.auth0Service.getManagementClient();
    try {
      const parentResponse = await managementClient.users.get({ id: parentAuth0Id });
      const parent: any = parentResponse as any; // Cast to 'any' to access app_metadata
      return parent.app_metadata?.linked_students || [];
    } catch (error: any) {
      this.logger.error(`Error obteniendo alumnos vinculados para padre ${parentAuth0Id} desde Auth0: ${error.message}`, error.stack);
      if (error.statusCode === 404) {
        throw new NotFoundException(`Padre con Auth0 ID ${parentAuth0Id} no encontrado en Auth0.`);
      }
      throw new InternalServerErrorException('Error al obtener información del padre desde Auth0.');
    }
  }

  async create(userDto: Partial<User>): Promise<User> {
    this.logger.log(`Creando usuario manualmente: ${userDto.email}`);
    const newUser = this.usersRepository.create(userDto);
    try {
      return await this.usersRepository.save(newUser);
    } catch (error: any) {
      this.logger.error(`Error creando usuario manualmente: ${error.message}`, error.stack);
      if (error.code === '23505') {
        throw new BadRequestException('Usuario con este email o identificador ya existe.');
      }
      throw new InternalServerErrorException('Error al crear el usuario.');
    }
  }

  async update(id: string, userDto: Partial<User>): Promise<User> {
    this.logger.log(`Actualizando usuario con ID local: ${id}`);
    const userToUpdate = await this.findOneById(id);
    if (!userToUpdate) {
      this.logger.warn(`Intento de actualizar usuario no encontrado con ID local: ${id}`);
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }
    Object.assign(userToUpdate, userDto);

    try {
      await this.usersRepository.save(userToUpdate);
      return userToUpdate;
    } catch (error: any) {
      this.logger.error(`Error actualizando usuario con ID local ${id}: ${error.message}`, error.stack);
      if (error.code === '23505') {
        throw new BadRequestException('Error al actualizar: Los datos entran en conflicto con otro usuario.');
      }
      throw new InternalServerErrorException('Error al actualizar el usuario.');
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Eliminando usuario con ID local: ${id}`);
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado para eliminar.`);
    }
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      this.logger.warn(`Intento de eliminar usuario con ID local ${id} falló (affected rows = 0).`);
      throw new NotFoundException(`Usuario con ID ${id} no encontrado o ya eliminado.`);
    }
    this.logger.log(`Usuario con ID local ${id} eliminado.`);
  }
}