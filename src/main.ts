import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RolesGuard } from './common/guards/roles.guard';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

/**
 * Application Bootstrap
 *
 * Registers global middleware, filters, guards, and pipes
 * Initializes database seeding if needed
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for mobile/admin clients
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: corsOrigins,
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

  // Setup Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Shago API - Multi-Tenant Food Delivery Platform')
    .setDescription(`
      Complete API documentation for Shago - A comprehensive multi-tenant food delivery platform.

      ## Authentication
      All endpoints require JWT Bearer token authentication except for public endpoints.

      ## Modules
      - **Support**: Customer support tickets and feedback management
      - **Payments**: Payment processing, transactions, and refunds
      - **Marketing**: Promotions, campaigns, bulk messaging
      - **Orders**: Order management and tracking
      - **Products**: Product catalog and inventory
      - **Deliveries**: Delivery tracking and management
      - **Auth**: User authentication and authorization
      - **Users**: User account management

      ## Multi-Tenancy
      All vendor endpoints are isolated per tenant. Tenant ID is automatically extracted from the authenticated user's context.
    `)
    .setVersion('1.0.0')
    .setContact('Shago Support', 'https://shago.app', 'support@shago.app')
    .setLicense('Proprietary', 'https://shago.app/license')

    // Phase 2 - Core Modules
    .addTag('Support - Tickets & Feedback', 'Manage customer support tickets and feedback')
    .addTag('Payments - Transactions & Refunds', 'Process and manage payment transactions')
    .addTag('Marketing - Promotions & Campaigns', 'Create and manage promotional campaigns')

    // Phase 1 - Platform Features
    .addTag('Orders', 'Manage customer orders and order tracking')
    .addTag('Products', 'Manage product catalog and inventory')
    .addTag('Deliveries', 'Manage delivery tracking and logistics')
    .addTag('Riders', 'Manage delivery riders and assignments')
    .addTag('Categories', 'Manage product categories')
    .addTag('Users', 'User account management and profiles')
    .addTag('Authentication', 'User login, registration, and token management')

    // Infrastructure
    .addTag('Admin', 'Administrative operations and system management')
    .addTag('Vendor Dashboard', 'Vendor business analytics and metrics')
    .addTag('Health', 'System health and status checks')

    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
    customCss: `.swagger-ui .topbar { display: none }
               .swagger-ui .info .title { font-size: 32px; }
               .swagger-ui .scheme-container { background-color: #f5f5f5; }`,
  });

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
