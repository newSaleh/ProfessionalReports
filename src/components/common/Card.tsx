import type { CSSProperties, ReactNode } from 'react';
import clsx from 'clsx';

export function Card({
  children,
  className,
  padded = true,
  style,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className={clsx(
        'rounded-2xl border shadow-sm',
        padded && 'p-5',
        className,
      )}
      style={{ background: 'var(--surface-1)', borderColor: 'var(--border)', ...style }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
