import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/v1/shared/prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: any;
  private readonly appUrl = process.env.APP_URL || 'http://localhost:5000';
  private readonly frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-01-27' as any,
    });
  }

  async initPayment(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === 'COMPLETED') {
      throw new BadRequestException('Order is already paid');
    }

    // Stripe checkout session তৈরি করা
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'bdt',
              product_data: {
                name: `Printing Service - Order #${order.id.slice(0, 8)}`,
                description: `File: ${order.fileName}, Pages: ${order.pageCount}`,
              },
              unit_amount: Math.round((order.totalAmount || 0) * 100), // Stripe expects amount in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${this.appUrl}/v1/payments/success?session_id={CHECKOUT_SESSION_ID}&orderId=${orderId}`,
        cancel_url: `${this.frontendUrl}/checkout?orderId=${orderId}&status=cancelled`,
        metadata: {
          orderId: orderId,
        },
      });

      // পেমেন্ট রেকর্ড তৈরি করা
      await this.prisma.payment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount || 0,
          method: 'STRIPE',
          transactionId: session.id, 
        },
      });

      return {
        url: session.url,
      };
    } catch (error) {
      throw new BadRequestException(`Stripe Error: ${error.message}`);
    }
  }

  async paymentSuccess(payload: any) {
    const { session_id, orderId } = payload;

    try {
      // ১. সেশন ভেরিফাই করা
      const session = await this.stripe.checkout.sessions.retrieve(session_id);

      if (session.payment_status === 'paid') {
        // ২. অর্ডার এবং পেমেন্ট স্ট্যাটাস আপডেট করা
        await this.prisma.$transaction(async (prisma) => {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'COMPLETED',
              printStatus: 'QUEUED',
              paidAmount: (session.amount_total || 0) / 100, // cents to BDT
            },
          });
        });
        
        return { message: 'Payment successful', orderId };
      }
      
      throw new BadRequestException('Payment not completed');
    } catch (error) {
      throw new BadRequestException(`Stripe Verification Error: ${error.message}`);
    }
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
