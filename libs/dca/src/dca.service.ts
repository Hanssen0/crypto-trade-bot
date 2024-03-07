import { autoRun, foreachInRepo } from "@app/commons";
import { DcaPlan, PlanState } from "@app/schemas";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DcaPlanRepo, DcaOrderRepo } from "./repos";

@Injectable()
export class DcaService {
  private readonly logger = new Logger(DcaService.name);

  constructor(
    configService: ConfigService,
    private readonly dcaPlanRepo: DcaPlanRepo,
    private readonly dcaOrderRepo: DcaOrderRepo,
  ) {
    autoRun(this.logger, configService.get<number>("cron.check_interval"), () =>
      this.processPlans(),
    );
  }

  async processPlans() {
    await foreachInRepo({
      repo: this.dcaPlanRepo,
      criteria: { state: PlanState.Activated },
      handler: async (plan) => {
        if (!(await this.maintainAndShouldCreate(plan))) {
          return;
        }

        const triggerTime = new Date();
        if (!shouldTriggerPlan(plan, triggerTime)) {
          return;
        }

        await this.placeOrderOfPlan(plan);
      },
    });
  }

  async maintainAndShouldCreate(plan: DcaPlan): Promise<boolean> {
    if (plan.dcaOrderUniqueId === null) {
      return true;
    }

    const order = await this.dcaOrderRepo.getByUniqueId(plan.dcaOrderUniqueId);
    if (!order) {
      return true;
    }

    await this.dcaPlanRepo.updateByDcaOrderFinished(plan);
    this.logger.log(`DCA plan ${plan.id} arranged dca order ${order.id}`);
    return false;
  }

  async placeOrderOfPlan(plan: DcaPlan) {
    const orderUniqueId = await this.dcaPlanRepo.arrangeDcaOrder(plan);
    try {
      const order = await this.dcaOrderRepo.placeOrder(
        this.dcaOrderRepo.create({
          uniqueId: orderUniqueId,
          planId: plan.id,
          symbol: `${plan.base}/${plan.quote}`,
          minQuoteAmount: plan.minQuoteAmount,
          maxQuoteAmount: plan.maxQuoteAmount,
        }),
      );

      this.logger.log(`DCA plan ${plan.id} placed order ${order.id}`);
    } catch (err) {
      this.logger.error(`Failed to place order ${orderUniqueId}`);
      throw err;
    }
  }
}

function shouldTriggerPlan(plan: DcaPlan, triggerTime: Date): boolean {
  const startTime = plan.startTime;
  if (triggerTime < startTime) {
    return false;
  }

  const interval = Number(plan.interval);
  const round = getRound(startTime, triggerTime, interval);
  const lastRound = plan.lastTriggerTime
    ? getRound(startTime, plan.lastTriggerTime, interval)
    : -1;
  if (round <= lastRound) {
    return false;
  }

  return true;
}

function getRound(start: Date, at: Date, interval: number) {
  return Math.floor((at.getTime() - start.getTime()) / interval);
}
