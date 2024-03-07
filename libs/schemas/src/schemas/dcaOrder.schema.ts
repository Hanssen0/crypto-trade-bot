import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum DcaOrderState {
  Saved = "Saved",
  Arranged = "Arranged",
  Finished = "Finished",
}

@Entity()
export class DcaOrder {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ type: "varchar", unique: true })
  uniqueId: string;

  @Column({ type: "integer" })
  planId: number;

  @Column({ type: "varchar" })
  symbol: string;

  @Column({ type: "varchar" })
  minQuoteAmount: string;

  @Column({ type: "varchar" })
  maxQuoteAmount: string;

  @Column({ type: "varchar", default: DcaOrderState.Saved })
  state: DcaOrderState;

  @Column({ type: "varchar", nullable: true })
  orderUniqueId: string | null; // Not null while creating order

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
