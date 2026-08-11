import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RolesGuard } from './common/guards/roles.guard';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Application Bootstrap
 *
 * Registers global middleware, filters, guards, and pipes
 * Initializes database seeding if needed
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for mobile/admin clients
  app.enableCors({
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe (validates DTOs before controller reaches them)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if extra properties
      transform: true, // Automatically transform to DTO class
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter (catch all errors and normalize responses)
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global roles guard (enforces @Roles() decorator)
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new RolesGuard(reflector));

  // Set API version prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;
  const environment = process.env.NODE_ENV || 'development';

  await app.listen(port);

  // Startup information
  const baseUrl = `http://localhost:${port}`;
  console.log(`
╔════════════════════════════════════════════════════╗
║          🚀 SHAGO API BOOTSTRAP COMPLETE           ║
╠════════════════════════════════════════════════════╣
║ Environment: ${environment.toUpperCase().padEnd(37)}║
║ Server: ${baseUrl.padEnd(44)}║
║ API Base: ${`${baseUrl}/api/v1`.padEnd(39)}║
║ 🔒 JWT Authentication: ENABLED                    ║
║ 👥 Role-Based Access Control: ENABLED             ║
║ 🛡️  Global Exception Handling: ENABLED              ║
║ ✅ Validation Pipeline: ENABLED                    ║
╚════════════════════════════════════════════════════╝

📝 Next Steps:
   • Run database seeding: npm run seed
   • View API docs: ${baseUrl}/api/docs
   • Check health: ${baseUrl}/api/v1/health

💡 In development? Run with: npm run start:dev
  `);
}

bootstrap().catch((error) => {
  console.error('❌ Bootstrap failed:', error);
  process.exit(1);
});
