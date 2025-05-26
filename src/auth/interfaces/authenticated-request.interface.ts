import { Request } from 'express';
import { User } from '../../users/user.entity'; // Ajusta la ruta

export interface AuthenticatedRequest extends Request {
  user: Omit<User, 'password'>;
}