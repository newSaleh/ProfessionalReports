import {
  BRANCH_CODES,
  DEFAULT_BRANCH_NAMES,
  type BranchCode,
  type ModelRow,
  type ModelStat,
  type Recommendation,
  type Snapshot,
  type ThresholdSettings,
} from './types';

const clampPos = (n: number) => (n > 0 ? n : 0);

export function branchName(code: BranchCode, names: Partial<Record<BranchCode, string>>) {
  return names[code] || DEFAULT_BRANCH_NAMES[code];
}

export function computeModelStat(row: ModelRow): ModelStat {
  const soldByBranch: Record<string, number> = {};
  const balByBranch: Record<string, number> = {};
  let totalSoldPositive = 0;
  let totalBalancePositive = 0;

  for (const b of BRANCH_CODES) {
    const sold = clampPos(row[`${b}SoldQty` as keyof ModelRow] as number);
    const bal = clampPos(row[`${b}Balance` as keyof ModelRow] as number);
    soldByBranch[b] = sold;
    balByBranch[b] = bal;
    totalSoldPositive += sold;
    totalBalancePositive += bal;
  }

  const branch = {} as ModelStat['branch'];
  let bestBranch: BranchCode = BRANCH_CODES[0];
  let worstBranch: BranchCode = BRANCH_CODES[0];

  for (const b of BRANCH_CODES) {
    const sold = soldByBranch[b];
    const bal = balByBranch[b];
    const avail = sold + bal;
    const sellThrough = avail > 0 ? sold / avail : 0;
    const demandShare = totalSoldPositive > 0 ? sold / totalSoldPositive : 1 / BRANCH_CODES.length;
    const stockShare = totalBalancePositive > 0 ? bal / totalBalancePositive : 1 / BRANCH_CODES.length;
    branch[b] = { sold, balance: bal, sellThrough, demandShare, stockShare, imbalance: demandShare - stockShare };
    if (sold > branch[bestBranch].sold) bestBranch = b;
    if (sold < branch[worstBranch].sold) worstBranch = b;
  }

  return { row, totalSoldPositive, totalBalancePositive, branch, bestBranch, worstBranch };
}

export function computeAllStats(rows: ModelRow[]): ModelStat[] {
  return rows.map(computeModelStat);
}

/**
 * Core "wow" feature: for every well-selling model, detect branches running low
 * relative to their own demand, then try to satisfy that demand first from a
 * sister branch sitting on slow-moving surplus before suggesting a new supplier order.
 */
export function buildRecommendations(rows: ModelRow[], thresholds: ThresholdSettings): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const row of rows) {
    const stat = computeModelStat(row);
    if (stat.totalSoldPositive < thresholds.minPopularity) continue;

    const avgSoldPerActiveBranch =
      stat.totalSoldPositive / Math.max(1, BRANCH_CODES.filter((b) => stat.branch[b].sold > 0).length);

    // remaining transferable pool per branch, depleted as we allocate transfers
    const surplusPool: Partial<Record<BranchCode, number>> = {};
    for (const b of BRANCH_CODES) {
      const s = stat.branch[b];
      if (s.sellThrough <= thresholds.surplusSellThrough && s.balance >= thresholds.surplusMinBalance) {
        surplusPool[b] = s.balance;
      }
    }

    const atRisk = BRANCH_CODES.filter((b) => {
      const s = stat.branch[b];
      return s.sellThrough >= thresholds.highSellThrough && s.balance <= thresholds.lowStockUnits;
    }).sort((a, b) => stat.branch[a].balance - stat.branch[b].balance);

    for (const toBranch of atRisk) {
      const s = stat.branch[toBranch];
      const target = Math.max(s.sold, avgSoldPerActiveBranch) * thresholds.coverTargetMultiplier;
      const need = Math.max(1, Math.round(target - s.balance));

      // find best surplus donor (largest remaining pool, excluding self)
      const donor = (Object.keys(surplusPool) as BranchCode[])
        .filter((b) => b !== toBranch && (surplusPool[b] ?? 0) > 0)
        .sort((a, b) => (surplusPool[b] ?? 0) - (surplusPool[a] ?? 0))[0];

      const critical = s.balance <= thresholds.lowStockUnits / 2;

      if (donor) {
        const donorStat = stat.branch[donor];
        const transferable = Math.floor((surplusPool[donor] ?? 0) * 0.5);
        const qty = Math.max(1, Math.min(need, transferable));
        surplusPool[donor] = (surplusPool[donor] ?? 0) - qty;

        recs.push({
          id: `${row.StockCode}-${toBranch}-transfer`,
          kind: 'transfer',
          severity: critical ? 'critical' : 'watch',
          score: score(stat.totalSoldPositive, s.sellThrough, s.balance, critical),
          modelCode: row.ModelCode,
          stockCode: row.StockCode,
          stockGroupName: row.StockGroupName,
          supplierName: row.SupplierName,
          unitPrice: row.UnitPrice,
          toBranch,
          toBranchSold: s.sold,
          toBranchBalance: s.balance,
          toBranchSellThrough: s.sellThrough,
          fromBranch: donor,
          fromBranchBalance: donorStat.balance,
          fromBranchSellThrough: donorStat.sellThrough,
          suggestedQty: qty,
          reason: transferReason(row, toBranch, s, donor, donorStat, qty),
          status: 'open',
        });
      } else {
        recs.push({
          id: `${row.StockCode}-${toBranch}-order`,
          kind: 'order',
          severity: critical ? 'critical' : 'watch',
          score: score(stat.totalSoldPositive, s.sellThrough, s.balance, critical) - 5,
          modelCode: row.ModelCode,
          stockCode: row.StockCode,
          stockGroupName: row.StockGroupName,
          supplierName: row.SupplierName,
          unitPrice: row.UnitPrice,
          toBranch,
          toBranchSold: s.sold,
          toBranchBalance: s.balance,
          toBranchSellThrough: s.sellThrough,
          suggestedQty: need,
          reason: orderReason(row, toBranch, s, need),
          status: 'open',
        });
      }
    }
  }

  return recs.sort((a, b) => b.score - a.score);
}

