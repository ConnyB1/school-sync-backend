// En un futuro proyecto/school-sync-backend/src/users/users.controller.ts
import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { LinkStudentDto } from './dto/link-student.dto'; // Asume que creas este DTO

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Post('link-student')
  @HttpCode(HttpStatus.OK)
  async linkStudentToParent(@Request() req, @Body() linkStudentDto: LinkStudentDto) {
    // req.user contendrá el payload del JWT, incluyendo el auth0Id del padre
    const parentAuth0Id = req.user.auth0UserId; // Asegúrate que auth0UserId esté en el payload del token
    await this.usersService.linkParentToStudent(parentAuth0Id, linkStudentDto.studentAuth0Id);
    return { message: 'Alumno vinculado exitosamente.' };
  }
}