import { Module } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { OrderRepo } from "./repos";

@Module({
  providers: [OrdersService, OrderRepo],
  exports: [OrdersService],
})
export class OrdersModule {}
