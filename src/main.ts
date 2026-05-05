import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';

let cachedApp: NestExpressApplication;

async function bootstrap(): Promise<NestExpressApplication> {
  // Cache the app instance for serverless reuse (Vercel)
  if (cachedApp) {
    return cachedApp;
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Enable CORS for frontend communication
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Static assets শুধু local env এ (Vercel এ /uploads নেই)
  if (process.env.NODE_ENV !== 'production') {
    const { join } = await import('path');
    app.useStaticAssets(join(__dirname, '..', 'uploads'));
  }

  await app.init();

  cachedApp = app;
  return app;
}

// Local development: server হিসেবে চালাও
if (process.env.NODE_ENV !== 'production') {
  bootstrap().then(async (app) => {
    const port = process.env.PORT || 5000;
    await app.listen(port);
    console.log(`-----------------------------------------------`);
    console.log(`🚀 Server is running at: http://localhost:${port}`);
    console.log(`-----------------------------------------------`);
  });
}

// Vercel Serverless Function export
module.exports = async (req: any, res: any) => {
  const app = await bootstrap();
  const httpAdapter = app.getHttpAdapter();
  const instance = httpAdapter.getInstance();
  instance(req, res);
};