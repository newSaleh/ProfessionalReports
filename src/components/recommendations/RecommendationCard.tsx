import type { BranchCode, Recommendation } from '../../lib/types';
import { branchName } from '../../lib/analytics';
import { Badge } from '../common/Badge';
import { BranchTag } from '../common/BranchTag';
import { IconArrowLeft, IconCheck, IconPackage, IconTruck, IconX } from '../common/Icons';
import { fmtNum, fmtPct } from '../../lib/format';
import clsx from 'clsx';

export function RecommendationCard({
  rec,
  branchNames,
  onStatusChange,
  compact = false,
}: {
  rec: Recommendation;
  branchNames: Partial<Record<BranchCode, string>>;
  onStatusChange: (id: string, status: Recommendation['status']) => void;
  compact?: boolean;
}) {
  const isDone = rec.status !== 'open';

  return (
    <div
      className={clsx('rounded-xl border p-3.5 transition-opacity', isDone && 'opacity-55')}
      style={{
        borderColor: rec.severity === 'critical' && !isDone ? 'color-mix(in srgb, var(--critical) 35%, transparent)' : 'var(--border)',
        background:
          rec.severity === 'critical' && !isDone ? 'color-mix(in srgb, var(--critical) 5%, var(--surface-1))' : 'var(--surface-1)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: rec.kind === 'transfer' ? 'color-mix(in srgb, var(--branch-701) 14%, transparent)' : 'color-mix(in srgb, var(--branch-711) 14%, transparent)',
            color: rec.kind === 'transfer' ? 'var(--branch-701)' : 'var(--branch-711)',
          }}
        >
          {rec.kind === 'transfer' ? <IconTruck className="w-4.5 h-4.5" /> : <IconPackage className="w-4.5 h-4.5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="font-extrabold text-sm" style={{ color: 'var(--text-primary)' }}>
              {rec.modelCode}
            </span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {rec.stockGroupName}
            </span>
            <Badge tone={rec.severity === 'critical' ? 'critical' : 'warning'}>{rec.severity === 'critical' ? 'عاجل' : 'مراقبة'}</Badge>
            {isDone && <Badge tone={rec.status === 'done' ? 'good' : 'neutral'}>{rec.status === 'done' ? 'تم التنفيذ' : 'تم التجاهل'}</Badge>}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-sm">
            {rec.fromBranch && (
              <>
                <BranchTag code={rec.fromBranch} name={branchName(rec.fromBranch, branchNames)} />
                <IconArrowLeft className="w-3.5 h-3.5 rotate-180" style={{ color: 'var(--muted)' }} />
              </>
            )}
            <BranchTag code={rec.toBranch} name={branchName(rec.toBranch, branchNames)} />
            <span className="font-extrabold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {fmtNum(rec.suggestedQty)} قطعة
            </span>
          </div>

          {!compact && (
            <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {rec.reason}
            </p>
          )}

          {!compact && (
            <div className="flex items-center gap-3 mt-2 text-[11px] tabular-nums" style={{ color: 'var(--muted)' }}>
              <span>
                رصيد {branchName(rec.toBranch, branchNames)}: <b style={{ color: 'var(--text-primary)' }}>{fmtNum(rec.toBranchBalance)}</b>
              </span>
              <span>
                نسبة البيع: <b style={{ color: 'var(--text-primary)' }}>{fmtPct(rec.toBranchSellThrough)}</b>
              </span>
              <span>
                السعر: <b style={{ color: 'var(--text-primary)' }}>{fmtNum(rec.unitPrice)}</b>
              </span>
            </div>
          )}
        </div>

        {!isDone && !compact && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onStatusChange(rec.id, 'done')}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--good) 14%, transparent)', color: 'var(--good)' }}
              title="تم التنفيذ"
            >
              <IconCheck className="w-4 h-4" />
            </button>
            <button
              onClick={() => onStatusChange(rec.id, 'dismissed')}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--gridline)', color: 'var(--muted)' }}
              title="تجاهل"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
