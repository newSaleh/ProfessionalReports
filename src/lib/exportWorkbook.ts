import * as XLSX from 'xlsx';
import type { BalanceAnomaly, BranchCode, ModelRow, Recommendation, Snapshot } from './types';
import { branchName, computeModelStat } from './analytics';

function autoWidth(rows: Record<string, unknown>[]): { wch: number }[] {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0]);
  return keys.map((k) => {
    const longest = Math.max(k.length, ...rows.map((r) => String(r[k] ?? '').length));
    return { wch: Math.min(48, Math.max(10, longest + 2)) };
  });
}

function makeSheet(rows: Record<string, unknown>[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = autoWidth(rows);
  return ws;
}

function newWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  wb.Workbook = { Views: [{ RTL: true }] };
  return wb;
}

function download(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}

const KIND_LABEL: Record<Recommendation['kind'], string> = { order: 'طلب من المورّد', return: 'إعادة للمورّد' };
const SEVERITY_LABEL: Record<Recommendation['severity'], string> = { critical: 'عاجل', watch: 'مراقبة' };

export function exportRecommendationsExcel(
  recs: Recommendation[],
  branchNames: Partial<Record<BranchCode, string>>,
  snapshotDate: string,
) {
  const rows = recs.map((r) => ({
    الموديل: r.modelCode,
    'كود الصنف': r.stockCode,
    الفئة: r.stockGroupName,
    'اسم المورّد': r.supplierName,
    'رقم المورّد': r.supplierCode,
    النوع: KIND_LABEL[r.kind],
    الأولوية: SEVERITY_LABEL[r.severity],
    الفرع: branchName(r.branch, branchNames),
    'الكمية المقترحة': r.suggestedQty,
    'رصيد الفرع': r.branchBalance,
    'مباع بالفرع': r.branchSold,
    'نسبة البيع': `${Math.round(r.branchSellThrough * 100)}%`,
    'سعر الوحدة': r.unitPrice,
    الحالة: r.status === 'open' ? 'مفتوحة' : r.status === 'done' ? 'منفّذة' : 'متجاهلة',
    السبب: r.reason,
  }));
  const wb = newWorkbook();
  XLSX.utils.book_append_sheet(wb, makeSheet(rows), 'التوصيات');
  download(wb, `توصيات-التوزيع-${snapshotDate}.xlsx`);
}

export function exportModelsExcel(
  rows: ModelRow[],
  branches: BranchCode[],
  branchNames: Partial<Record<BranchCode, string>>,
  snapshotDate: string,
) {
  const sheetRows = rows.map((r) => {
    const stat = computeModelStat(r, branches);
    const avail = stat.totalSoldPositive + stat.totalBalancePositive;
    const base: Record<string, unknown> = {
      الموديل: r.ModelCode,
      'كود الصنف': r.StockCode,
      الفئة: r.StockGroupName,
      'اسم المورّد': r.SupplierName,
      'رقم المورّد': r.SupplierCode,
      'سعر الوحدة': r.UnitPrice,
    };
    for (const b of branches) {
      const bs = stat.branch[b];
      base[`${branchName(b, branchNames)} - مباع`] = bs.sold;
      base[`${branchName(b, branchNames)} - رصيد`] = bs.balanceError ? `خطأ (${bs.rawBalance})` : bs.balance;
    }
    base['إجمالي المباع'] = stat.totalSoldPositive;
    base['إجمالي الرصيد'] = stat.totalBalancePositive;
    base['نسبة البيع الإجمالية'] = avail > 0 ? `${Math.round((stat.totalSoldPositive / avail) * 100)}%` : '0%';
    return base;
  });
  const wb = newWorkbook();
  XLSX.utils.book_append_sheet(wb, makeSheet(sheetRows), 'كل الموديلات');
  download(wb, `موديلات-${snapshotDate}.xlsx`);
}

