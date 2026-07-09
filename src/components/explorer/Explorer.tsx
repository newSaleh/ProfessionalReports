import { useMemo, useState, type ReactNode } from 'react';
import type { AppData } from '../../hooks/useAppData';
import type { ModelRow } from '../../lib/types';
import { Card } from '../common/Card';
import { IconChevronDown, IconDownload, IconSearch } from '../common/Icons';
import { MiniBranchBar } from '../common/MiniBranchBar';
import { fmtNum, fmtPct } from '../../lib/format';
import { computeModelStat } from '../../lib/analytics';
import { exportModelsExcel } from '../../lib/exportWorkbook';
import { ModelDetailDrawer } from './ModelDetailDrawer';
import clsx from 'clsx';

type SortKey = 'sold' | 'balance' | 'price' | 'sellThrough';

export function Explorer({ data }: { data: AppData }) {
  const rows = data.selectedSnapshot?.rows ?? [];
  const branches = data.selectedSnapshot?.branches ?? [];
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('sold');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<ModelRow | null>(null);

  const categories = useMemo(() => [...new Set(rows.map((r) => r.StockGroupName))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (category !== 'all' && r.StockGroupName !== category) return false;
      if (!q) return true;
      return (
        r.ModelCode.toLowerCase().includes(q) ||
        r.StockCode.toLowerCase().includes(q) ||
        r.SupplierName.toLowerCase().includes(q) ||
        r.SupplierCode.toLowerCase().includes(q) ||
        r.StockGroupName.toLowerCase().includes(q)
      );
    });

    const val = (r: ModelRow) => {
      switch (sortKey) {
        case 'sold':
          return Math.max(0, r.TotalQtySold);
        case 'balance':
          return Math.max(0, r.TotalBalance);
        case 'price':
          return r.UnitPrice;
        case 'sellThrough': {
          const s = computeModelStat(r, branches);
          const avail = s.totalSoldPositive + s.totalBalancePositive;
          return avail > 0 ? s.totalSoldPositive / avail : 0;
        }
      }
    };
    list = [...list].sort((a, b) => (val(a) - val(b)) * (sortDir === 'asc' ? 1 : -1));
    return list;
  }, [rows, branches, search, category, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            مستكشف الموديلات
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {filtered.length} من {rows.length} موديل — ابحث، رتّب، وافتح أي موديل لرؤية أدائه في كل فرع
          </p>
        </div>
        <button
          onClick={() => exportModelsExcel(filtered, branches, data.branchNames, data.selectedSnapshot?.date ?? '')}
          className="flex items-center gap-1.5 text-sm font-bold rounded-xl px-3.5 py-2.5 border"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <IconDownload className="w-4 h-4" />
          تصدير Excel
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <IconSearch className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3" style={{ color: 'var(--muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالموديل، كود الصنف، المورّد، أو الفئة…"
            className="w-full rounded-xl border ps-9 pe-3 py-2.5 text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="appearance-none rounded-xl border ps-8 pe-3 py-2.5 text-sm font-bold"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
          >
            <option value="all">كل الفئات</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <IconChevronDown className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-2.5 pointer-events-none" style={{ color: 'var(--muted)' }} />
        </div>
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: '68vh' }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10" style={{ background: 'var(--surface-1)' }}>
              <tr className="border-b text-xs" style={{ borderColor: 'var(--border)' }}>
                <Th>#</Th>
                <Th>الموديل</Th>
                <Th align="start">الفئة / المورّد</Th>
                <ThSort label="السعر" active={sortKey === 'price'} dir={sortDir} onClick={() => toggleSort('price')} />
                <Th align="start">توزيع المبيعات</Th>
                <ThSort label="مباع" active={sortKey === 'sold'} dir={sortDir} onClick={() => toggleSort('sold')} />
                <ThSort label="الرصيد" active={sortKey === 'balance'} dir={sortDir} onClick={() => toggleSort('balance')} />
                <ThSort label="نسبة البيع" active={sortKey === 'sellThrough'} dir={sortDir} onClick={() => toggleSort('sellThrough')} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const stat = computeModelStat(r, branches);
                const avail = stat.totalSoldPositive + stat.totalBalancePositive;
                const sellThrough = avail > 0 ? stat.totalSoldPositive / avail : 0;
                return (
                  <tr
                    key={r.StockCode}
                    onClick={() => setSelected(r)}
                    className="border-b cursor-pointer last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <Td muted>{i + 1}</Td>
                    <Td>
                      <div className="font-extrabold" style={{ color: 'var(--text-primary)' }}>
                        {r.ModelCode}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                        {r.StockCode}
                      </div>
                    </Td>
                    <Td align="start">
                      <div className="truncate max-w-[160px]" style={{ color: 'var(--text-primary)' }}>
                        {r.StockGroupName}
                      </div>
                      <div className="text-[11px] truncate max-w-[160px]" style={{ color: 'var(--muted)' }}>
                        {r.SupplierName} · {r.SupplierCode}
                      </div>
                    </Td>
                    <Td>{fmtNum(r.UnitPrice)}</Td>
                    <Td align="start">
                      <div className="w-28">
                        <MiniBranchBar row={r} branches={branches} />
                      </div>
                    </Td>
                    <Td bold>{fmtNum(Math.max(0, r.TotalQtySold))}</Td>
                    <Td>{fmtNum(Math.max(0, r.TotalBalance))}</Td>
                    <Td>
                      <span
                        className="font-bold"
                        style={{ color: sellThrough >= data.thresholds.highSellThrough ? 'var(--critical)' : 'var(--text-primary)' }}
                      >
                        {fmtPct(sellThrough)}
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
              لا توجد نتائج مطابقة.
            </div>
          )}
        </div>
      </Card>

      {selected && <ModelDetailDrawer row={selected} data={data} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Th({ children, align = 'center' }: { children: ReactNode; align?: 'center' | 'start' }) {
  return (
    <th className={clsx('px-3 py-3 font-bold whitespace-nowrap', align === 'center' ? 'text-center' : 'text-start')} style={{ color: 'var(--muted)' }}>
      {children}
    </th>
  );
}

function ThSort({ label, active, dir, onClick }: { label: string; active: boolean; dir: 'asc' | 'desc'; onClick: () => void }) {
  return (
    <th className="px-3 py-3 font-bold whitespace-nowrap text-center cursor-pointer select-none" onClick={onClick} style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}>
      <span className="inline-flex items-center gap-1">
        {label}
        {active && <IconChevronDown className={clsx('w-3 h-3 transition-transform', dir === 'asc' && 'rotate-180')} />}
      </span>
    </th>
  );
}

function Td({ children, align = 'center', bold = false, muted = false }: { children: ReactNode; align?: 'center' | 'start'; bold?: boolean; muted?: boolean }) {
  return (
    <td
      className={clsx('px-3 py-2.5 tabular-nums', align === 'center' ? 'text-center' : 'text-start', bold && 'font-extrabold')}
      style={{ color: muted ? 'var(--muted)' : 'var(--text-primary)' }}
    >
      {children}
    </td>
  );
}
