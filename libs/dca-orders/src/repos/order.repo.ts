import { Order } from "@app/schemas";
import { Injectable } from "@nestjs/common";
import { EntityManager, Repository } from "typeorm";

@Injectable()
export class OrderRepo extends Repository<Order> {
  constructor(manager: EntityManager) {
    super(Order, manager);
  }

  async getByUniqueId(uniqueId: string): Promise<Order | null> {
    return this.findOneBy({ uniqueId });
  }

  async placeOrder(log: Order): Promise<Order> {
    const { uniqueId } = log;
    const existed = await this.getByUniqueId(uniqueId);
    if (existed) {
      return existed;
    }

    await this.insert(log);
    return this.getByUniqueId(uniqueId);
  }
}
