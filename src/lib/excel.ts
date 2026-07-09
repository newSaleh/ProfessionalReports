import * as XLSX from 'xlsx';
import type { ModelRow } from './types';

const REQUIRED_COLUMNS: (keyof ModelRow)[] = [
  'SupplierCode',
  'SupplierName',
  'StockGroupName',
  'StockCode',
  'ModelCode',
  'UnitPrice',
  'TotalQtySold',
  'TotalBalance',
];

export class ExcelParseError extends Error {}

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  const n = Number(String(v ?? '').trim());
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  return String(v ?? '').trim();
}

/** Try to pull a YYYY-MM-DD date out of an export filename like TopModels_20260709091939.xlsx */
export function dateFromFilename(filename: string): string | null {
  const m = filename.match(/(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/);
  if (!m) return null;
  const [, y, mo, d] = m;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${y}-${mo}-${d}`;
}

export async function parseTopModelsFile(file: File): Promise<ModelRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new ExcelParseError('الملف لا يحتوي على أي صفحة بيانات.');

  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
  if (raw.length === 0) throw new ExcelParseError('الملف فارغ — لا توجد صفوف بيانات.');

  const firstRowKeys = new Set(Object.keys(raw[0]));
  const missing = REQUIRED_COLUMNS.filter((c) => !firstRowKeys.has(c));
  if (missing.length > 0) {
    throw new ExcelParseError(
      `تنسيق الملف غير متوافق. الأعمدة الناقصة: ${missing.join('، ')}. تأكد من رفع نفس تقرير "Top Models".`,
    );
  }

  const rows: ModelRow[] = raw
    .filter((r) => r.SupplierCode != null && String(r.StockCode ?? '').trim() !== '')
    .map((r) => ({
      SupplierCode: str(r.SupplierCode),
      SupplierName: str(r.SupplierName),
      StockGroupName: str(r.StockGroupName),
      StockCode: str(r.StockCode),
      ModelCode: str(r.ModelCode),
      UnitPrice: num(r.UnitPrice),
      TotalQtySold: num(r.TotalQtySold),
      TotalBalance: num(r.TotalBalance),
      '701SoldQty': num(r['701SoldQty']),
      '706SoldQty': num(r['706SoldQty']),
      '707SoldQty': num(r['707SoldQty']),
      '711SoldQty': num(r['711SoldQty']),
      '803SoldQty': num(r['803SoldQty']),
      '701Balance': num(r['701Balance']),
      '706Balance': num(r['706Balance']),
      '707Balance': num(r['707Balance']),
      '711Balance': num(r['711Balance']),
      '803Balance': num(r['803Balance']),
    }));

  if (rows.length === 0) throw new ExcelParseError('لم يتم العثور على صفوف بيانات صالحة في الملف.');
  return rows;
}
