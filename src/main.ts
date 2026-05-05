import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { Express } from 'express';

let cachedServer: any;

async function bootstrap(): Promise<any> {
  if (cachedServer) {
    return cachedServer;
  }

  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn', 'log', 'debug'],
    });

    app.enableCors({
      origin: true, // Allow all for debugging
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();
    
    cachedServer = app.getHttpAdapter().getInstance();
    return cachedServer;
  } catch (error) {
    console.error('CRITICAL BOOTSTRAP ERROR:', error);
    throw error;
  }
}

// For Vercel Serverless
export default async (req: any, res: any) => {
  try {
    const server = await bootstrap();
    return server(req, res);
  } catch (err: any) {
    console.error('Serverless Function Crash:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// For Local Development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  async function startLocal() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.enableCors();
    const port = process.env.PORT || 5000;
    await app.listen(port);
    console.log(`🚀 Local server running at http://localhost:${port}`);
  }
  startLocal();
}