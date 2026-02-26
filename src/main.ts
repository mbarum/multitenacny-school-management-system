import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001;

  // Serve the React frontend in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(join(__dirname, '..', 'client', 'dist')));
  }

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
