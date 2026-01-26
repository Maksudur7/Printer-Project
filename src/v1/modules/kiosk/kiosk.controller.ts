import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { KioskService } from './kiosk.service';
import { CreateKioskDto } from './dto/create-kiosk.dto';
import { UpdateKioskStatusDto } from './dto/update-kiosk.dto';

@Controller('v1/kiosk')
export class KioskController {
  constructor(private readonly kioskService: KioskService) {}

  @Post('register')
  create(@Body() createKioskDto: CreateKioskDto) {
    return this.kioskService.create(createKioskDto);
  }

  @Get('all')
  findAll() {
    return this.kioskService.findAll();
  }

  @Get(':deviceId')
  findOne(@Param('deviceId') deviceId: string) {
    return this.kioskService.findOne(deviceId);
  }

  // Hardware ping pathabe ekhane
  @Patch(':deviceId/heartbeat')
  heartbeat(@Param('deviceId') deviceId: string) {
    return this.kioskService.updateHeartbeat(deviceId);
  }

  // Machine status update (e.g. paper low)
  @Patch(':deviceId/status')
  updateStatus(
    @Param('deviceId') deviceId: string, 
    @Body() updateDto: UpdateKioskStatusDto
  ) {
    return this.kioskService.updateStatus(deviceId, updateDto);
  }
}