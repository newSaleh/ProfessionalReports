import clsx from 'clsx';
import { NAV_ITEMS, type TabId } from './nav';
import { IconSparkles, IconX } from '../common/Icons';

export function SidebarContent({
  active,
  onSelect,
  criticalCount,
  anomalyCount,
  onClose,
}: {
  active: TabId;
  onSelect: (id: TabId) => void;
  criticalCount: number;
  anomalyCount: number;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-1 mb-6">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--branch-2))' }}
          >
            <IconSparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold leading-tight" style={{ color: 'var(--text-primary)' }}>
              رادار الموديلات
            </div>
            <div className="text-[11px] leading-tight" style={{ color: 'var(--muted)' }}>
              متابعة المبيعات والتوزيع
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg" style={{ color: 'var(--muted)' }}>
            <IconX className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === active;
          const badgeCount = item.id === 'recommendations' ? criticalCount : item.id === 'alerts' ? anomalyCount : 0;
          const showBadge = badgeCount > 0;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors text-right',
                isActive ? 'shadow-sm' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]',
              )}
              style={
                isActive
                  ? { background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span
                  className="text-[11px] font-extrabold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center text-white"
                  style={{ background: 'var(--critical)' }}
                >
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        كل البيانات تُخزَّن محليًا في متصفحك — لا شيء يُرفع إلى الإنترنت.
      </div>
    </div>
  );
}
