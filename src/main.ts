import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip away properties that do not have any decorators
    forbidNonWhitelisted: true, // Throw an error if non-whitelisted values are provided
    transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
  }));
  app.use(helmet());

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001;
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // Serve the React frontend in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(join(__dirname, '..', 'client', 'dist')));
  }

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
