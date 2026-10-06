
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entities';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { CategoriesModule } from './categories/categories.module';
import { Categeories } from './categories/entities/categories.entities';
import { AttributesModule } from './attributes/attributes.module';
import { AttributeValueModule } from './attribute_value/attribute_value.module';
import { Attributes } from './attributes/entities/attributes.entities';
import { AttributeValue } from './attribute_value/entities/attribute_value.entities';
import { ProductsModule } from './products/products.module';
import { ProductImageModule } from './product-image/product-image.module';
import { ProductvariantModule } from './productvariant/productvariant.module';
import { VariantattributeModule } from './variantattribute/variantattribute.module';
import { Product } from './products/entities/product.entity';
import { ProductImage } from './product-image/entities/product-image.entities';
import { ProductVariant } from './productvariant/entities/product-variant.entities';
import { VariantAttribute } from './variantattribute/entities/variant-attribute.entities';
import { Role } from './roles/entities/role.entity';
import { Permission } from './permissions/entities/permission.entity';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { AdminModule } from './admin/admin.module';
import { CommonModule } from './common/common.module';
import { AuditLog } from './audit-logs/entities/audit-log.entity';
import { OrdersModule } from './orders/orders.module';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { DeliveryModule } from './delivery/delivery.module';
import { Delivery } from './delivery/entities/delivery.entity';
import { Rider } from './delivery/entities/rider.entity';
import { Tenant } from './tenants/entities/tenant.entity';
import { TenantsModule } from './tenants/tenants.module';
import { VendorModule } from './vendor/vendor.module';
import { SupportModule } from './support/support.module';
import { SupportTicket } from './support/entities/support-ticket.entity';
import { SupportReply } from './support/entities/support-reply.entity';
import { Feedback } from './support/entities/feedback.entity';
import { PaymentsModule } from './payments/payments.module';
import { Payment } from './payments/entities/payment.entity';
import { MarketingModule } from './marketing/marketing.module';
import { Promotion } from './marketing/entities/promotion.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET') ?? 'mfon-secret-key';
        console.log(`[JWT] Initialized with secret: ${secret.substring(0, 5)}...`);
        return {
          secret: secret,
          signOptions: { expiresIn: 3600 }
        };
      }
    }),
    TypeOrmModule.forRootAsync({
            inject:[ConfigService],
            useFactory:  (config:ConfigService)=>({
              type:"postgres",
              host:config.get("DB_HOST"),
              port:config.get<number>("DB_PORT"),
              username: config.get("DB_USERNAME"),
              password:config.get("DB_PASSWORD"),
              database:config.get("DB_NAME"),
              entities: [Tenant, User, Categeories, Attributes, AttributeValue, Product, ProductImage, ProductVariant, VariantAttribute, Role, Permission, AuditLog, Order, OrderItem, Delivery, Rider, SupportTicket, SupportReply, Feedback, Payment, Promotion],
              migrations: [__dirname + "/migrations/*{.ts,.js}"],
              synchronize:true,
              migrationsRun:false
             })
          }),
          TenantsModule,
          VendorModule,
          UsersModule,
          AuthModule,
          CategoriesModule,
          AttributesModule,
          AttributeValueModule,
          ProductsModule,
          ProductImageModule,
          ProductvariantModule,
          VariantattributeModule,
          RolesModule,
          PermissionsModule,
          AdminModule,
          CommonModule,
          OrdersModule,
          DeliveryModule,
          SupportModule,
          PaymentsModule,
          MarketingModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply TenantMiddleware to all routes
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
