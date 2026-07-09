import { useEffect, useMemo, useState } from 'react';
import type { AppData } from '../../hooks/useAppData';
import { Card } from '../common/Card';
import { RecommendationCard } from './RecommendationCard';
import { EmptyState } from '../common/EmptyState';
import { IconBolt, IconDownload } from '../common/Icons';
import { StatTile } from '../common/StatTile';
import { fmtNum } from '../../lib/format';
import { exportRecommendationsExcel } from '../../lib/exportWorkbook';
import clsx from 'clsx';

type FilterKind = 'all' | 'order' | 'return';
type FilterStatus = 'open' | 'done' | 'dismissed' | 'all';

const PAGE_SIZE = 30;

export function Recommendations({ data }: { data: AppData }) {
  const [kind, setKind] = useState<FilterKind>('all');
  const [status, setStatus] = useState<FilterStatus>('open');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const branches = data.selectedSnapshot?.branches ?? [];

  useEffect(() => setVisibleCount(PAGE_SIZE), [kind, status]);

  const all = data.recommendations;
  const open = all.filter((r) => r.status === 'open');
  const critical = open.filter((r) => r.severity === 'critical');
  const orders = open.filter((r) => r.kind === 'order');
  const returns = open.filter((r) => r.kind === 'return');
  const unitsToMove = open.reduce((a, r) => a + r.suggestedQty, 0);

  const filtered = useMemo(
    () => all.filter((r) => (kind === 'all' || r.kind === kind) && (status === 'all' || r.status === status)),
    [all, kind, status],
  );

  const exportExcel = () => {
    exportRecommendationsExcel(filtered, data.branchNames, data.selectedSnapshot?.date ?? '');
  };

  return (
    <div className="flex flex-col gap-5 animate-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            توصيات التوريد
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            محرّك يحلّل كل موديل رائج في كل فرع ويقترح إما طلب كمية إضافية من المورّد أو إعادة الكميات الراكدة إليه
          </p>
        </div>
        <button
          onClick={exportExcel}
          className="flex items-center gap-1.5 text-sm font-bold rounded-xl px-3.5 py-2.5 border"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <IconDownload className="w-4 h-4" />
          تصدير Excel
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="توصيات مفتوحة" value={fmtNum(open.length)} hint={`${critical.length} عاجلة`} />
        <StatTile label="طلب من المورّد" value={fmtNum(orders.length)} hint="فروع تبيع بسرعة ورصيدها منخفض" />
        <StatTile label="إعادة للمورّد" value={fmtNum(returns.length)} hint="بضاعة راكدة لا تتحرك" />
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
                ['order', 'طلب من المورّد'],
                ['return', 'إعادة للمورّد'],
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
            <>
              <div className="flex flex-col gap-3">
                {filtered.slice(0, visibleCount).map((r) => (
                  <RecommendationCard
                    key={r.id}
                    rec={r}
                    branchNames={data.branchNames}
                    branches={branches}
                    onStatusChange={data.setRecommendationStatus}
                  />
                ))}
              </div>
              {filtered.length > visibleCount && (
                <div className="flex flex-col items-center gap-1 pt-4">
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="text-sm font-bold rounded-xl px-4 py-2 border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    تحميل المزيد
                  </button>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>
                    {fmtNum(visibleCount)} من {fmtNum(filtered.length)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
