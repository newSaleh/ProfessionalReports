import raw from './seed.json';
import type { ModelRow, Snapshot } from '../lib/types';

/** seed.json keeps the original flat export shape ({code}SoldQty / {code}Balance columns); these are
 *  the branch codes that happen to be in that particular file — the app itself never hardcodes them. */
const SEED_BRANCHES = ['701', '706', '707', '711', '803'];

interface FlatRow {
  SupplierCode: string;
  SupplierName: string;
  StockGroupName: string;
  StockCode: string;
  ModelCode: string;
  UnitPrice: number;
  TotalQtySold: number;
  TotalBalance: number;
  [key: string]: string | number;
}

function toModelRow(r: FlatRow): ModelRow {
  const branches: ModelRow['branches'] = {};
  for (const code of SEED_BRANCHES) {
    branches[code] = { sold: Number(r[`${code}SoldQty`] ?? 0), balance: Number(r[`${code}Balance`] ?? 0) };
  }
  return {
    SupplierCode: r.SupplierCode,
    SupplierName: r.SupplierName,
    StockGroupName: r.StockGroupName,
    StockCode: r.StockCode,
    ModelCode: r.ModelCode,
    UnitPrice: r.UnitPrice,
    TotalQtySold: r.TotalQtySold,
    TotalBalance: r.TotalBalance,
    branches,
  };
}

export const SEED_ROWS: ModelRow[] = (raw as unknown as FlatRow[]).map(toModelRow);

export const SEED_SNAPSHOT: Snapshot = {
  id: 'seed-2026-07-09',
  date: '2026-07-09',
  capturedAt: new Date('2026-07-09T09:19:39').getTime(),
  label: 'أفضل الموديلات — 09 يوليو 2026',
  source: 'seed',
  rows: SEED_ROWS,
  branches: SEED_BRANCHES,
};
