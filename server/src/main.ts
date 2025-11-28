
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as express from 'express';
import { json, urlencoded } from 'express';
import { join, resolve } from 'path';
import * as fs from 'fs';
import helmet from 'helmet';
import * as compression from 'compression';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security: Helmet sets various HTTP headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow public folder access
    contentSecurityPolicy: false, // Disable CSP to allow inline scripts/styles from React if needed
  }));

  // Performance: Compression
  app.use(compression());

  // CORS: Dynamic Configuration
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? [frontendUrl] 
      : true, // Allow all in development
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global Prefix for API versioning
  app.setGlobalPrefix('api');

  // Increase payload size limits
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  
  // Ensure public/uploads directory exists
  const uploadDir = join(resolve('.'), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Serve static assets (uploads)
  app.use('/public', express.static(join(resolve('.'), 'public')));

  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Register Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`Frontend URL configured as: ${frontendUrl}`);
}
bootstrap();