export function exportFullReportExcel(payload: {
  snapshot: Snapshot;
  recommendations: Recommendation[];
  anomalies: BalanceAnomaly[];
  branchNames: Partial<Record<BranchCode, string>>;
}) {
  const { snapshot, recommendations, anomalies, branchNames } = payload;
  const openRecs = recommendations.filter((r) => r.status === 'open');
  const totalSold = snapshot.rows.reduce((a, r) => a + Math.max(0, r.TotalQtySold), 0);
  const totalBalance = snapshot.rows.reduce((a, r) => a + Math.max(0, r.TotalBalance), 0);

  const overviewRows = [
    { المؤشر: 'تاريخ اللقطة', القيمة: snapshot.date },
    { المؤشر: 'عدد الموديلات', القيمة: snapshot.rows.length },
    { المؤشر: 'عدد الفروع', القيمة: snapshot.branches.length },
    { المؤشر: 'إجمالي القطع المباعة', القيمة: totalSold },
    { المؤشر: 'إجمالي الرصيد الحالي', القيمة: totalBalance },
    { المؤشر: 'توصيات مفتوحة', القيمة: openRecs.length },
    { المؤشر: 'توصيات عاجلة', القيمة: openRecs.filter((r) => r.severity === 'critical').length },
    { المؤشر: 'طلبات من المورّد', القيمة: openRecs.filter((r) => r.kind === 'order').length },
    { المؤشر: 'إعادات للمورّد', القيمة: openRecs.filter((r) => r.kind === 'return').length },
    { المؤشر: 'أخطاء رصيد (سالب)', القيمة: anomalies.length },
  ];

  const recRows = openRecs.map((r) => ({
    الموديل: r.modelCode,
    الفئة: r.stockGroupName,
    'اسم المورّد': r.supplierName,
    'رقم المورّد': r.supplierCode,
    النوع: KIND_LABEL[r.kind],
    الأولوية: SEVERITY_LABEL[r.severity],
    الفرع: branchName(r.branch, branchNames),
    'الكمية المقترحة': r.suggestedQty,
    'رصيد الفرع': r.branchBalance,
    'نسبة البيع': `${Math.round(r.branchSellThrough * 100)}%`,
    السبب: r.reason,
  }));

  const anomalyRows = anomalies.map((a) => ({
    الموديل: a.modelCode,
    'كود الصنف': a.stockCode,
    الفئة: a.stockGroupName,
    'اسم المورّد': a.supplierName,
    'رقم المورّد': a.supplierCode,
    الفرع: branchName(a.branch, branchNames),
    'الرصيد المسجَّل': a.rawBalance,
    ملاحظة: 'رصيد سالب — خطأ بيانات يحتاج تصحيحًا في النظام المصدر',
  }));

  const modelRows = snapshot.rows.map((r) => {
    const stat = computeModelStat(r, snapshot.branches);
    return {
      الموديل: r.ModelCode,
      'كود الصنف': r.StockCode,
      الفئة: r.StockGroupName,
      'اسم المورّد': r.SupplierName,
      'رقم المورّد': r.SupplierCode,
      'سعر الوحدة': r.UnitPrice,
      'إجمالي المباع': stat.totalSoldPositive,
      'إجمالي الرصيد': stat.totalBalancePositive,
    };
  });

  const wb = newWorkbook();
  XLSX.utils.book_append_sheet(wb, makeSheet(overviewRows), 'نظرة عامة');
  XLSX.utils.book_append_sheet(wb, makeSheet(recRows.length ? recRows : [{ ملاحظة: 'لا توجد توصيات مفتوحة' }]), 'التوصيات');
  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(anomalyRows.length ? anomalyRows : [{ ملاحظة: 'لا توجد أخطاء بيانات' }]),
    'تنبيهات البيانات',
  );
  XLSX.utils.book_append_sheet(wb, makeSheet(modelRows), 'كل الموديلات');
  download(wb, `تقرير-رادار-الموديلات-${snapshot.date}.xlsx`);
}
