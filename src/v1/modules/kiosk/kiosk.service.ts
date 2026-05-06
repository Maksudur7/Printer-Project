import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateKioskDto } from './dto/create-kiosk.dto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { UpdateKioskStatusDto } from './dto/update-kiosk.dto';
import * as QRCode from 'qrcode';
import { KioskStatus } from '@prisma/client';

@Injectable()
export class KioskService {
  constructor(private prisma: PrismaService) { }

  async create(createKioskDto: CreateKioskDto) {
    const { name, deviceId, location } = createKioskDto;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const targetUrl = `${frontendUrl}/upload?deviceId=${deviceId}`;

    const qrCodeImage = await QRCode.toDataURL(targetUrl);

    return this.prisma.kiosk.create({
      data: {
        name,
        deviceId,
        location,
        qrCodeUrl: qrCodeImage,
        status: 'ONLINE',
      },
    });
  }

  // ২. Heartbeat Update
  async updateHeartbeat(deviceId: string) {
    const kiosk = await this.prisma.kiosk.findUnique({ where: { deviceId } });
    if (!kiosk) throw new NotFoundException('Kiosk not found');

    // If device was forced OFFLINE by admin, don't auto-online it
    if (kiosk.status === 'MAINTENANCE' || kiosk.status === 'OFFLINE') {
        return kiosk;
    }

    return this.prisma.kiosk.update({
      where: { deviceId },
      data: {
        lastHeartbeat: new Date(),
        status: 'ONLINE',
      },
    });
  }

  // ৩. Paper ba Ink level update (Hardware/System theke ashbe)
  async updateStatus(deviceId: string, updateDto: UpdateKioskStatusDto) {
    let finalStatus: KioskStatus = updateDto.status as KioskStatus || 'ONLINE';

    // --- AUTO-OFF LOGIC ---
    if (updateDto.paperLevel !== undefined && updateDto.paperLevel < 5) {
        finalStatus = 'OUT_OF_PAPER';
    } else if (updateDto.inkLevel !== undefined && updateDto.inkLevel < 5) {
        finalStatus = 'OUT_OF_INK';
    }

    return this.prisma.kiosk.update({
      where: { deviceId },
      data: {
        status: finalStatus,
        paperLevel: updateDto.paperLevel,
        inkLevel: updateDto.inkLevel,
        lastError: updateDto.status === 'SYSTEM_ERROR' ? 'Hardware Failure' : null
      },
    });
  }

  // Admin manually toggles status
  async adminToggleStatus(deviceId: string, status: KioskStatus) {
    return this.prisma.kiosk.update({
        where: { deviceId },
        data: { status }
    });
  }

  // Admin Dashboard Statistics
  async getDashboardStats() {
    const kiosks = await this.prisma.kiosk.findMany();
    const online = kiosks.filter(k => k.status === 'ONLINE').length;
    const errors = kiosks.filter(k => ['OUT_OF_PAPER', 'OUT_OF_INK', 'SYSTEM_ERROR'].includes(k.status)).length;
    const totalRev = kiosks.reduce((acc, k) => acc + (k.totalRevenue || 0), 0);

    return {
        totalDevices: kiosks.length,
        onlineCount: online,
        errorCount: errors,
        totalRevenue: totalRev,
        devices: kiosks
    };
  }

  async findAll() {
    return this.prisma.kiosk.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(deviceId: string) {
    const kiosk = await this.prisma.kiosk.findUnique({ where: { deviceId } });
    if (!kiosk) throw new NotFoundException('Kiosk not found');
    return kiosk;
  }
};