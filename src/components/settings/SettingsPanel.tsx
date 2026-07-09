import { useState } from 'react';
import type { AppData } from '../../hooks/useAppData';
import { Card, CardHeader } from '../common/Card';
import { BRANCH_CODES, DEFAULT_BRANCH_NAMES, DEFAULT_THRESHOLDS } from '../../lib/types';
import { branchColor } from '../common/BranchTag';
import { IconCheck } from '../common/Icons';

export function SettingsPanel({ data }: { data: AppData }) {
  const [names, setNames] = useState(data.branchNames);
  const [thresholds, setThresholds] = useState(data.thresholds);
  const [saved, setSaved] = useState(false);

  const save = () => {
    void data.setBranchNames(names);
    void data.setThresholds(thresholds);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 animate-in max-w-3xl">
      <div>
        <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
          الإعدادات
        </h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          خصّص أسماء الفروع وحساسية محرّك التوصيات حسب طبيعة نشاطك
        </p>
      </div>

      <Card>
        <CardHeader title="أسماء الفروع" subtitle="استبدل الأكواد (701، 706…) بأسماء تعرفها فرقك" />
        <div className="grid sm:grid-cols-2 gap-3">
          {BRANCH_CODES.map((b) => (
            <label key={b} className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: branchColor(b) }} />
              <span className="text-xs font-bold w-14 shrink-0" style={{ color: 'var(--muted)' }}>
                {b}
              </span>
              <input
                value={names[b] ?? ''}
                onChange={(e) => setNames((n) => ({ ...n, [b]: e.target.value }))}
                placeholder={DEFAULT_BRANCH_NAMES[b]}
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
              />
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="حساسية محرّك التوصيات" subtitle="عدّل الحدود التي تحدد متى يُعتبر الموديل رائجًا أو المخزون منخفضًا" />
        <div className="flex flex-col gap-4">
          <ThresholdField
            label="أدنى شعبية لاعتبار الموديل نشطًا (قطعة مباعة)"
            value={thresholds.minPopularity}
            min={0}
            max={50}
            onChange={(v) => setThresholds((t) => ({ ...t, minPopularity: v }))}
          />
          <ThresholdField
            label="نسبة البيع لاعتبار الفرع «يبيع بسرعة»"
            value={Math.round(thresholds.highSellThrough * 100)}
            min={30}
            max={95}
            suffix="%"
            onChange={(v) => setThresholds((t) => ({ ...t, highSellThrough: v / 100 }))}
          />
          <ThresholdField
            label="حد الرصيد المنخفض (قطعة)"
            value={thresholds.lowStockUnits}
            min={1}
            max={100}
            onChange={(v) => setThresholds((t) => ({ ...t, lowStockUnits: v }))}
          />
          <ThresholdField
            label="نسبة البيع لاعتبار الفرع لديه فائض بطيء الحركة"
            value={Math.round(thresholds.surplusSellThrough * 100)}
            min={5}
            max={60}
            suffix="%"
            onChange={(v) => setThresholds((t) => ({ ...t, surplusSellThrough: v / 100 }))}
          />
          <ThresholdField
            label="أدنى رصيد فائض قابل للنقل (قطعة)"
            value={thresholds.surplusMinBalance}
            min={1}
            max={100}
            onChange={(v) => setThresholds((t) => ({ ...t, surplusMinBalance: v }))}
          />
          <ThresholdField
            label="مضاعف هدف التغطية عند حساب الكمية المقترحة"
            value={thresholds.coverTargetMultiplier}
            min={1}
            max={4}
            step={0.1}
            onChange={(v) => setThresholds((t) => ({ ...t, coverTargetMultiplier: v }))}
          />
          <button
            onClick={() => setThresholds(DEFAULT_THRESHOLDS)}
            className="self-start text-xs font-bold"
            style={{ color: 'var(--branch-701)' }}
          >
            استعادة القيم الافتراضية
          </button>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          className="flex items-center gap-2 text-sm font-bold rounded-xl px-5 py-2.5 text-white"
          style={{ background: 'var(--branch-701)' }}
        >
          حفظ الإعدادات
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-bold animate-in" style={{ color: 'var(--good)' }}>
            <IconCheck className="w-4 h-4" /> تم الحفظ
          </span>
        )}
      </div>
    </div>
  );
}

function ThresholdField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
          {label}
        </span>
        <span className="font-extrabold tabular-nums" style={{ color: 'var(--branch-701)' }}>
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-current"
        style={{ color: 'var(--branch-701)' }}
      />
    </div>
  );
}
