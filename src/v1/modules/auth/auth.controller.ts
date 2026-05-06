import { Controller, Post, Body, Get, Patch, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('pending')
  getPending() {
    return this.authService.getPendingAdmins();
  }

  @Patch('approve/:id')
  approve(@Param('id') id: string) {
    return this.authService.approveAdmin(id);
  }
}
