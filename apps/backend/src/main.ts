/**
 * GWONS_CREATIVE — Backend Entry Point
 * NestJS + Fastify 기반 REST API 서버
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // CORS 설정
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // 전역 Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   GWONS_CREATIVE API Server              ║
  ║   Port: ${port}                              ║
  ║   Env:  ${process.env.NODE_ENV || 'development'}                  ║
  ╚══════════════════════════════════════════╝
  `);
}

bootstrap().catch(console.error);
