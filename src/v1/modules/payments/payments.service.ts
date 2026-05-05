import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/v1/shared/prisma/prisma.service';
import * as SSLCommerzPayment from 'sslcommerz-lts';

@Injectable()
export class PaymentsService {
  private readonly storeId = process.env.SSLCOMMERZ_STORE_ID;
  private readonly storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
  private readonly isLive = process.env.SSLCOMMERZ_IS_LIVE === 'true';
  private readonly appUrl = process.env.APP_URL || 'http://localhost:5000';

  constructor(private readonly prisma: PrismaService) {}

  async initPayment(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === 'COMPLETED') {
      throw new BadRequestException('Order is already paid');
    }

    const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const data = {
      total_amount: order.totalAmount || 0,
      currency: 'BDT',
      tran_id: transactionId,
      success_url: `${this.appUrl}/v1/payments/success`,
      fail_url: `${this.appUrl}/v1/payments/fail`,
      cancel_url: `${this.appUrl}/v1/payments/cancel`,
      ipn_url: `${this.appUrl}/v1/payments/ipn`,
      shipping_method: 'No',
      product_name: 'Printing Service',
      product_category: 'Service',
      product_profile: 'general',
      cus_name: order.userId || 'Guest User',
      cus_email: order.userEmail || 'guest@example.com',
      cus_add1: 'Dhaka',
      cus_add2: 'Dhaka',
      cus_city: 'Dhaka',
      cus_state: 'Dhaka',
      cus_postcode: '1000',
      cus_country: 'Bangladesh',
      cus_phone: order.userPhone || '01700000000',
      cus_fax: order.userPhone || '01700000000',
      ship_name: 'Guest User',
      ship_add1: 'Dhaka',
      ship_add2: 'Dhaka',
      ship_city: 'Dhaka',
      ship_state: 'Dhaka',
      ship_postcode: 1000,
      ship_country: 'Bangladesh',
      value_a: orderId, // Passing order ID to retrieve in callback
    };

    // Store pending payment in DB
    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.totalAmount || 0,
        method: 'SSLCOMMERZ',
        transactionId: transactionId,
      },
    });

    const sslcz = new SSLCommerzPayment(this.storeId, this.storePassword, this.isLive);
    try {
      const apiResponse = await sslcz.init(data);
      if (apiResponse?.GatewayPageURL) {
        return {
          url: apiResponse.GatewayPageURL,
        };
      }
      throw new BadRequestException('Failed to initialize payment gateway');
    } catch (error) {
      throw new BadRequestException(`SSLCommerz Error: ${error.message}`);
    }
  }

  async paymentSuccess(payload: any) {
    const transactionId = payload.tran_id;
    const orderId = payload.value_a; // we passed this in init

    // 1. Verify with SSLCommerz (validate)
    const sslcz = new SSLCommerzPayment(this.storeId, this.storePassword, this.isLive);
    const validation = await sslcz.validate({ val_id: payload.val_id });

    if (validation.status === 'VALID' || validation.status === 'VALIDATED') {
      // 2. Update Order and Payment status
      await this.prisma.$transaction(async (prisma) => {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'COMPLETED',
            printStatus: 'QUEUED', // move to printing queue
            paidAmount: parseFloat(payload.amount),
          },
        });
        
        // Ensure payment method correctly tracks transaction
        // (Assuming you have a way to link transaction, though in schema transactionId is unique)
      });
      return { message: 'Payment successful', orderId };
    }

    throw new BadRequestException('Payment validation failed');
  }

  async paymentFail(payload: any) {
    const orderId = payload.value_a;
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'FAILED',
      },
    });
    return { message: 'Payment failed', orderId };
  }

  async paymentCancel(payload: any) {
    const orderId = payload.value_a;
    // Don't change printStatus, just leave it as waiting or cancel if required.
    return { message: 'Payment cancelled by user', orderId };
  }

  async paymentIpn(payload: any) {
    // Similar to success validation but done quietly in the background
    const orderId = payload.value_a;
    if (payload.status === 'VALID') {
      const sslcz = new SSLCommerzPayment(this.storeId, this.storePassword, this.isLive);
      const validation = await sslcz.validate({ val_id: payload.val_id });

      if (validation.status === 'VALID' || validation.status === 'VALIDATED') {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (order && order.paymentStatus !== 'COMPLETED') {
           await this.prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'COMPLETED',
              printStatus: 'QUEUED',
              paidAmount: parseFloat(payload.amount),
            },
          });
        }
      }
    }
    return { message: 'IPN received' };
  }

  // To fetch all payments (admin use)
  async findAll() {
    return this.prisma.payment.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }
}
