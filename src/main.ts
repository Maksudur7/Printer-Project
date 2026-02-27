import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  console.log('i am into main');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'uploads'));

  const port = process.env.PORT || 5000; // নিশ্চিত করছি আমরা ৫০০১ বা ৫০০০ এ চালাচ্ছি

  await app.listen(port);

  // সরাসরি পোর্ট নাম্বার প্রিন্ট করো যাতে কনফিউশন না থাকে
  console.log(`-----------------------------------------------`);
  console.log(`🚀 Server is booming at: http://localhost:${port}`);
  console.log(`-----------------------------------------------`);
}
bootstrap();