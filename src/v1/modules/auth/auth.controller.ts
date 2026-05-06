import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /v1/auth/register
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // POST /v1/auth/login → returns { user, token }
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // GET /v1/auth/all-admins → Returns both pending and approved
  @Get('all-admins')
  getAll() {
    return this.authService.getAllAdmins();
  }

  // DELETE /v1/auth/user/:id → Remove a user
  @Post('delete-user/:id') // Using POST for compatibility if DELETE is restricted
  deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }

  // PATCH /v1/auth/user/:id → Update a user
  @Patch('user/:id')
  updateUser(@Param('id') id: string, @Body() body: any) {
    return this.authService.updateUser(id, body);
  }
}
