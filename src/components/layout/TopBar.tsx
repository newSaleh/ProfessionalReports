import { useRef } from 'react';
import type { Snapshot } from '../../lib/types';
import { fmtDate } from '../../lib/format';
import { IconSun, IconMoon, IconUpload, IconPrinter, IconFileSpreadsheet } from '../common/Icons';
import type { ThemeMode } from '../../lib/theme';

export function TopBar({
  snapshots,
  selectedId,
  onSelect,
  onMenu,
  theme,
  onToggleTheme,
  onQuickUpload,
  onPrint,
  onExportExcel,
  title,
}: {
  snapshots: Snapshot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMenu: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onQuickUpload: (file: File) => void;
  onPrint: () => void;
  onExportExcel: () => void;
  title: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-2 px-4 lg:px-6 py-3 border-b backdrop-blur-md"
      style={{ background: 'color-mix(in srgb, var(--page) 88%, transparent)', borderColor: 'var(--border)' }}
    >
      <button
        onClick={onMenu}
        className="lg:hidden p-2 rounded-lg border"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        aria-label="القائمة"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
      </button>

      <h1 className="font-extrabold text-lg hidden sm:block" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h1>

      <div className="flex-1" />

      {snapshots.length > 0 && (
        <select
          value={selectedId ?? ''}
          onChange={(e) => onSelect(e.target.value)}
          className="text-sm font-bold rounded-xl border px-3 py-2 max-w-[120px] sm:max-w-none"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
        >
          {[...snapshots].reverse().map((s) => (
            <option key={s.id} value={s.id}>
              {fmtDate(s.date)}
            </option>
          ))}
        </select>
      )}

      <div className="hidden md:flex items-center gap-1.5 border-e pe-2 me-0.5" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={onPrint}
          className="p-2.5 rounded-xl border"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          title="طباعة / تصدير PDF"
        >
          <IconPrinter className="w-4.5 h-4.5" />
        </button>
        <button
          onClick={onExportExcel}
          className="p-2.5 rounded-xl border"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          title="تنزيل تقرير Excel شامل"
        >
          <IconFileSpreadsheet className="w-4.5 h-4.5" />
        </button>
      </div>

      <button
        onClick={() => fileRef.current?.click()}
        className="hidden sm:flex items-center gap-1.5 text-sm font-bold rounded-xl px-3 py-2 text-white transition-transform active:scale-95"
        style={{ background: 'var(--accent)' }}
      >
        <IconUpload className="w-4 h-4" />
        رفع ملف جديد
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onQuickUpload(f);
          e.target.value = '';
        }}
      />

      <button
        onClick={onToggleTheme}
        className="p-2.5 rounded-xl border"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        aria-label="تبديل المظهر"
      >
        {theme === 'dark' ? <IconSun className="w-4.5 h-4.5" /> : <IconMoon className="w-4.5 h-4.5" />}
      </button>
    </header>
  );
}
