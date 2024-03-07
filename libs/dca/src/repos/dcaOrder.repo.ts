import { DcaOrder } from "@app/schemas";
import { Injectable } from "@nestjs/common";
import { EntityManager, Repository } from "typeorm";

@Injectable()
export class DcaOrderRepo extends Repository<DcaOrder> {
  constructor(manager: EntityManager) {
    super(DcaOrder, manager);
  }

  async getByUniqueId(uniqueId: string): Promise<DcaOrder | null> {
    return this.findOneBy({ uniqueId });
  }

  async placeOrder(order: DcaOrder): Promise<DcaOrder> {
    const { uniqueId } = order;
    const existed = await this.getByUniqueId(uniqueId);
    if (existed) {
      return existed;
    }

    await this.insert(order);
    return this.getByUniqueId(uniqueId);
  }
}
