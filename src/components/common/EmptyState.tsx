import type { ReactNode } from 'react';

export function EmptyState({ icon, title, subtitle, action }: { icon?: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      {icon && (
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--gridline)', color: 'var(--muted)' }}
        >
          {icon}
        </div>
      )}
      <h4 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h4>
      {subtitle && (
        <p className="text-sm mt-1 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
          {subtitle}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
