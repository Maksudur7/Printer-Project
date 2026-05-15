import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Polyfills for Vercel
if (process.env.VERCEL) {
  (global as any).DOMMatrix = class {};
  (global as any).ImageData = class {};
  (global as any).Path2D = class {};
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // CORS Enable
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Static Assets
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads/',
  });

  const port = process.env.PORT || 5000;

  if (!process.env.VERCEL) {
    // 0.0.0.0 bypasses firewall issues for network access
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Server running on http://localhost:${port}`);
  } else {
    await app.init();
    return app.getHttpAdapter().getInstance();
  }
}

if (!process.env.VERCEL) {
  bootstrap();
}

export default async (req: any, res: any) => {
  const instance = await bootstrap();
  if (instance) {
    instance(req, res);
  }
};