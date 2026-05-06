import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KioskModule } from './v1/modules/kiosk/kiosk.module';
import { OrderModule } from './v1/modules/order/order.module';
import { AuthModule } from './v1/modules/auth/auth.module';
import { PaymentsModule } from './v1/modules/payments/payments.module';
import { ConfigModule } from './v1/modules/config/config.module';

@Module({
  imports: [KioskModule, OrderModule, AuthModule, PaymentsModule, ConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
