import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OrderRepo } from "./repos";
import { LockService, autoRun, foreachInRepo } from "@app/commons";
import {
  OrderResult,
  OrderState,
  OrderType,
  fromOrderSide,
  fromOrderType,
} from "@app/schemas";
import * as ccxt from "ccxt";

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly exchange: ccxt.Exchange;
  private readonly exchangeCreateOrderTimeout: number;

  constructor(
    configService: ConfigService,
    private readonly lockService: LockService,
    private readonly orderRepo: OrderRepo,
  ) {
    this.exchange = new ccxt[configService.get<string>("exchange.id")]({
      apiKey: configService.get<string>("exchange.api_key"),
      secret: configService.get<string>("exchange.secret"),
    });
    this.exchange.setSandboxMode(
      configService.get<boolean>("exchange.is_sandbox"),
    );
    this.exchangeCreateOrderTimeout = configService.get<number>(
      "exchange.create_order_timeout",
    );

    autoRun(this.logger, configService.get<number>("cron.check_interval"), () =>
      this.processOrders(),
    );
  }

  async processOrders() {
    await foreachInRepo({
      repo: this.orderRepo,
      criteria: { state: OrderState.Saved },
      handler: async (order) => {
        await this.lockService.tryLockOnce(
          `order-create-${order.uniqueId}`,
          "Locked",
          this.exchangeCreateOrderTimeout,
          async () => {
            const remoteOrder = await (async () => {
              try {
                const existed = await this.exchange.fetchOrder(
                  undefined,
                  order.symbol,
                  {
                    clientOrderId: order.uniqueId,
                  },
                );
                if (existed) {
                  return existed;
                }
              } catch (err) {}
              return await this.exchange.createOrder(
                order.symbol,
                fromOrderType(order.type),
                fromOrderSide(order.side),
                Number(order.baseAmount),
                order.type === OrderType.Market
                  ? undefined
                  : Number(order.expectedPrice),
                { clientOrderId: order.uniqueId },
              );
            })();
            this.logger.log(
              `Order ${order.id} created remote order ${remoteOrder.id}`,
            );
            await this.orderRepo.updateBySent(order, remoteOrder);
          },
        );
      },
    });
    await foreachInRepo({
      repo: this.orderRepo,
      criteria: { state: OrderState.Sent },
      handler: async (order) => {
        const remoteOrder = await this.exchange.fetchOrder(
          order.remoteOrderId,
          order.symbol,
        );
        if (remoteOrder.status === "open") {
          return;
        }
        if (remoteOrder.status === "closed") {
          await this.orderRepo.recordOrderResult(
            order,
            OrderResult.Succeed,
            remoteOrder,
          );
          this.logger.log(`Order ${order.id} succeed`);
          return;
        }
        await this.orderRepo.recordOrderResult(
          order,
          OrderResult.Failed,
          remoteOrder,
        );
        this.logger.log(`Order ${order.id} failed`);
      },
    });
  }
}
