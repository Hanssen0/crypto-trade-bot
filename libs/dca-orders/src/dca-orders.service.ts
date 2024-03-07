import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DcaOrderRepo, OrderRepo } from "./repos";
import {
  FixedPoint,
  autoRun,
  foreachInRepo,
  formatFixedPoint,
  parseFixedPoint,
} from "@app/commons";
import {
  DcaOrder,
  DcaOrderState,
  OrderResult,
  OrderSide,
  OrderType,
} from "@app/schemas";
import { Not } from "typeorm";
import * as ccxt from "ccxt";

@Injectable()
export class DcaOrdersService {
  private readonly logger = new Logger(DcaOrdersService.name);
  private readonly exchange: ccxt.Exchange;

  constructor(
    configService: ConfigService,
    private readonly dcaOrderOrderRepo: DcaOrderRepo,
    private readonly orderRepo: OrderRepo,
  ) {
    this.exchange = new ccxt[configService.get<string>("exchange.id")]();
    this.exchange.setSandboxMode(
      configService.get<boolean>("exchange.is_sandbox"),
    );
    autoRun(this.logger, configService.get<number>("cron.check_interval"), () =>
      this.processOrders(),
    );
  }

  async processOrders() {
    await foreachInRepo({
      repo: this.dcaOrderOrderRepo,
      criteria: {
        state: Not(DcaOrderState.Finished),
      },
      handler: async (dcaOrder) => {
        if (!(await this.maintainAndShouldCreate(dcaOrder))) {
          return;
        }

        const orderArgs = await this.generateArgsFromDcaOrder(dcaOrder);
        if (orderArgs === null) {
          return;
        }

        // The plan has no order
        const orderUniqueId = await this.dcaOrderOrderRepo.arrangeOrder(
          dcaOrder,
        );
        try {
          const order = await this.orderRepo.placeOrder(
            this.orderRepo.create({
              uniqueId: orderUniqueId,
              symbol: dcaOrder.symbol,
              type: OrderType.Market,
              side: OrderSide.Buy,
              description: `DCA order: ${dcaOrder.id}`,
              ...orderArgs,
            }),
          );

          this.logger.log(`DCA order ${dcaOrder.id} placed order ${order.id}`);
        } catch (err) {
          this.logger.error(`Failed to place order ${orderUniqueId}`);
          throw err;
        }
      },
    });
  }

  async maintainAndShouldCreate(dcaOrder: DcaOrder): Promise<boolean> {
    if (dcaOrder.orderUniqueId === null) {
      return true;
    }

    const order = await this.orderRepo.getByUniqueId(dcaOrder.orderUniqueId);
    if (!order) {
      return true;
    }

    if (order.result === OrderResult.None) {
      return false;
    }

    if (order.result !== OrderResult.Succeed) {
      await this.dcaOrderOrderRepo.unlockByOrderFailed(dcaOrder);
      this.logger.log(
        `DCA order ${dcaOrder.id} is resat by failed order ${order.id}`,
      );
      return true;
    }

    await this.dcaOrderOrderRepo.updateByOrderSucceed(dcaOrder);
    this.logger.log(
      `DCA order ${dcaOrder.id} is finished by order ${order.id}`,
    );
    return false;
  }

  async generateArgsFromDcaOrder(dcaOrder: DcaOrder): Promise<{
    baseAmount: string;
    expectedCost: string;
    expectedPrice: string;
  } | null> {
    const [ticker, market] = await Promise.all([
      this.exchange.fetchTicker(dcaOrder.symbol),
      (async () => {
        if (!this.exchange.markets) {
          await this.exchange.loadMarkets();
        }

        return this.exchange.markets[dcaOrder.symbol];
      })(),
    ]);
    if (!market) {
      throw Error(`Market ${dcaOrder.symbol} not found`);
    }

    const ask = parseFixedPoint(ticker.ask);
    const precision = parseFixedPoint(
      formatFixedPoint(1n, market.precision.amount),
    );
    const minCost = parseFixedPoint(market.limits.cost.min);
    const min = parseFixedPoint(market.limits.amount.min);

    const minQuoteAmount = parseFixedPoint(dcaOrder.minQuoteAmount);
    const maxQuoteAmount = parseFixedPoint(dcaOrder.maxQuoteAmount);

    const quoteAmount = minQuoteAmount < minCost ? minCost : minQuoteAmount;

    const preciseBaseAmount = (quoteAmount * FixedPoint.One) / ask;
    const baseAmount =
      ((preciseBaseAmount + precision - 1n) / precision) * precision; // Round up

    const cost = (baseAmount * ask) / FixedPoint.One;
    if (baseAmount < min || maxQuoteAmount < cost) {
      this.logger.warn(
        `DCA order wants base amount ${formatFixedPoint(
          cost,
        )}/${formatFixedPoint(baseAmount)}(${ticker.ask}) not in ${
          dcaOrder.minQuoteAmount
        } ~ ${dcaOrder.maxQuoteAmount}/${market.limits.amount.min}/${
          market.limits.cost.min
        }`,
      );
      return null;
    }

    return {
      baseAmount: formatFixedPoint(baseAmount),
      expectedCost: formatFixedPoint(cost),
      expectedPrice: formatFixedPoint(ask),
    };
  }
}
