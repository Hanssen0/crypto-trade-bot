export function formatFixedPoint(val: bigint, decimals = 18): string {
  const l = val / 10n ** BigInt(decimals);
  const r = val % 10n ** BigInt(decimals);
  if (r === 0n) {
    return l.toString();
  }

  return `${l}.${r.toString().padStart(decimals, "0").replace(/0*$/, "")}`;
}

export function parseFixedPoint(ori: string | number, decimals = 18): bigint {
  const [l, r] = ori.toString().split(".");
  const lVal = BigInt(l) * 10n ** BigInt(decimals);
  if (r === undefined) {
    return lVal;
  }

  return lVal + BigInt(r.padEnd(decimals, "0").replace(/^0*/, ""));
}

export class FixedPoint {
  public static readonly Zero = 0n;
  public static readonly One = parseFixedPoint("1");
}
