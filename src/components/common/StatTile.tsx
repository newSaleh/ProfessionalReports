import type { ReactNode } from 'react';
import { Card } from './Card';

export function StatTile({
  label,
  value,
  hint,
  icon,
  trend,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  trend?: { direction: 'up' | 'down' | 'flat'; label: string };
}) {
  return (
    <Card className="animate-in">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
        {icon && (
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3 text-3xl font-extrabold tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      {(hint || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className="font-bold"
              style={{
                color: trend.direction === 'up' ? 'var(--good)' : trend.direction === 'down' ? 'var(--critical)' : 'var(--muted)',
              }}
            >
              {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '—'} {trend.label}
            </span>
          )}
          {hint && <span style={{ color: 'var(--muted)' }}>{hint}</span>}
        </div>
      )}
    </Card>
  );
}
