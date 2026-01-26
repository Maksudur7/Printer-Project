import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateKioskDto } from './dto/create-kiosk.dto';
import { PrismaService } from 'src/v1/shared/prisma/prisma.service';
import { UpdateKioskStatusDto } from './dto/update-kiosk.dto';
import * as QRCode from 'qrcode';

@Injectable()
export class KioskService {
  constructor(private prisma: PrismaService) { }

  // ১. Notun Kiosk Register kora ebong QR Code banano
  async create(createKioskDto: CreateKioskDto) {
    const { name, deviceId, location } = createKioskDto;
    console.log('hit service');
    // QR Code-er bhetore thakbe backend ba frontend-er URL
    const uploadUrl = `https://smartprint.com/upload?deviceId=${deviceId}`;
    console.log('hit service 2');
    const qrCodeDataUrl = await QRCode.toDataURL(uploadUrl);
    console.log('hit service 3');
    // const qrCodeDataUrl = await 

    return this.prisma.kiosk.create({
      data: {
        name,
        deviceId,
        location,
        qrCodeUrl: qrCodeDataUrl,
        status: 'ONLINE',
      },
    });
  }

  // ২. Heartbeat Update (Machine active ache ki na)
  async updateHeartbeat(deviceId: string) {
    const kiosk = await this.prisma.kiosk.findUnique({ where: { deviceId } });
    if (!kiosk) throw new NotFoundException('Kiosk not found');

    return this.prisma.kiosk.update({
      where: { deviceId },
      data: {
        lastHeartbeat: new Date(),
        status: 'ONLINE'
      },
    });
  }

  // ৩. Paper ba Ink level update kora (Hardware theke ashbe)
  async updateStatus(deviceId: string, updateDto: UpdateKioskStatusDto) {
    return this.prisma.kiosk.update({
      where: { deviceId },
      data: {
        status: updateDto.status,
        paperLevel: updateDto.paperLevel,
        inkLevel: updateDto.inkLevel,
      },
    });
  }

  // ৪. Sob Kiosk dekha
  async findAll() {
    return this.prisma.kiosk.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // ৫. Single Kiosk details
  async findOne(deviceId: string) {
    const kiosk = await this.prisma.kiosk.findUnique({ where: { deviceId } });
    if (!kiosk) throw new NotFoundException('Kiosk not found');
    return kiosk;
  }
}