// proyecto/school-sync-backend/src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException, InternalServerErrorException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';
import { UsersService } from '../users/users.service';

interface Auth0Payload {
  iss: string;
  sub: string;
  aud: string[] | string;
  iat: number;
  exp: number;
  azp: string;
  scope: string;
  permissions?: string[];
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: any; // Para capturar claims personalizados como los de roles
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  private readonly rolesNamespace: string;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {
    const issuerUrl = configService.get<string>('AUTH0_ISSUER_URL');
    const audience = configService.get<string>('AUTH0_AUDIENCE');

    // Check for required config before calling super, but do not use 'this'
    if (!issuerUrl) {
      throw new Error('AUTH0_ISSUER_URL no está configurado en las variables de entorno.');
    }
    if (!audience) {
      throw new Error('AUTH0_AUDIENCE no está configurado en las variables de entorno.');
    }

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${issuerUrl}.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: audience, // Usar la variable verificada
      issuer: issuerUrl,   // Usar la variable verificada
      algorithms: ['RS256'],
    });

    this.logger.log(`JwtStrategy inicializada con Issuer: ${issuerUrl}, Audience: ${audience}`);

    // Define el namespace completo de Auth0 para los roles
    // Este debe coincidir con cómo lo configuraste en tus Reglas de Auth0
    this.rolesNamespace = this.configService.get<string>('AUTH0_ROLES_NAMESPACE') || 'https://schoolsync.example.com/'; 
    this.logger.log(`Namespace para roles/email/name: ${this.rolesNamespace}`);
  }

  async validate(payload: Auth0Payload): Promise<any> {
    this.logger.log('--------- INICIO VALIDATE JWT ---------');
    this.logger.debug(`Payload recibido en JwtStrategy: ${JSON.stringify(payload)}`);

    const auth0Id = payload.sub;
    if (!auth0Id) {
      this.logger.warn('Token inválido: sub (Auth0 User ID) no encontrado en el payload.');
      throw new UnauthorizedException('Token inválido: Identificador de usuario no encontrado.');
    }

    // Intenta obtener email, name, picture y roles usando el namespace si están presentes
    // o los campos estándar si no.
    const email = payload.email || payload[`${this.rolesNamespace}email`];
    const name = payload.name || payload[`${this.rolesNamespace}name`]; // O el claim específico que uses para el nombre
    const picture = payload.picture || payload[`${this.rolesNamespace}picture`]; // O el claim específico para la foto
    const auth0Roles = payload[`${this.rolesNamespace}roles`] || [];

    this.logger.debug(`Auth0 ID: ${auth0Id}, Email: ${email}, Name: ${name}, Roles: ${JSON.stringify(auth0Roles)}`);

    try {
      const localUser = await this.usersService.findOrCreateByAuth0Profile({
        auth0Id,
        email: email as string, // Asegúrate de que email sea string
        Nombre: name, // Asumiendo que tu entidad User tiene 'Nombre'
        picture,
        rolesFromAuth0: auth0Roles,
      });

      if (!localUser) {
        this.logger.error(`No se pudo encontrar o crear el usuario local para Auth0 ID: ${auth0Id}`);
        throw new UnauthorizedException('Usuario no encontrado o no se pudo sincronizar.');
      }
      
      this.logger.log(`Usuario local encontrado/creado: ${localUser.id} - ${localUser.email}`);
      this.logger.log('--------- FIN VALIDATE JWT EXITOSO ---------');
      return {
        userId: localUser.id,       // ID de tu base de datos local
        auth0UserId: localUser.auth0Id, // ID de Auth0 (sub)
        email: localUser.email,
        roles: localUser.roles,       // Roles de tu base de datos local (sincronizados)
        nombre: localUser.Nombre,
        apellido: localUser.Apellido,
        picture: localUser.picture,
        // Puedes añadir más campos del usuario local aquí si los necesitas en req.user
      };
    } catch (error) {
      this.logger.error(`Error durante la validación del usuario y sincronización: ${error.message}`, error.stack);
      this.logger.log('--------- FIN VALIDATE JWT CON ERROR ---------');
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error procesando la autenticación del usuario.');
    }
  }
}