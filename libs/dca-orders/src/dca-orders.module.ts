import { Module } from "@nestjs/common";
import { DcaOrdersService } from "./dca-orders.service";
import { DcaOrderRepo, OrderRepo } from "./repos";

@Module({
  providers: [DcaOrdersService, OrderRepo, DcaOrderRepo],
  exports: [DcaOrdersService],
})
export class DcaOrdersModule {}
