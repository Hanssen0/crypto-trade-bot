import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DcaPlan, Order, DcaOrder } from ".";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "mysql",
        host: configService.get<string>("mysql.host"),
        port: configService.get<number>("mysql.port"),
        username: configService.get<string>("mysql.username"),
        password: configService.get<string>("mysql.password"),
        database: configService.get<string>("mysql.database"),
        synchronize: true,
        entities: [DcaPlan, Order, DcaOrder],
      }),
    }),
  ],
})
export class SchemasModule {}
