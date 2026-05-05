import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/v1/shared/prisma/prisma.service';
// তোমার DTO গুলো ব্যবহার করা ভালো, আমি জাস্ট লজিকটা ক্লিন করে দিচ্ছি
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) { }

  async createOrder(data: any, file: Express.Multer.File) {
    const pricePerPage = Number(process.env.PRICE_PER_PAGE) || 5;
    const pageCount = parseInt(data.pageCount) || 1;
    const copyCount = parseInt(data.copyCount) || 1;
    const totalAmount = pageCount * pricePerPage * copyCount;

    const appUrl = process.env.APP_URL || 'http://localhost:5000';
    const fileUrl = `${appUrl}/${file.filename}`;

    return await this.prisma.order.create({
      data: {
        userId: data.userId,
        userEmail: data.userEmail,
        userPhone: data.userPhone,
        kioskId: data.kioskId,
        filePath: file.path,
        fileName: file.originalname,
        fileUrl: fileUrl,
        pageCount: pageCount,
        copyCount: copyCount,
        isColor: String(data.isColor).toLowerCase() === 'true',
        totalAmount: totalAmount,
        paymentStatus: 'PENDING',
        printStatus: 'WAITING_FOR_PAYMENT',
      },
    });
  }

  async getPendingOrders(kioskId: string) {
    return await this.prisma.order.findMany({
      where: {
        kioskId,
        printStatus: 'WAITING_FOR_PAYMENT',
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAll() {
    return this.prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus !== 'COMPLETED') {
      throw new ForbiddenException('Please complete your payment before updating order status');
    }

    return await this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.order.delete({ where: { id } });
  }
};