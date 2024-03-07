import { DcaPlan } from "@app/schemas";
import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { EntityManager, IsNull, Repository } from "typeorm";

@Injectable()
export class DcaPlanRepo extends Repository<DcaPlan> {
  constructor(manager: EntityManager) {
    super(DcaPlan, manager);
  }

  async arrangeDcaOrder(plan: DcaPlan): Promise<string> {
    await this.update(
      { id: plan.id, dcaOrderUniqueId: IsNull() },
      { dcaOrderUniqueId: randomUUID() },
    );

    const { dcaOrderUniqueId } = await this.findOneBy({ id: plan.id });
    if (dcaOrderUniqueId === null) {
      throw Error(`Failed to arrange DCA order for plan ${plan.id}`);
    }

    return dcaOrderUniqueId;
  }

  async updateByDcaOrderFinished(plan: DcaPlan) {
    await this.update(
      { id: plan.id, dcaOrderUniqueId: plan.dcaOrderUniqueId },
      { dcaOrderUniqueId: null, lastTriggerTime: new Date() },
    );
  }
}
