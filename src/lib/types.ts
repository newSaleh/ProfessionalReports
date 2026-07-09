export const BRANCH_CODES = ['701', '706', '707', '711', '803'] as const;
export type BranchCode = (typeof BRANCH_CODES)[number];

export interface ModelRow {
  SupplierCode: string;
  SupplierName: string;
  StockGroupName: string;
  StockCode: string;
  ModelCode: string;
  UnitPrice: number;
  TotalQtySold: number;
  TotalBalance: number;
  '701SoldQty': number;
  '706SoldQty': number;
  '707SoldQty': number;
  '711SoldQty': number;
  '803SoldQty': number;
  '701Balance': number;
  '706Balance': number;
  '707Balance': number;
  '711Balance': number;
  '803Balance': number;
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

export const DEFAULT_BRANCH_NAMES: Record<BranchCode, string> = {
  '701': 'فرع 701',
  '706': 'فرع 706',
  '707': 'فرع 707',
  '711': 'فرع 711',
  '803': 'فرع 803',
};

export type RecommendationKind = 'transfer' | 'order';
export type RecommendationSeverity = 'critical' | 'watch';

export interface Recommendation {
  id: string;
  kind: RecommendationKind;
  severity: RecommendationSeverity;
  score: number;
  modelCode: string;
  stockCode: string;
  stockGroupName: string;
  supplierName: string;
  unitPrice: number;
  toBranch: BranchCode;
  toBranchSold: number;
  toBranchBalance: number;
  toBranchSellThrough: number;
  fromBranch?: BranchCode;
  fromBranchBalance?: number;
  fromBranchSellThrough?: number;
  suggestedQty: number;
  reason: string;
  status: 'open' | 'done' | 'dismissed';
}

export interface ModelStat {
  row: ModelRow;
  totalSoldPositive: number;
  totalBalancePositive: number;
  branch: Record<
    BranchCode,
    {
      sold: number;
      balance: number;
      sellThrough: number;
      demandShare: number;
      stockShare: number;
      imbalance: number;
    }
  >;
  bestBranch: BranchCode;
  worstBranch: BranchCode;
}
