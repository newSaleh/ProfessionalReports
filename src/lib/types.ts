/** A branch code is whatever string the source system uses (e.g. "701", "RIYADH-1") — never hardcoded. */
export type BranchCode = string;

export interface ModelRow {
  SupplierCode: string;
  SupplierName: string;
  StockGroupName: string;
  StockCode: string;
  ModelCode: string;
  UnitPrice: number;
  TotalQtySold: number;
  TotalBalance: number;
  /** Per-branch figures, keyed by whatever branch codes this snapshot has. */
  branches: Record<BranchCode, { sold: number; balance: number }>;
}

export interface Snapshot {
  id: string;
  /** ISO date, e.g. 2026-07-09 */
  date: string;
  /** ms epoch of when it was captured/uploaded */
  capturedAt: number;
  label: string;
  source: 'seed' | 'upload';
  rows: ModelRow[];
  /** Branch codes detected in this snapshot's source file, in column order. */
  branches: BranchCode[];
}

export interface BranchSettings {
  names: Partial<Record<BranchCode, string>>;
}

export interface ThresholdSettings {
  minPopularity: number;
  highSellThrough: number;
  lowStockUnits: number;
  surplusSellThrough: number;
  surplusMinBalance: number;
  coverTargetMultiplier: number;
}

export const DEFAULT_THRESHOLDS: ThresholdSettings = {
  minPopularity: 5,
  highSellThrough: 0.7,
  lowStockUnits: 12,
  surplusSellThrough: 0.25,
  surplusMinBalance: 15,
  coverTargetMultiplier: 1.6,
};

export function defaultBranchName(code: BranchCode): string {
  return `فرع ${code}`;
}

/** No more "move stock between branches" — the real workflow is either order more from the
 *  supplier for a branch that's selling out, or return slow-moving stock to the supplier. */
export type RecommendationKind = 'order' | 'return';
export type RecommendationSeverity = 'critical' | 'watch';

export interface Recommendation {
  id: string;
  kind: RecommendationKind;
  severity: RecommendationSeverity;
  score: number;
  modelCode: string;
  stockCode: string;
  stockGroupName: string;
  supplierCode: string;
  supplierName: string;
  unitPrice: number;
  branch: BranchCode;
  branchSold: number;
  branchBalance: number;
  branchSellThrough: number;
  suggestedQty: number;
  reason: string;
  status: 'open' | 'done' | 'dismissed';
}

export interface BranchStat {
  sold: number;
  /** Balance clamped to >= 0 for math (ratios, totals). Use rawBalance to detect/display errors. */
  balance: number;
  rawBalance: number;
  balanceError: boolean;
  sellThrough: number;
  demandShare: number;
  stockShare: number;
  imbalance: number;
}

export interface ModelStat {
  row: ModelRow;
  totalSoldPositive: number;
  totalBalancePositive: number;
  branch: Record<BranchCode, BranchStat>;
  bestBranch: BranchCode | null;
  worstBranch: BranchCode | null;
}

/** A branch balance that is physically impossible (negative) — a data-entry error upstream, surfaced instead of silently zeroed. */
export interface BalanceAnomaly {
  id: string;
  stockCode: string;
  modelCode: string;
  stockGroupName: string;
  supplierCode: string;
  supplierName: string;
  branch: BranchCode;
  rawBalance: number;
}
