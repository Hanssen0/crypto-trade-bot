import { Order, OrderResult, OrderState } from "@app/schemas";
import { Injectable } from "@nestjs/common";
import { EntityManager, Repository } from "typeorm";
import * as ccxt from "ccxt";

@Injectable()
export class OrderRepo extends Repository<Order> {
  constructor(manager: EntityManager) {
    super(Order, manager);
  }

  async updateBySent(order: Order, remoteOrderRaw: ccxt.Order) {
    await this.update(
      { id: order.id, state: OrderState.Saved },
      {
        remoteOrderId: remoteOrderRaw.id,
        state: OrderState.Sent,
        remoteOrderRaw,
      },
    );
  }

  async recordOrderResult(
    order: Order,
    result: OrderResult,
    remoteOrderRaw: ccxt.Order,
  ) {
    await this.update(
      { id: order.id, state: OrderState.Sent },
      {
        state: OrderState.Finished,
        result,
        remoteOrderRaw,
      },
    );
  }
}
