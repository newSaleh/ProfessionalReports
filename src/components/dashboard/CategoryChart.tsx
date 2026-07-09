import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ModelRow } from '../../lib/types';
import { fmtNum } from '../../lib/format';

export function CategoryChart({ rows, limit = 7 }: { rows: ModelRow[]; limit?: number }) {
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.StockGroupName, (map.get(r.StockGroupName) ?? 0) + Math.max(0, r.TotalQtySold));
  }
  const data = [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }))
    .reverse();

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 0 }} barCategoryGap={12}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gridline)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={{ stroke: 'var(--gridline)' }} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: 'var(--text-primary)', fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          width={110}
          orientation="right"
        />
        <Tooltip
          cursor={{ fill: 'color-mix(in srgb, var(--branch-701) 6%, transparent)' }}
          content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null;
            const p = payload[0];
            return (
              <div
                className="rounded-xl border shadow-lg px-3 py-2 text-xs"
                style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}
              >
                <div className="font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                  {p.payload.name}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>{fmtNum(p.value as number)} قطعة مباعة</div>
              </div>
            );
          }}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={20} fill="var(--branch-701)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
