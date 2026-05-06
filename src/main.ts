import 'dotenv/config';
// Polyfills/Mocks for pdf-parse to prevent crash on Vercel
if (process.env.VERCEL) {
  (global as any).DOMMatrix = class {};
  (global as any).ImageData = class {};
  (global as any).Path2D = class {};
  (global as any).CanvasGradient = class {};
  (global as any).CanvasPattern = class {};
  (global as any).CanvasRenderingContext2D = class {};
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';

let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    
    app.enableCors();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();
    cachedApp = app.getHttpAdapter().getInstance();
  }
  return cachedApp;
}

export default async (req: any, res: any) => {
  const app = await bootstrap();
  app(req, res);
};

// Local development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  bootstrap().then(async () => {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    await app.listen(process.env.PORT || 5000);
    console.log(`🚀 Local server running at http://localhost:${process.env.PORT || 5000}`);
  });
}