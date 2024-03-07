import { loadConfig, LockModule } from "@app/commons";
import { DcaModule } from "@app/dca";
import { DcaOrdersModule } from "libs/dca-orders/src";
import { OrdersModule } from "@app/orders";
import { SchemasModule } from "@app/schemas";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadConfig],
    }),
    LockModule,
    SchemasModule,
    DcaModule,
    DcaOrdersModule,
    OrdersModule,
  ],
})
export class AppModule {}
