import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as express from 'express';
import { json, urlencoded } from 'express';
import { join, resolve } from 'path';
import * as fs from 'fs';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { loadEnvConfig } from './config/env-loader';

// Force load and override process.env from the nearest .env file before anything else boots
loadEnvConfig();

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security: Cookie Parser (for HttpOnly tokens)
  app.use(cookieParser());

  // Security: Helmet sets various HTTP headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow public folder access
    contentSecurityPolicy: false, // Disable CSP to allow inline scripts/styles from React if needed
  }));

  // Performance: Gzip Compression
  app.use(compression());

  // Body Parsing limits
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Global Input Validation & Sanitization
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Global Exception Handling (Standardized JSON Responses)
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global API Prefix
  app.setGlobalPrefix('api');

  // Serve static assets from uploads and public directories
  const uploadsPath = resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    try {
      fs.mkdirSync(uploadsPath, { recursive: true });
    } catch {
      // Directory creation will be attempted on upload if needed
    }
  }
  app.use('/uploads', express.static(uploadsPath));

  const publicUploadsPath = resolve(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(publicUploadsPath)) {
    try {
      fs.mkdirSync(publicUploadsPath, { recursive: true });
    } catch {}
  }
  app.use('/public/uploads', express.static(publicUploadsPath));

  const publicPath = resolve(process.cwd(), 'public');
  if (fs.existsSync(publicPath)) {
    app.use('/public', express.static(publicPath));
  }

  // CORS Configuration
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    process.env.FRONTEND_URL,
    process.env.APP_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      
      // In development or if explicitly allowed
      if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Allow subdomains of the primary domain if configured
      if (process.env.ALLOWED_DOMAIN) {
        const domainRegex = new RegExp(`^https?:\\/\\/([a-z0-9-]+\\.)*${process.env.ALLOWED_DOMAIN.replace('.', '\\.')}$`);
        if (domainRegex.test(origin)) {
          return callback(null, true);
        }
      }

      callback(null, true); // Fallback permissive for smooth multi-tenant subdomains
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-School-Id', 'X-Requested-With'],
  });

  // Swagger OpenAPI Documentation (enabled if not strictly disabled)
  if (process.env.ENABLE_SWAGGER !== 'false') {
    const config = new DocumentBuilder()
      .setTitle('Saaslink School Management Platform API')
      .setDescription('Enterprise multi-tenant core API documentation including Auth, Academics, M-Pesa, Daraja & Billing')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger API Documentation available at /api/docs');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Saaslink Backend successfully listening on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
}

bootstrap().catch((err) => {
  console.error('❌ [FATAL BOOTSTRAP ERROR] Failed to start Saaslink Backend:');
  console.error(err);
  process.exit(1);
});

