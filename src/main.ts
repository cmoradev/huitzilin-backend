import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { Decimal } from 'decimal.js';

import { setDefaultOptions } from 'date-fns';
import { es } from 'date-fns/locale';

setDefaultOptions({
  locale: es,
});

Decimal.set({
  precision: 14,
  rounding: Decimal.ROUND_HALF_UP,
});

// const validationPipe = new ValidationPipe({
//   whitelist: true,
//   forbidNonWhitelisted: true,
// });

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors();

  // app.useGlobalPipes(validationPipe);

  await app.listen(process.env.PORT ?? 3000);

  logger.log(`Application is running on: ${await app.getUrl()}`);
}

void bootstrap();
