import { useMemo } from 'react';
import type { AppData } from '../../hooks/useAppData';
import type { TabId } from '../layout/nav';
import { Card, CardHeader } from '../common/Card';
import { StatTile } from '../common/StatTile';
import { TopModelsChart } from './TopModelsChart';
import { CategoryChart } from './CategoryChart';
import { BranchLegend } from '../common/BranchLegend';
import { computeAllStats } from '../../lib/analytics';
import { fmtDate, fmtNum } from '../../lib/format';
import { IconAlert, IconBolt, IconPackage, IconSparkles, IconTrend } from '../common/Icons';
import { RecommendationCard } from '../recommendations/RecommendationCard';
import { Badge } from '../common/Badge';

export function Dashboard({ data, onNavigate }: { data: AppData; onNavigate: (t: TabId) => void }) {
  const snap = data.selectedSnapshot;
  const rows = snap?.rows ?? [];
  const branches = snap?.branches ?? [];

  const stats = useMemo(() => computeAllStats(rows, branches), [rows, branches]);

  const totalSold = rows.reduce((a, r) => a + Math.max(0, r.TotalQtySold), 0);
  const totalBalance = rows.reduce((a, r) => a + Math.max(0, r.TotalBalance), 0);
  const hotModels = stats.filter((s) =>
    branches.some((b) => s.branch[b].sellThrough >= data.thresholds.highSellThrough && s.totalSoldPositive >= data.thresholds.minPopularity),
  ).length;
  const openRecs = data.recommendations.filter((r) => r.status === 'open');
  const criticalRecs = openRecs.filter((r) => r.severity === 'critical');
  const unitsToMove = openRecs.reduce((a, r) => a + r.suggestedQty, 0);
  const anomalyCount = data.anomalies.length;

  const supplierMap = new Map<string, { name: string; code: string; sold: number; balance: number }>();
  for (const r of rows) {
    const key = r.SupplierCode || r.SupplierName;
    const e = supplierMap.get(key) ?? { name: r.SupplierName, code: r.SupplierCode, sold: 0, balance: 0 };
    e.sold += Math.max(0, r.TotalQtySold);
    e.balance += Math.max(0, r.TotalBalance);
    supplierMap.set(key, e);
  }
  const topSuppliers = [...supplierMap.values()].sort((a, b) => b.sold - a.sold).slice(0, 6);
  const maxSupplierSold = Math.max(1, ...topSuppliers.map((v) => v.sold));

  if (!snap) return null;

  return (
    <div className="flex flex-col gap-5 animate-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            نظرة عامة — {fmtDate(snap.date)}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {rows.length} موديل متابَع عبر {branches.length} فروع
          </p>
        </div>
        <button
          onClick={() => onNavigate('recommendations')}
          className="flex items-center gap-2 text-sm font-bold rounded-xl px-4 py-2.5 text-white transition-transform active:scale-95"
          style={{ background: criticalRecs.length > 0 ? 'var(--critical)' : 'var(--accent)' }}
        >
          <IconBolt className="w-4 h-4" />
          {openRecs.length > 0 ? `${openRecs.length} توصية بانتظار الإجراء` : 'لا توجد توصيات معلّقة'}
        </button>
      </div>

      {anomalyCount > 0 && (
        <button
          onClick={() => onNavigate('alerts')}
          className="flex items-center gap-2.5 text-sm font-bold rounded-xl px-4 py-3 border text-start"
          style={{ borderColor: 'color-mix(in srgb, var(--critical) 35%, transparent)', background: 'color-mix(in srgb, var(--critical) 6%, var(--surface-1))', color: 'var(--critical)' }}
        >
          <IconAlert className="w-4.5 h-4.5 shrink-0" />
          <span>
            تم رصد {anomalyCount} خطأ رصيد سالب في هذه اللقطة — هذه الأرصدة مستبعدة من التوصيات، راجعها من تبويب «تنبيهات البيانات».
          </span>
        </button>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="إجمالي القطع المباعة" value={fmtNum(totalSold)} hint="جميع الفروع" icon={<IconTrend className="w-4.5 h-4.5" />} />
        <StatTile label="إجمالي الرصيد الحالي" value={fmtNum(totalBalance)} hint="جميع المستودعات" icon={<IconPackage className="w-4.5 h-4.5" />} />
        <StatTile
          label="موديلات رائجة"
          value={fmtNum(hotModels)}
          hint={`نسبة بيع ≥ ${Math.round(data.thresholds.highSellThrough * 100)}%`}
          icon={<IconSparkles className="w-4.5 h-4.5" />}
        />
        <StatTile
          label="قطع يُنصح بطلبها/إعادتها"
          value={fmtNum(unitsToMove)}
          hint={`${criticalRecs.length} حالة عاجلة`}
          icon={<IconBolt className="w-4.5 h-4.5" />}
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <Card className="lg:col-span-3">
          <CardHeader title="الأكثر مبيعًا" subtitle="أعلى الموديلات حسب إجمالي الكمية المباعة، موزّعة على الفروع" />
          <TopModelsChart rows={rows} branches={branches} branchNames={data.branchNames} />
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <BranchLegend branches={branches} branchNames={data.branchNames} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="الأقوى حسب الفئة" subtitle="إجمالي المبيعات لكل فئة صنف" />
          <CategoryChart rows={rows} />
        </Card>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader title="أفضل الموردين" subtitle="حسب إجمالي القطع المباعة" />
          <div className="flex flex-col gap-3">
            {topSuppliers.map((v) => (
              <div key={v.code || v.name}>
                <div className="flex items-center justify-between text-sm mb-1 gap-2">
                  <span className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {v.name} <span className="font-normal" style={{ color: 'var(--muted)' }}>· {v.code}</span>
                  </span>
                  <span className="tabular-nums font-bold shrink-0 ms-2" style={{ color: 'var(--text-secondary)' }}>
                    {fmtNum(v.sold)}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--gridline)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(v.sold / maxSupplierSold) * 100}%`, background: 'var(--accent)' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="أبرز التوصيات"
            subtitle="أعلى فرص التوريد أولوية"
            action={
              <button onClick={() => onNavigate('recommendations')} className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                عرض الكل ←
              </button>
            }
          />
          {openRecs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <Badge tone="good">لا توجد اختناقات مخزون حاليًا</Badge>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                كل الفروع تغطي الطلب على الموديلات الرائجة بشكل جيد.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {openRecs.slice(0, 3).map((r) => (
                <RecommendationCard
                  key={r.id}
                  rec={r}
                  branchNames={data.branchNames}
                  branches={branches}
                  compact
                  onStatusChange={data.setRecommendationStatus}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
