import { Module } from "@nestjs/common";
import { DcaService } from "./dca.service";
import { DcaPlanRepo, DcaOrderRepo } from "./repos";

@Module({
  providers: [DcaService, DcaPlanRepo, DcaOrderRepo],
  exports: [DcaService],
})
export class DcaModule {}
