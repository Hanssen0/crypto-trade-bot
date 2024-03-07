import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum OrderState {
  Saved = "Saved",
  Sent = "Sent",
  Finished = "Finished",
}

export enum OrderResult {
  None = "None",
  Succeed = "Succeed",
  Failed = "Failed",
}

export enum OrderType {
  Market = "Market",
  Limit = "Limit",
}

export function fromOrderType(type: OrderType): string {
  return type.toLowerCase();
}

export enum OrderSide {
  Buy = "Buy",
  Sell = "Sell",
}

export function fromOrderSide(side: OrderSide): string {
  return side.toLowerCase();
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ type: "varchar", unique: true })
  uniqueId: string;

  @Column({ type: "varchar", nullable: true })
  remoteOrderId: string | null;

  @Column({ type: "varchar" })
  symbol: string;

  @Column({ type: "varchar" })
  type: OrderType;

  @Column({ type: "varchar" })
  side: OrderSide;

  @Column({ type: "varchar" })
  baseAmount: string;

  @Column({ type: "varchar" })
  expectedPrice: string;

  @Column({ type: "varchar" })
  expectedCost: string;

  @Column({ type: "varchar", default: OrderState.Saved })
  state: OrderState;

  @Column({ type: "varchar", default: OrderResult.None })
  result: OrderResult;

  @Column({ type: "json", nullable: true })
  remoteOrderRaw: unknown;

  @Column({ type: "varchar" })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
