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

  // GET /v1/auth/pending-admins → Used by frontend admin/users page
  @Get('pending-admins')
  getPending() {
    return this.authService.getPendingAdmins();
  }

  // POST /v1/auth/approve-admin/:id → Used by frontend to approve/reject
  @Post('approve-admin/:id')
  approve(@Param('id') id: string, @Body('approve') approve: boolean) {
    if (approve) {
      return this.authService.approveAdmin(id);
    }
    // Reject: simply return a message (or delete user)
    return { message: 'Request rejected.' };
  }
}
