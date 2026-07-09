import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { BranchCode, ModelRow } from '../../lib/types';
import { branchColor } from '../common/BranchTag';
import { branchName } from '../../lib/analytics';
import { fmtNum } from '../../lib/format';

export function TopModelsChart({
  rows,
  branches,
  branchNames,
  limit = 8,
}: {
  rows: ModelRow[];
  branches: BranchCode[];
  branchNames: Partial<Record<BranchCode, string>>;
  limit?: number;
}) {
  const data = [...rows]
    .sort((a, b) => b.TotalQtySold - a.TotalQtySold)
    .slice(0, limit)
    .map((r) => {
      const entry: Record<string, string | number> = { name: r.ModelCode, total: r.TotalQtySold };
      for (const b of branches) entry[b] = Math.max(0, r.branches[b]?.sold ?? 0);
      return entry;
    })
    .reverse();

  return (
    <ResponsiveContainer width="100%" height={Math.max(260, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 0 }} barCategoryGap={10}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gridline)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={{ stroke: 'var(--gridline)' }} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12, fill: 'var(--text-primary)', fontWeight: 700 }}
          axisLine={false}
          tickLine={false}
          width={70}
          orientation="right"
        />
        <Tooltip
          cursor={{ fill: 'color-mix(in srgb, var(--accent) 6%, transparent)' }}
          content={({ active, payload, label }) => {
            if (!active || !payload || payload.length === 0) return null;
            return (
              <div
                className="rounded-xl border shadow-lg p-3 text-xs min-w-[160px]"
                style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}
              >
                <div className="font-extrabold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  موديل {label}
                </div>
                {payload
                  .filter((p) => (p.value as number) > 0)
                  .map((p) => (
                    <div key={String(p.dataKey)} className="flex items-center justify-between gap-3 py-0.5">
                      <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        {branchName(p.dataKey as BranchCode, branchNames)}
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
          <Bar key={b} dataKey={b} stackId="s" fill={branchColor(b, branches)} radius={0} maxBarSize={22} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
