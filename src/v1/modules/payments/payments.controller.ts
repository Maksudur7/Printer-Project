import { Controller, Get, Post, Body, Param, Res, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('init/:orderId')
  async initPayment(@Param('orderId') orderId: string) {
    return this.paymentsService.initPayment(orderId);
  }

  @Post('success')
  async paymentSuccess(@Body() body: any, @Res() res: any) {
    const result = await this.paymentsService.paymentSuccess(body);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/payment/success?orderId=${result.orderId}`);
  }

  @Post('fail')
  async paymentFail(@Body() body: any, @Res() res: any) {
    const result = await this.paymentsService.paymentFail(body);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/payment/fail?orderId=${result.orderId}`);
  }

  @Post('cancel')
  async paymentCancel(@Body() body: any, @Res() res: any) {
    const result = await this.paymentsService.paymentCancel(body);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/payment/fail?orderId=${result.orderId}`);
  }

  @Post('ipn')
  async paymentIpn(@Body() body: any) {
    return this.paymentsService.paymentIpn(body);
  }

  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}
