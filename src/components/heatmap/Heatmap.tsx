import { useMemo, useState } from 'react';
import type { AppData } from '../../hooks/useAppData';
import { BRANCH_CODES, type BranchCode } from '../../lib/types';
import { Card } from '../common/Card';
import { computeModelStat, branchName } from '../../lib/analytics';
import { seqColor, seqTextColor } from '../../lib/color';
import { useIsDarkMode } from '../../hooks/useIsDarkMode';
import { fmtNum, fmtPct } from '../../lib/format';
import { IconSearch } from '../common/Icons';
import clsx from 'clsx';

type Metric = 'sellThrough' | 'sold' | 'balance';

const METRICS: { id: Metric; label: string }[] = [
  { id: 'sellThrough', label: 'نسبة البيع' },
  { id: 'sold', label: 'الكمية المباعة' },
  { id: 'balance', label: 'الرصيد الحالي' },
];

const LIMITS = [20, 40, 80, 154];

export function Heatmap({ data }: { data: AppData }) {
  const rows = data.selectedSnapshot?.rows ?? [];
  const dark = useIsDarkMode();
  const [metric, setMetric] = useState<Metric>('sellThrough');
  const [limit, setLimit] = useState(40);
  const [search, setSearch] = useState('');

  const enriched = useMemo(() => rows.map((r) => ({ row: r, stat: computeModelStat(r) })), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = enriched;
    if (q) {
      list = list.filter(
        ({ row }) =>
          row.ModelCode.toLowerCase().includes(q) ||
          row.StockGroupName.toLowerCase().includes(q) ||
          row.SupplierName.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => b.stat.totalSoldPositive - a.stat.totalSoldPositive).slice(0, limit);
  }, [enriched, search, limit]);

  const globalMax = useMemo(() => {
    if (metric === 'sellThrough') return 1;
    let max = 1;
    for (const { stat } of enriched) {
      for (const b of BRANCH_CODES) {
        const v = metric === 'sold' ? stat.branch[b].sold : stat.branch[b].balance;
        if (v > max) max = v;
      }
    }
    return max;
  }, [enriched, metric]);

  const cellValue = (stat: ReturnType<typeof computeModelStat>, b: BranchCode) => {
    if (metric === 'sellThrough') return stat.branch[b].sellThrough;
    if (metric === 'sold') return stat.branch[b].sold;
    return stat.branch[b].balance;
  };

  const cellLabel = (v: number) => (metric === 'sellThrough' ? fmtPct(v) : fmtNum(v));

  return (
    <div className="flex flex-col gap-5 animate-in">
      <div>
        <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
          خريطة الفروع الحرارية
        </h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          قارن أداء كل موديل عبر الفروع الخمسة بنظرة واحدة لاكتشاف فجوات التوزيع
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <IconSearch className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3" style={{ color: 'var(--muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالموديل أو الفئة أو المورّد…"
            className="w-full rounded-xl border ps-9 pe-3 py-2.5 text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex items-center gap-1.5 rounded-xl p-1" style={{ background: 'var(--gridline)' }}>
          {METRICS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              style={metric === m.id ? { background: 'var(--surface-1)', color: 'var(--text-primary)' } : { color: 'var(--text-secondary)' }}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 rounded-xl p-1" style={{ background: 'var(--gridline)' }}>
          {LIMITS.map((l) => (
            <button
              key={l}
              onClick={() => setLimit(l)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              style={limit === l ? { background: 'var(--surface-1)', color: 'var(--text-primary)' } : { color: 'var(--text-secondary)' }}
            >
              {l === 154 ? 'الكل' : `أعلى ${l}`}
            </button>
          ))}
        </div>
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: '68vh' }}>
          <table className="w-full text-xs border-separate" style={{ borderSpacing: '4px' }}>
            <thead className="sticky top-0 z-20" style={{ background: 'var(--surface-1)' }}>
              <tr>
                <th className="sticky right-0 z-10 px-2 py-2 text-start text-xs font-bold" style={{ background: 'var(--surface-1)', color: 'var(--muted)' }}>
                  الموديل
                </th>
                {BRANCH_CODES.map((b) => (
                  <th key={b} className="px-2 py-2 font-bold whitespace-nowrap" style={{ color: 'var(--muted)' }}>
                    {branchName(b, data.branchNames)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ row, stat }) => (
                <tr key={row.StockCode}>
                  <td
                    className="sticky right-0 z-10 px-2 py-1.5 font-extrabold whitespace-nowrap"
                    style={{ background: 'var(--surface-1)', color: 'var(--text-primary)' }}
                  >
                    {row.ModelCode}
                  </td>
                  {BRANCH_CODES.map((b) => {
                    const v = cellValue(stat, b);
                    const t = metric === 'sellThrough' ? v : v / globalMax;
                    const empty = v === 0;
                    return (
                      <td key={b} className="p-0">
                        <div
                          className={clsx('rounded-lg h-9 flex items-center justify-center font-bold tabular-nums')}
                          style={{
                            background: empty ? 'var(--gridline)' : seqColor(t, dark),
                            color: empty ? 'var(--muted)' : seqTextColor(t, dark),
                          }}
                          title={`${branchName(b, data.branchNames)} — ${cellLabel(v)}`}
                        >
                          {cellLabel(v)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
            لا توجد نتائج مطابقة.
          </div>
        )}
      </Card>

      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
        <span>أقل</span>
        <div className="flex h-3 rounded-full overflow-hidden w-40">
          {[0, 0.16, 0.33, 0.5, 0.66, 0.83, 1].map((t) => (
            <div key={t} className="flex-1" style={{ background: seqColor(t, dark) }} />
          ))}
        </div>
        <span>أعلى</span>
      </div>
    </div>
  );
}
