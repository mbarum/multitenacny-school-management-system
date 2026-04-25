import 'module-alias/register';
import 'reflect-metadata';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import * as fs from 'fs';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('SaaSLink Application Starting - VERSION: 1.0.9-GLOBAL-AUTH-FIX');

  const app = await NestFactory.create(AppModule, new ExpressAdapter(), {
    cors: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip away properties that do not have any decorators
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted values are provided
      transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
    }),
  );
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
          ],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: [
            "'self'",
            'data:',
            'https://picsum.photos',
            'https://fastly.picsum.photos',
            'https://*.stripe.com',
          ],
          connectSrc: ["'self'", 'https://api.stripe.com'],
          frameSrc: ["'self'", 'https://js.stripe.com'],
        },
      },
    }),
  );

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  // Request logging middleware
  app.use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    },
  );

  const configService = app.get(ConfigService);
  const port = process.env.PORT || configService.get<number>('PORT') || 3000;
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  app.enableCors({
    origin: frontendUrl || true,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Serve the React frontend
  const clientDistPath = join(process.cwd(), 'client-dist');
  const fallbackClientDistPath = join(__dirname, '..', 'client-dist');
  
  const finalClientDistPath = fs.existsSync(clientDistPath) 
    ? clientDistPath 
    : fs.existsSync(fallbackClientDistPath) 
      ? fallbackClientDistPath 
      : null;

  if (finalClientDistPath) {
    console.log(`[Static] Serving frontend from: ${finalClientDistPath}`);
    app.use(express.static(finalClientDistPath));
    app.use(
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        if (req.originalUrl.startsWith('/api')) {
          return next();
        }

        const indexPath = join(finalClientDistPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          next();
        }
      },
    );
  } else {
    console.error('[Static] Critical Error: client-dist folder not found. Frontend will not be served.');
  }

  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}`);
}
bootstrap().catch((err) => {
  console.error('Error during bootstrap', err);
  process.exit(1);
});
