import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entities';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { CatgeoriesModule } from './categories/categories.module';
import { Categeories } from './categories/entities/categories.entities';
import { AttributesModule } from './attributes/attributes.module';
import { AttributeValueModule } from './attribute_value/attribute_value.module';
import { Attributes } from './attributes/entities/attributes.entities';
import { AttributeValue } from './attribute_value/entities/attribute_value.entities';
@Module({
  imports: [
    JwtModule.register({
          global:true,
          secret:"secret",
          signOptions:{expiresIn:"7d"}
        }),
    ConfigModule.forRoot({isGlobal:true}),
          TypeOrmModule.forRootAsync({
            inject:[ConfigService],
            useFactory:  (config:ConfigService)=>({
              type:"postgres",
              host:config.get("DB_HOST"),
              port:config.get<number>("DB_PORT"),
              username: config.get("DB_USERNAME"),
              password:config.get("DB_PASSWORD"),
              database:config.get("DB_NAME"),
              entities: [User,Categeories,Attributes,AttributeValue],
              migrations: [__dirname + "/migrations/*{.ts,.js}"],
              synchronize:false,
              migrationsRun:false
             })
          }),
          UsersModule,
          AuthModule,
          CatgeoriesModule,
          AttributesModule,
          AttributeValueModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
