import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { KioskService } from './kiosk.service';
import { CreateKioskDto } from './dto/create-kiosk.dto';
import { UpdateKioskStatusDto } from './dto/update-kiosk.dto';
import { KioskStatus } from '@prisma/client';

@Controller('v1/kiosk')
export class KioskController {
  constructor(private readonly kioskService: KioskService) {}

  @Post('register')
  create(@Body() createKioskDto: CreateKioskDto) {
    return this.kioskService.create(createKioskDto);
  }

  // --- ADMIN ENDPOINTS ---
  @Get('admin/stats')
  getAdminStats() {
    return this.kioskService.getDashboardStats();
  }

  @Patch('admin/toggle/:deviceId')
  adminToggle(@Param('deviceId') deviceId: string, @Body('status') status: KioskStatus) {
    return this.kioskService.adminToggleStatus(deviceId, status);
  }
  // -----------------------

  @Get('all')
  findAll() {
    return this.kioskService.findAll();
  }

  @Get(':deviceId')
  findOne(@Param('deviceId') deviceId: string) {
    return this.kioskService.findOne(deviceId);
  }

  @Patch(':deviceId/heartbeat')
  heartbeat(@Param('deviceId') deviceId: string) {
    return this.kioskService.updateHeartbeat(deviceId);
  }

  @Patch(':deviceId/status')
  updateStatus(
    @Param('deviceId') deviceId: string,
    @Body() updateDto: UpdateKioskStatusDto
  ) {
    return this.kioskService.updateStatus(deviceId, updateDto);
  }
}