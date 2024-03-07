import { DcaOrder, DcaOrderState } from "@app/schemas";
import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { EntityManager, IsNull, Repository } from "typeorm";

@Injectable()
export class DcaOrderRepo extends Repository<DcaOrder> {
  constructor(manager: EntityManager) {
    super(DcaOrder, manager);
  }

  async arrangeOrder(dcaOrder: DcaOrder): Promise<string> {
    await this.update(
      {
        id: dcaOrder.id,
        state: DcaOrderState.Saved,
        orderUniqueId: IsNull(),
      },
      { orderUniqueId: randomUUID(), state: DcaOrderState.Arranged },
    );

    const { orderUniqueId } = await this.findOneBy({ id: dcaOrder.id });
    if (orderUniqueId === null) {
      throw Error(`Failed to arrange order for DCA order ${dcaOrder.id}`);
    }

    return orderUniqueId;
  }

  async updateByOrderSucceed(dcaOrder: DcaOrder) {
    await this.update(
      {
        id: dcaOrder.id,
        state: DcaOrderState.Arranged,
        orderUniqueId: dcaOrder.orderUniqueId,
      },
      { state: DcaOrderState.Finished },
    );
  }

  async unlockByOrderFailed(order: DcaOrder) {
    await this.update(
      {
        id: order.id,
        state: DcaOrderState.Arranged,
        orderUniqueId: order.orderUniqueId,
      },
      { orderUniqueId: null },
    );
  }
}
