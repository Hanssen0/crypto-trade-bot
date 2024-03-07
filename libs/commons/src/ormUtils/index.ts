import {
  ColumnOptions,
  EntityManager,
  FindOptionsWhere,
  MoreThan,
  Repository,
} from "typeorm";

export const JSDateType: ColumnOptions = {
  type: "varchar",
  transformer: {
    from: (raw: string): Date => new Date(raw),
    to: (date: Date): string => date.toISOString(),
  },
};

export async function foreachInRepo<T>({
  repo,
  handler,
  criteria,
  isSerial,
  chunkSize,
}: {
  repo: Repository<T & { id: number }>;
  handler: (entity: T) => Promise<unknown>;
  criteria?: FindOptionsWhere<T>;
  isSerial?: boolean;
  chunkSize?: number;
}) {
  let lastId: number | null = null;

  while (true) {
    const entities = await repo.find({
      where: lastId
        ? ({ ...(criteria ?? {}), id: MoreThan(lastId) } as any)
        : criteria,
      take: chunkSize ?? 100,
    });
    if (entities.length === 0) {
      break;
    }
    lastId = entities[entities.length - 1].id;

    if (isSerial) {
      for (let i = 0; i < entities.length; i += 1) {
        await handler(entities[i]);
      }
    } else {
      await Promise.all(entities.map((entity) => handler(entity)));
    }
  }
}

// Will start transaction if not specified
export async function withTransaction<T>(
  defaultManager: EntityManager,
  txManager: EntityManager | null | undefined,
  handler: (manager: EntityManager) => Promise<T>,
): Promise<T> {
  if (txManager) {
    return await handler(txManager);
  }

  return await defaultManager.transaction(handler);
}

export function formatSortable(str: string, digits = 80) {
  if (str.charAt(0) === "-") {
    return `-${str.substring(1).padStart(digits, "0")}`;
  }
  return str.padStart(digits, "0");
}

export function parseSortable(str: string) {
  if (str.charAt(0) === "-") {
    const val = str.substring(1).replace(/^0*/, "");
    if (val === "") {
      return "0";
    }
    return `-${val}`;
  }
  const val = str.replace(/^0*/, "");
  if (val === "") {
    return "0";
  }
  return val;
}
