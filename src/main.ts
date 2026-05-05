import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

const configService = app.get(ConfigService);
const frontendUrl = configService.get<string>('FRONTEND_URL');

app.enableCors({
  origin: frontendUrl,
  credentials: true,
});

app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));

const port = configService.get<number>('PORT') ?? 3000;


  const swaggerConfig = new DocumentBuilder()
    .setTitle('Weekly Narrator API')
    .setDescription(
      'API for GitHub authentication, repository activity, and weekly changelog generation',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, swaggerDocument);

  await app.listen(port);
}
bootstrap();
