import type { AppData } from '../../hooks/useAppData';
import { Card, CardHeader } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import { Badge } from '../common/Badge';
import { BranchTag } from '../common/BranchTag';
import { StatTile } from '../common/StatTile';
import { IconAlert, IconCheck } from '../common/Icons';
import { branchName } from '../../lib/analytics';
import { fmtNum } from '../../lib/format';

export function DataAlerts({ data }: { data: AppData }) {
  const anomalies = data.anomalies;
  const branches = data.selectedSnapshot?.branches ?? [];
  const affectedModels = new Set(anomalies.map((a) => a.stockCode)).size;

  return (
    <div className="flex flex-col gap-5 animate-in">
      <div>
        <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
          تنبيهات البيانات
        </h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          رصيد سالب مستحيل فعليًا — غالبًا خطأ إدخال أو تعديل مخزون في النظام المصدر. هذه الحالات مستبعدة من التوصيات ولا تُعرض كأنها رصيد صفر.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatTile label="أخطاء رصيد مكتشَفة" value={fmtNum(anomalies.length)} hint="عبر كل الفروع" />
        <StatTile label="موديلات متأثرة" value={fmtNum(affectedModels)} />
        <StatTile
          label="أكبر انحراف"
          value={anomalies.length ? fmtNum(Math.min(...anomalies.map((a) => a.rawBalance))) : '—'}
          hint="أكبر رصيد سالب مسجَّل"
        />
      </div>

      <Card padded={false}>
        {anomalies.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<IconCheck className="w-6 h-6" />}
              title="لا توجد أخطاء رصيد حاليًا"
              subtitle="كل أرصدة الفروع في هذه اللقطة منطقية (صفر أو أكبر)."
            />
          </div>
        ) : (
          <>
            <div className="p-5 pb-0">
              <CardHeader title="قائمة الأخطاء" subtitle="راجعها في نظام المخزون المصدر لتصحيح الرصيد الفعلي" />
            </div>
            <div className="overflow-auto" style={{ maxHeight: '68vh' }}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10" style={{ background: 'var(--surface-1)' }}>
                  <tr className="border-b text-xs" style={{ borderColor: 'var(--border)' }}>
                    <th className="px-5 py-2.5 text-start font-bold" style={{ color: 'var(--muted)' }}>
                      الموديل
                    </th>
                    <th className="px-3 py-2.5 text-start font-bold" style={{ color: 'var(--muted)' }}>
                      المورّد
                    </th>
                    <th className="px-3 py-2.5 font-bold" style={{ color: 'var(--muted)' }}>
                      الفرع
                    </th>
                    <th className="px-3 py-2.5 font-bold" style={{ color: 'var(--muted)' }}>
                      الرصيد المسجَّل
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {anomalies.map((a) => (
                    <tr key={a.id} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-5 py-3">
                        <div className="font-extrabold" style={{ color: 'var(--text-primary)' }}>
                          {a.modelCode}
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                          {a.stockGroupName} · {a.stockCode}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div style={{ color: 'var(--text-primary)' }}>{a.supplierName}</div>
                        <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                          {a.supplierCode}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <BranchTag code={a.branch} name={branchName(a.branch, data.branchNames)} branches={branches} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Badge tone="critical" dot={false}>
                          <IconAlert className="w-3 h-3" /> {fmtNum(a.rawBalance)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
