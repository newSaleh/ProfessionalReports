import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AppData } from '../../hooks/useAppData';
import { Card, CardHeader } from '../common/Card';
import { StatTile } from '../common/StatTile';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';
import { BranchLegend } from '../common/BranchLegend';
import { compareSnapshots } from '../../lib/analytics';
import { branchColor } from '../common/BranchTag';
import { fmtDate, fmtNum } from '../../lib/format';
import { IconTrend, IconUpload, IconAlert } from '../common/Icons';

export function Trends({ data }: { data: AppData }) {
  const { snapshots, selectedSnapshot } = data;

  const olderSnapshots = useMemo(
    () => (selectedSnapshot ? snapshots.filter((s) => s.capturedAt < selectedSnapshot.capturedAt) : []),
    [snapshots, selectedSnapshot],
  );

  const [baselineId, setBaselineId] = useState<string | null>(null);
  const baseline = baselineId
    ? (olderSnapshots.find((s) => s.id === baselineId) ?? olderSnapshots[olderSnapshots.length - 1])
    : olderSnapshots[olderSnapshots.length - 1];

  if (!selectedSnapshot || olderSnapshots.length === 0 || !baseline) {
    return (
      <div className="flex flex-col gap-5 animate-in">
        <div>
          <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            الاتجاهات الأسبوعية
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            قارن الأداء بين لقطتين لمعرفة الموديلات المتسارعة فعليًا
          </p>
        </div>
        <Card>
          <EmptyState
            icon={<IconTrend className="w-6 h-6" />}
            title="لا توجد بيانات كافية للمقارنة بعد"
            subtitle="ارفع تقرير Top Models غدًا أو الأسبوع القادم لرؤية سرعة المبيعات الفعلية، والموديلات المتسارعة، والوقت المتوقع لنفاد كل صنف."
            action={
              <span className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--accent)' }}>
                <IconUpload className="w-3.5 h-3.5" /> من تبويب «البيانات واللقطات»
              </span>
            }
          />
        </Card>
      </div>
    );
  }

  const branches = selectedSnapshot.branches;
  const trend = compareSnapshots(baseline, selectedSnapshot);
  const days = Math.max(1, Math.round((selectedSnapshot.capturedAt - baseline.capturedAt) / 86_400_000));
  const totalDelta = trend.reduce((a, t) => a + t.soldDelta, 0);
  const accelerating = trend.filter((t) => t.soldDelta > 0).length;
  const atRiskSoon = trend.filter((t) => t.daysOfCover !== null && t.daysOfCover <= 7).length;
  const avgVelocity = trend.reduce((a, t) => a + t.dailyVelocity, 0);

  const top = trend.filter((t) => t.soldDelta > 0).slice(0, 8);
  const chartData = [...top]
    .map((t) => {
      const entry: Record<string, string | number> = { name: t.modelCode };
      for (const b of branches) entry[b] = t.branchDelta[b];
      return entry;
    })
    .reverse();

  return (
    <div className="flex flex-col gap-5 animate-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            الاتجاهات الأسبوعية
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            من {fmtDate(baseline.date)} إلى {fmtDate(selectedSnapshot.date)} ({days} {days === 1 ? 'يوم' : 'أيام'})
          </p>
        </div>
        {olderSnapshots.length > 1 && (
          <select
            value={baseline.id}
            onChange={(e) => setBaselineId(e.target.value)}
            className="text-sm font-bold rounded-xl border px-3 py-2"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
          >
            {[...olderSnapshots].reverse().map((s) => (
              <option key={s.id} value={s.id}>
                مقارنة منذ {fmtDate(s.date)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="قطع مباعة خلال الفترة" value={fmtNum(totalDelta)} hint={`${fmtNum(avgVelocity)} قطعة/يوم إجمالًا`} />
        <StatTile label="موديلات في تسارع" value={fmtNum(accelerating)} hint="سجّلت مبيعات جديدة" />
        <StatTile label="مهدّدة بالنفاد خلال أسبوع" value={fmtNum(atRiskSoon)} hint="عند استمرار نفس المعدّل" />
        <StatTile label="لقطات مخزَّنة" value={fmtNum(snapshots.length)} hint="لبناء تاريخ أطول" />
      </div>

      <Card>
        <CardHeader title="أسرع الموديلات نموًا" subtitle={`أعلى الموديلات حسب القطع المباعة خلال آخر ${days} ${days === 1 ? 'يوم' : 'أيام'}`} />
        {chartData.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: 'var(--muted)' }}>
            لا توجد حركة مبيعات جديدة خلال هذه الفترة.
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 38)}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gridline)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={{ stroke: 'var(--gridline)' }} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-primary)', fontWeight: 700 }} axisLine={false} tickLine={false} width={70} orientation="right" />
                <Tooltip
                  cursor={{ fill: 'color-mix(in srgb, var(--accent) 6%, transparent)' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload) return null;
                    return (
                      <div className="rounded-xl border shadow-lg p-3 text-xs min-w-[150px]" style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}>
                        <div className="font-extrabold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                          موديل {label}
                        </div>
                        {payload
                          .filter((p) => (p.value as number) > 0)
                          .map((p) => (
                            <div key={String(p.dataKey)} className="flex items-center justify-between gap-3 py-0.5">
                              <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                                <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                                {String(p.dataKey)}
                              </span>
                              <span className="font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                                {fmtNum(p.value as number)}
                              </span>
                            </div>
                          ))}
                      </div>
                    );
                  }}
                />
                {branches.map((b) => (
                  <Bar key={b} dataKey={b} stackId="s" fill={branchColor(b, branches)} maxBarSize={22} />
                ))}
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <BranchLegend branches={branches} branchNames={data.branchNames} />
            </div>
          </>
        )}
      </Card>

      <Card padded={false}>
        <div className="p-5 pb-0">
          <CardHeader title="جدول الحركة التفصيلي" subtitle="مرتّب حسب الأسرع نموًا، مع الوقت المتوقع لنفاد المخزون" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs" style={{ borderColor: 'var(--border)' }}>
                <th className="px-4 py-2.5 text-start font-bold" style={{ color: 'var(--muted)' }}>
                  الموديل
                </th>
                <th className="px-3 py-2.5 text-start font-bold" style={{ color: 'var(--muted)' }}>
                  المورّد
                </th>
                <th className="px-3 py-2.5 font-bold" style={{ color: 'var(--muted)' }}>
                  مباع خلال الفترة
                </th>
                <th className="px-3 py-2.5 font-bold" style={{ color: 'var(--muted)' }}>
                  السرعة اليومية
                </th>
                <th className="px-3 py-2.5 font-bold" style={{ color: 'var(--muted)' }}>
                  الرصيد الحالي
                </th>
                <th className="px-3 py-2.5 font-bold" style={{ color: 'var(--muted)' }}>
                  الوقت المتوقع للنفاد
                </th>
              </tr>
            </thead>
            <tbody>
              {trend.slice(0, 30).map((t) => (
                <tr key={t.stockCode} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-2.5">
                    <div className="font-extrabold" style={{ color: 'var(--text-primary)' }}>
                      {t.modelCode}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                      {t.stockGroupName}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div style={{ color: 'var(--text-primary)' }}>{t.supplierName}</div>
                    <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                      {t.supplierCode}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center font-bold tabular-nums" style={{ color: t.soldDelta > 0 ? 'var(--good)' : 'var(--muted)' }}>
                    {t.soldDelta > 0 ? '+' : ''}
                    {fmtNum(t.soldDelta)}
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {t.dailyVelocity.toFixed(1)}/يوم
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {fmtNum(t.currentBalance)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {t.daysOfCover === null ? (
                      <span style={{ color: 'var(--muted)' }}>—</span>
                    ) : t.daysOfCover <= 7 ? (
                      <Badge tone="critical">
                        <IconAlert className="w-3 h-3" /> {Math.round(t.daysOfCover)} يوم
                      </Badge>
                    ) : t.daysOfCover <= 21 ? (
                      <Badge tone="warning">{Math.round(t.daysOfCover)} يوم</Badge>
                    ) : (
                      <Badge tone="good">{Math.round(t.daysOfCover)} يوم</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
