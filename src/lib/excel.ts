import * as XLSX from 'xlsx';
import type { BranchCode, ModelRow } from './types';

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

/** Detect every "{code}SoldQty" / "{code}Balance" column pair — the branch codes themselves are
 *  whatever the source system uses, never hardcoded, so this works for any company's export. */
function detectBranchCodes(headers: string[]): BranchCode[] {
  const codes: BranchCode[] = [];
  const seen = new Set<string>();
  for (const h of headers) {
    const m = h.match(/^(.+)SoldQty$/);
    if (!m || m[1] === 'Total') continue;
    const code = m[1];
    if (seen.has(code)) continue;
    if (!headers.includes(`${code}Balance`)) continue;
    seen.add(code);
    codes.push(code);
  }
  return codes;
}

export interface ParsedSheet {
  rows: ModelRow[];
  branches: BranchCode[];
}

export async function parseTopModelsFile(file: File): Promise<ParsedSheet> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new ExcelParseError('الملف لا يحتوي على أي صفحة بيانات.');

  const headerRow = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, range: 0 })[0] ?? [];
  const headers = headerRow.map((h) => String(h ?? '').trim());

  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
  if (raw.length === 0) throw new ExcelParseError('الملف فارغ — لا توجد صفوف بيانات.');

  const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length > 0) {
    throw new ExcelParseError(
      `تنسيق الملف غير متوافق. الأعمدة الناقصة: ${missing.join('، ')}. تأكد من رفع نفس تقرير "Top Models".`,
    );
  }

  const branches = detectBranchCodes(headers);
  if (branches.length === 0) {
    throw new ExcelParseError(
      'لم يتم العثور على أعمدة أي فرع (مثل 701SoldQty و701Balance). تأكد أن الملف يحتوي على عمودَي كمية مباعة ورصيد لكل فرع.',
    );
  }

  const rows: ModelRow[] = raw
    .filter((r) => r.SupplierCode != null && String(r.StockCode ?? '').trim() !== '')
    .map((r) => {
      const branchData: ModelRow['branches'] = {};
      for (const code of branches) {
        branchData[code] = { sold: num(r[`${code}SoldQty`]), balance: num(r[`${code}Balance`]) };
      }
      return {
        SupplierCode: str(r.SupplierCode),
        SupplierName: str(r.SupplierName),
        StockGroupName: str(r.StockGroupName),
        StockCode: str(r.StockCode),
        ModelCode: str(r.ModelCode),
        UnitPrice: num(r.UnitPrice),
        TotalQtySold: num(r.TotalQtySold),
        TotalBalance: num(r.TotalBalance),
        branches: branchData,
      };
    });

  if (rows.length === 0) throw new ExcelParseError('لم يتم العثور على صفوف بيانات صالحة في الملف.');
  return { rows, branches };
}
