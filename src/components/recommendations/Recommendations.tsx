import { useMemo, useState } from 'react';
import type { AppData } from '../../hooks/useAppData';
import { Card } from '../common/Card';
import { RecommendationCard } from './RecommendationCard';
import { EmptyState } from '../common/EmptyState';
import { IconBolt, IconDownload } from '../common/Icons';
import { StatTile } from '../common/StatTile';
import { fmtNum } from '../../lib/format';
import { downloadCsv } from '../../lib/csv';
import clsx from 'clsx';
import { branchName } from '../../lib/analytics';

type FilterKind = 'all' | 'transfer' | 'order';
type FilterStatus = 'open' | 'done' | 'dismissed' | 'all';

export function Recommendations({ data }: { data: AppData }) {
  const [kind, setKind] = useState<FilterKind>('all');
  const [status, setStatus] = useState<FilterStatus>('open');

  const all = data.recommendations;
  const open = all.filter((r) => r.status === 'open');
  const critical = open.filter((r) => r.severity === 'critical');
  const transfers = open.filter((r) => r.kind === 'transfer');
  const orders = open.filter((r) => r.kind === 'order');
  const unitsToMove = open.reduce((a, r) => a + r.suggestedQty, 0);

  const filtered = useMemo(
    () =>
      all.filter((r) => (kind === 'all' || r.kind === kind) && (status === 'all' || r.status === status)),
    [all, kind, status],
  );

  const exportCsv = () => {
    downloadCsv(
      `توصيات-التوزيع-${data.selectedSnapshot?.date ?? ''}.csv`,
      ['الموديل', 'الفئة', 'المورد', 'النوع', 'الأولوية', 'من فرع', 'إلى فرع', 'الكمية المقترحة', 'رصيد الفرع المستهدف', 'نسبة البيع', 'السبب'],
      filtered.map((r) => [
        r.modelCode,
        r.stockGroupName,
        r.supplierName,
        r.kind === 'transfer' ? 'نقل بين فروع' : 'طلب من المورد',
        r.severity === 'critical' ? 'عاجل' : 'مراقبة',
        r.fromBranch ? branchName(r.fromBranch, data.branchNames) : '-',
        branchName(r.toBranch, data.branchNames),
        r.suggestedQty,
        r.toBranchBalance,
        `${Math.round(r.toBranchSellThrough * 100)}%`,
        r.reason,
      ]),
    );
  };

  return (
    <div className="flex flex-col gap-5 animate-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            توصيات التوزيع
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            محرّك يحلّل كل موديل رائج ويقترح النقل بين الفروع قبل اللجوء لطلب جديد من المورّد
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-1.5 text-sm font-bold rounded-xl px-3.5 py-2.5 border"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <IconDownload className="w-4 h-4" />
          تصدير CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="توصيات مفتوحة" value={fmtNum(open.length)} hint={`${critical.length} عاجلة`} />
        <StatTile label="نقل بين الفروع" value={fmtNum(transfers.length)} hint="بدون تكلفة شراء" />
        <StatTile label="طلب من المورّد" value={fmtNum(orders.length)} hint="لا يوجد فائض متاح" />
        <StatTile label="إجمالي القطع المقترحة" value={fmtNum(unitsToMove)} hint="عبر كل التوصيات المفتوحة" />
      </div>

      <Card padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-1.5 rounded-xl p-1" style={{ background: 'var(--gridline)' }}>
            {(
              [
                ['open', 'مفتوحة'],
                ['done', 'منفّذة'],
                ['dismissed', 'متجاهلة'],
                ['all', 'الكل'],
              ] as [FilterStatus, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setStatus(id)}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-bold transition-colors')}
                style={
                  status === id
                    ? { background: 'var(--surface-1)', color: 'var(--text-primary)' }
                    : { color: 'var(--text-secondary)' }
                }
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 rounded-xl p-1" style={{ background: 'var(--gridline)' }}>
            {(
              [
                ['all', 'كل الأنواع'],
                ['transfer', 'نقل بين فروع'],
                ['order', 'طلب من المورّد'],
              ] as [FilterKind, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setKind(id)}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-bold transition-colors')}
                style={
                  kind === id ? { background: 'var(--surface-1)', color: 'var(--text-primary)' } : { color: 'var(--text-secondary)' }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<IconBolt className="w-6 h-6" />}
              title="لا توجد توصيات في هذا التصنيف"
              subtitle="جرّب تغيير الفلاتر أعلاه، أو ارجع للقائمة المفتوحة لمتابعة الفرص الحالية."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((r) => (
                <RecommendationCard key={r.id} rec={r} branchNames={data.branchNames} onStatusChange={data.setRecommendationStatus} />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
