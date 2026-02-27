import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KioskModule } from './v1/modules/kiosk/kiosk.module';
import { PrismaService } from './v1/shared/prisma/prisma.service';
import { OrderModule } from './v1/modules/order/order.module';
import { PaymentsModule } from './v1/modules/payments/payments.module';

@Module({
  imports: [KioskModule, OrderModule, PaymentsModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
