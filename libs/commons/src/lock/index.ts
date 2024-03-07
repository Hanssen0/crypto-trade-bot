import { Global, Injectable, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisClientType, createClient } from "redis";

@Injectable()
export class LockService {
  private client: RedisClientType;

  constructor(private readonly configService: ConfigService) {
    this.client = createClient({
      url: this.configService.get<string>("redis.url"),
    });
  }

  async init() {
    await this.client.connect();
  }

  private async lock(
    key: string,
    value: string,
    ttlMs: number,
  ): Promise<boolean> {
    return (
      (await this.client.set(key, value, {
        NX: true,
        PX: ttlMs,
      })) === "OK"
    );
  }

  private async unlock(key: string) {
    return await this.client.del([key]);
  }

  async tryLockOnce(
    key: string,
    value: string,
    ttlMs: number,
    handler: () => Promise<unknown>,
  ) {
    if (!(await this.lock(key, value, ttlMs))) {
      return;
    }

    try {
      await handler();
    } finally {
      await this.unlock(key);
    }
  }
}

@Global()
@Module({
  providers: [
    {
      provide: LockService,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const service = new LockService(configService);
        await service.init();
        return service;
      },
    },
  ],
  exports: [LockService],
})
export class LockModule {}