function score(totalSold: number, sellThrough: number, balance: number, critical: boolean) {
  return (critical ? 100 : 45) + sellThrough * 60 + Math.log2(1 + totalSold) * 12 - balance * 0.4;
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function transferReason(
  row: ModelRow,
  toBranch: BranchCode,
  to: ModelStat['branch'][BranchCode],
  fromBranch: BranchCode,
  from: ModelStat['branch'][BranchCode],
  qty: number,
) {
  return `موديل ${row.ModelCode} (${row.StockGroupName}) يحقق نسبة بيع ${pct(to.sellThrough)} من المتوفر في فرع ${toBranch}، والرصيد الحالي ${to.balance} قطعة فقط. فرع ${fromBranch} لديه ${from.balance} قطعة بنسبة بيع ${pct(from.sellThrough)} فقط — يُنصح بنقل ${qty} قطعة من ${fromBranch} إلى ${toBranch}.`;
}

function orderReason(row: ModelRow, toBranch: BranchCode, to: ModelStat['branch'][BranchCode], qty: number) {
  return `موديل ${row.ModelCode} (${row.StockGroupName}) يحقق نسبة بيع ${pct(to.sellThrough)} من المتوفر في فرع ${toBranch}، والرصيد الحالي ${to.balance} قطعة فقط. لا يوجد رصيد فائض في الفروع الأخرى — يُنصح بطلب ${qty} قطعة إضافية من المورّد (${row.SupplierName}).`;
}

// ---- multi-snapshot trend analysis ----

export interface TrendRow {
  stockCode: string;
  modelCode: string;
  stockGroupName: string;
  supplierName: string;
  unitPrice: number;
  soldDelta: number;
  branchDelta: Record<BranchCode, number>;
  dailyVelocity: number;
  currentBalance: number;
  daysOfCover: number | null;
}

export function compareSnapshots(prev: Snapshot, curr: Snapshot): TrendRow[] {
  const daysBetween = Math.max(1, (curr.capturedAt - prev.capturedAt) / 86_400_000);
  const prevByCode = new Map(prev.rows.map((r) => [r.StockCode, r]));
  const out: TrendRow[] = [];

  for (const row of curr.rows) {
    const before = prevByCode.get(row.StockCode);
    if (!before) continue;

    const branchDelta = {} as Record<BranchCode, number>;
    let soldDelta = 0;
    for (const b of BRANCH_CODES) {
      const d = clampPos(
        (row[`${b}SoldQty` as keyof ModelRow] as number) - (before[`${b}SoldQty` as keyof ModelRow] as number),
      );
      branchDelta[b] = d;
      soldDelta += d;
    }

    const dailyVelocity = soldDelta / daysBetween;
    const daysOfCover = dailyVelocity > 0 ? row.TotalBalance / dailyVelocity : null;

    out.push({
      stockCode: row.StockCode,
      modelCode: row.ModelCode,
      stockGroupName: row.StockGroupName,
      supplierName: row.SupplierName,
      unitPrice: row.UnitPrice,
      soldDelta,
      branchDelta,
      dailyVelocity,
      currentBalance: row.TotalBalance,
      daysOfCover,
    });
  }

  return out.sort((a, b) => b.soldDelta - a.soldDelta);
}
