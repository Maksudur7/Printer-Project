import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { UpdateOrderDto } from './dto/update-order.dto';
const pdf = require('pdf-parse');
import * as fs from 'fs';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) { }

  async createOrder(data: any, file: Express.Multer.File) {
    // ১. পেজ সংখ্যা ডিটেক্ট করা (PDF হলে)
    let pageCount = parseInt(data.pageCount) || 1;

    if (file.mimetype === 'application/pdf') {
      try {
        const dataBuffer = fs.readFileSync(file.path);
        const pdfData = await pdf(dataBuffer);
        pageCount = pdfData.numpages;
      } catch (error) {
        console.error('Error parsing PDF:', error);
      }
    }

    // ২. প্রাইস ক্যালকুলেশন
    const isColor = String(data.isColor).toLowerCase() === 'true';
    const copyCount = parseInt(data.copyCount) || 1;

    // কালার ৫ টাকা, সাদাকালো ২ টাকা (ডিফল্ট)
    const rate = isColor ? (Number(process.env.PRICE_COLOR) || 5) : (Number(process.env.PRICE_BW) || 2);
    const totalAmount = pageCount * rate * copyCount;

    const appUrl = process.env.APP_URL || 'https://printer-project-two.vercel.app';
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
        isColor: isColor,
        isDuplex: String(data.isDuplex).toLowerCase() === 'true',
        orientation: data.orientation || 'portrait',
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