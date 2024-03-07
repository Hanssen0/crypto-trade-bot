import { JSDateType } from "@app/commons/ormUtils";
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum PlanState {
  Activated = "Activated",
  Disabled = "Disabled",
}

@Entity()
export class DcaPlan {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ type: "varchar" })
  base: string;

  @Column({ type: "varchar" })
  quote: string;

  @Column({ type: "varchar" })
  minQuoteAmount: string;

  @Column({ type: "varchar" })
  maxQuoteAmount: string;

  @Column(JSDateType)
  startTime: Date;

  @Column({ type: "varchar" })
  interval: string;

  @Column({ type: "varchar" })
  state: PlanState;

  @Column({ ...JSDateType, nullable: true })
  lastTriggerTime: Date | null;

  @Column({ type: "varchar", nullable: true })
  dcaOrderUniqueId: string | null; // Not null if creating dca order

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
