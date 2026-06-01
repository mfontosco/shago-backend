import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entities';

@Module({
  imports: [
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
              entities: [User],
              migrations: [__dirname + "/migrations/*{.ts,.js}"],
              synchronize:false,
              migrationsRun:false
             })
          }),
          UsersModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
