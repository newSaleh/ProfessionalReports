import {
  defaultBranchName,
  type BalanceAnomaly,
  type BranchCode,
  type ModelRow,
  type ModelStat,
  type Recommendation,
  type Snapshot,
  type ThresholdSettings,
} from './types';

const clampPos = (n: number) => (n > 0 ? n : 0);

export function branchName(code: BranchCode, names: Partial<Record<BranchCode, string>>) {
  return names[code] || defaultBranchName(code);
}

export function computeModelStat(row: ModelRow, branches: BranchCode[]): ModelStat {
  let totalSoldPositive = 0;
  let totalBalancePositive = 0;

  for (const b of branches) {
    const data = row.branches[b];
    totalSoldPositive += clampPos(data?.sold ?? 0);
    totalBalancePositive += clampPos(data?.balance ?? 0);
  }

  const branch = {} as ModelStat['branch'];
  let bestBranch: BranchCode | null = null;
  let worstBranch: BranchCode | null = null;

  for (const b of branches) {
    const data = row.branches[b] ?? { sold: 0, balance: 0 };
    const sold = clampPos(data.sold);
    const rawBalance = data.balance;
    const balanceError = rawBalance < 0;
    const balance = clampPos(rawBalance);
    const avail = sold + balance;
    const sellThrough = avail > 0 ? sold / avail : 0;
    const demandShare = totalSoldPositive > 0 ? sold / totalSoldPositive : 1 / branches.length;
    const stockShare = totalBalancePositive > 0 ? balance / totalBalancePositive : 1 / branches.length;
    branch[b] = { sold, balance, rawBalance, balanceError, sellThrough, demandShare, stockShare, imbalance: demandShare - stockShare };
    if (bestBranch === null || sold > branch[bestBranch].sold) bestBranch = b;
    if (worstBranch === null || sold < branch[worstBranch].sold) worstBranch = b;
  }

  return { row, totalSoldPositive, totalBalancePositive, branch, bestBranch, worstBranch };
}

export function computeAllStats(rows: ModelRow[], branches: BranchCode[]): ModelStat[] {
  return rows.map((r) => computeModelStat(r, branches));
}

/** Negative balances are physically impossible — flag them as data errors instead of treating them as zero stock. */
export function findBalanceAnomalies(rows: ModelRow[], branches: BranchCode[]): BalanceAnomaly[] {
  const out: BalanceAnomaly[] = [];
  for (const row of rows) {
    for (const b of branches) {
      const bal = row.branches[b]?.balance ?? 0;
      if (bal < 0) {
        out.push({
          id: `${row.StockCode}-${b}-anomaly`,
          stockCode: row.StockCode,
          modelCode: row.ModelCode,
          stockGroupName: row.StockGroupName,
          supplierCode: row.SupplierCode,
          supplierName: row.SupplierName,
          branch: b,
          rawBalance: bal,
        });
      }
    }
  }
  return out.sort((a, b) => a.rawBalance - b.rawBalance);
}

/**
 * Core "wow" feature: for every well-selling model, look at each branch on its own —
 * a branch selling fast with little stock left should get more ordered in from the
 * supplier; a branch sitting on stock that barely moves should send it back to the
 * supplier. There is no moving stock between branches in this business.
 */
export function buildRecommendations(rows: ModelRow[], branches: BranchCode[], thresholds: ThresholdSettings): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const row of rows) {
    const stat = computeModelStat(row, branches);
    if (stat.totalSoldPositive < thresholds.minPopularity) continue;

    const activeBranches = branches.filter((b) => stat.branch[b].sold > 0);
    const avgSoldPerActiveBranch = stat.totalSoldPositive / Math.max(1, activeBranches.length);

    for (const b of branches) {
      const s = stat.branch[b];
      if (s.balanceError) continue; // surfaced separately as a data-quality alert, not a stocking decision

      if (s.sellThrough >= thresholds.highSellThrough && s.balance <= thresholds.lowStockUnits) {
        const target = Math.max(s.sold, avgSoldPerActiveBranch) * thresholds.coverTargetMultiplier;
        const qty = Math.max(1, Math.round(target - s.balance));
        const critical = s.balance <= thresholds.lowStockUnits / 2;
        recs.push({
          id: `${row.StockCode}-${b}-order`,
          kind: 'order',
          severity: critical ? 'critical' : 'watch',
          score: score(stat.totalSoldPositive, s.sellThrough, s.balance, critical),
          modelCode: row.ModelCode,
          stockCode: row.StockCode,
          stockGroupName: row.StockGroupName,
          supplierCode: row.SupplierCode,
          supplierName: row.SupplierName,
          unitPrice: row.UnitPrice,
          branch: b,
          branchSold: s.sold,
          branchBalance: s.balance,
          branchSellThrough: s.sellThrough,
          suggestedQty: qty,
          reason: orderReason(row, b, s, qty),
          status: 'open',
        });
      } else if (s.sellThrough <= thresholds.surplusSellThrough && s.balance >= thresholds.surplusMinBalance) {
        recs.push({
          id: `${row.StockCode}-${b}-return`,
          kind: 'return',
          severity: s.sellThrough === 0 ? 'critical' : 'watch',
          score: score(stat.totalSoldPositive, 1 - s.sellThrough, -s.balance, s.sellThrough === 0) - 8,
          modelCode: row.ModelCode,
          stockCode: row.StockCode,
          stockGroupName: row.StockGroupName,
          supplierCode: row.SupplierCode,
          supplierName: row.SupplierName,
          unitPrice: row.UnitPrice,
          branch: b,
          branchSold: s.sold,
          branchBalance: s.balance,
          branchSellThrough: s.sellThrough,
          suggestedQty: s.balance,
          reason: returnReason(row, b, s),
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

function orderReason(row: ModelRow, b: BranchCode, s: ModelStat['branch'][BranchCode], qty: number) {
  return `موديل ${row.ModelCode} (${row.StockGroupName}) يحقق نسبة بيع ${pct(s.sellThrough)} من المتوفر في فرع ${b}، والرصيد الحالي ${s.balance} قطعة فقط — يُنصح بطلب ${qty} قطعة إضافية من المورّد ${row.SupplierName} (${row.SupplierCode}).`;
}

function returnReason(row: ModelRow, b: BranchCode, s: ModelStat['branch'][BranchCode]) {
  return `موديل ${row.ModelCode} (${row.StockGroupName}) بطيء الحركة في فرع ${b} — نسبة بيع ${pct(s.sellThrough)} فقط من رصيد ${s.balance} قطعة — يُنصح بإعادة الكمية إلى المورّد ${row.SupplierName} (${row.SupplierCode}) بدل الاحتفاظ بها راكدة.`;
}

// ---- multi-snapshot trend analysis ----

export interface TrendRow {
  stockCode: string;
  modelCode: string;
  stockGroupName: string;
  supplierCode: string;
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
    for (const b of curr.branches) {
      const d = clampPos((row.branches[b]?.sold ?? 0) - (before.branches[b]?.sold ?? 0));
      branchDelta[b] = d;
      soldDelta += d;
    }

    const dailyVelocity = soldDelta / daysBetween;
    const daysOfCover = dailyVelocity > 0 ? row.TotalBalance / dailyVelocity : null;

    out.push({
      stockCode: row.StockCode,
      modelCode: row.ModelCode,
      stockGroupName: row.StockGroupName,
      supplierCode: row.SupplierCode,
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
