import { BRANCH_CODES, type ModelRow } from '../../lib/types';
import type { AppData } from '../../hooks/useAppData';
import { computeModelStat, branchName } from '../../lib/analytics';
import { branchColor } from '../common/BranchTag';
import { fmtNum, fmtPct } from '../../lib/format';
import { IconX } from '../common/Icons';
import { RecommendationCard } from '../recommendations/RecommendationCard';
import { Badge } from '../common/Badge';

export function ModelDetailDrawer({ row, data, onClose }: { row: ModelRow; data: AppData; onClose: () => void }) {
  const stat = computeModelStat(row);
  const related = data.recommendations.filter((r) => r.stockCode === row.StockCode);
  const maxSold = Math.max(1, ...BRANCH_CODES.map((b) => stat.branch[b].sold));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 animate-in" onClick={onClose} />
      <aside
        className="relative w-full sm:w-[440px] h-full overflow-y-auto shadow-2xl animate-in"
        style={{ background: 'var(--surface-1)' }}
      >
        <div
          className="sticky top-0 flex items-start justify-between gap-3 p-5 border-b backdrop-blur-md z-10"
          style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface-1) 90%, transparent)' }}
        >
          <div>
            <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
              {row.StockCode}
            </div>
            <h3 className="text-lg font-extrabold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {row.ModelCode}
            </h3>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {row.StockGroupName} · {row.SupplierName}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg shrink-0" style={{ color: 'var(--muted)' }}>
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="السعر" value={fmtNum(row.UnitPrice)} />
            <MiniStat label="إجمالي المباع" value={fmtNum(stat.totalSoldPositive)} />
            <MiniStat label="إجمالي الرصيد" value={fmtNum(stat.totalBalancePositive)} />
          </div>

          <div>
            <h4 className="text-sm font-extrabold mb-2.5" style={{ color: 'var(--text-primary)' }}>
              الأداء حسب الفرع
            </h4>
            <div className="flex flex-col gap-3">
              {BRANCH_CODES.map((b) => {
                const s = stat.branch[b];
                return (
                  <div key={b} className="rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: branchColor(b) }} />
                        {branchName(b, data.branchNames)}
                      </span>
                      <Badge tone={s.sellThrough >= data.thresholds.highSellThrough ? 'critical' : s.sellThrough <= data.thresholds.surplusSellThrough ? 'neutral' : 'accent'} dot={false}>
                        {fmtPct(s.sellThrough)} نسبة بيع
                      </Badge>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ background: 'var(--gridline)' }}>
                      <div className="h-full rounded-full" style={{ width: `${(s.sold / maxSold) * 100}%`, background: branchColor(b) }} />
                    </div>
                    <div className="flex items-center justify-between text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      <span>مباع: {fmtNum(s.sold)}</span>
                      <span>رصيد: {fmtNum(s.balance)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {related.length > 0 && (
            <div>
              <h4 className="text-sm font-extrabold mb-2.5" style={{ color: 'var(--text-primary)' }}>
                توصيات متعلقة بهذا الموديل
              </h4>
              <div className="flex flex-col gap-3">
                {related.map((r) => (
                  <RecommendationCard key={r.id} rec={r} branchNames={data.branchNames} onStatusChange={data.setRecommendationStatus} />
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: 'var(--page)' }}>
      <div className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
        {label}
      </div>
      <div className="text-base font-extrabold tabular-nums mt-0.5" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}
