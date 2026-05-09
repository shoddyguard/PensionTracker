export interface ContributionRecord {
  amount: number;
  type: "contribution" | "transfer_in" | "transfer_out";
}

// For aggregate portfolio return: transfer_out cancels the matching transfer_in on the
// receiving pension, so the total only reflects real new money contributed across all pensions.
export function netInvested(contribs: ContributionRecord[]): number {
  return contribs.reduce((sum, c) => {
    if (c.type === "transfer_out") return sum - c.amount;
    return sum + c.amount;
  }, 0);
}

// For a single pension's own return display: only count money flowing IN.
// A transfer_out is an exit event, not a negative investment - subtracting it
// makes the denominator negative and produces a nonsensical result.
export function netInvestedIn(contribs: ContributionRecord[]): number {
  return contribs
    .filter((c) => c.type !== "transfer_out")
    .reduce((sum, c) => sum + c.amount, 0);
}

export function totalReturnPercent(currentValue: number, invested: number): number | null {
  if (invested === 0) return null;
  return ((currentValue - invested) / invested) * 100;
}

// Simple annualized return using geometric compounding.
// Future improvement: replace with XIRR to account for contribution timing.
export function annualizedReturnPercent(
  currentValue: number,
  invested: number,
  firstDate: Date,
  lastDate: Date
): number | null {
  if (invested <= 0 || currentValue <= 0) return null;
  const years = (lastDate.getTime() - firstDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (years < 0.1) return null;
  return (Math.pow(currentValue / invested, 1 / years) - 1) * 100;
}

export interface PensionSnapshot {
  pensionId: number;
  date: Date;
  value: number;
}

// Build aggregate portfolio chart data using carry-forward for pensions with no snapshot on a given date.
export function buildAggregateChartData(
  snapshots: PensionSnapshot[],
  pensionIds: number[]
): Array<{ date: string; value: number }> {
  if (snapshots.length === 0) return [];

  const sorted = [...snapshots].sort((a, b) => a.date.getTime() - b.date.getTime());

  const uniqueDates: string[] = [];
  const seenDates = new Set<string>();
  for (const s of sorted) {
    const key = s.date.toISOString().split("T")[0];
    if (!seenDates.has(key)) {
      seenDates.add(key);
      uniqueDates.push(key);
    }
  }

  const running: Record<number, number> = {};
  let sIdx = 0;
  const result: Array<{ date: string; value: number }> = [];

  for (const dateKey of uniqueDates) {
    while (sIdx < sorted.length && sorted[sIdx].date.toISOString().split("T")[0] === dateKey) {
      running[sorted[sIdx].pensionId] = sorted[sIdx].value;
      sIdx++;
    }
    const total = pensionIds.reduce((sum, id) => sum + (running[id] ?? 0), 0);
    result.push({ date: dateKey, value: total });
  }

  return result;
}
