import type { ReactNode } from 'react';
import clsx from 'clsx';

type Tone = 'good' | 'warning' | 'serious' | 'critical' | 'neutral' | 'accent';

const toneStyle: Record<Tone, { bg: string; fg: string; dot: string }> = {
  good: { bg: 'color-mix(in srgb, var(--good) 14%, transparent)', fg: 'var(--good)', dot: 'var(--good)' },
  warning: { bg: 'color-mix(in srgb, var(--warning) 16%, transparent)', fg: 'var(--warning)', dot: 'var(--warning)' },
  serious: { bg: 'color-mix(in srgb, var(--serious) 16%, transparent)', fg: 'var(--serious)', dot: 'var(--serious)' },
  critical: { bg: 'color-mix(in srgb, var(--critical) 16%, transparent)', fg: 'var(--critical)', dot: 'var(--critical)' },
  neutral: { bg: 'var(--gridline)', fg: 'var(--text-secondary)', dot: 'var(--muted)' },
  accent: {
    bg: 'color-mix(in srgb, var(--branch-701) 14%, transparent)',
    fg: 'var(--branch-701)',
    dot: 'var(--branch-701)',
  },
};

export function Badge({ tone = 'neutral', children, dot = true }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  const s = toneStyle[tone];
  return (
    <span
      className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap')}
      style={{ background: s.bg, color: s.fg }}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />}
      {children}
    </span>
  );
}
