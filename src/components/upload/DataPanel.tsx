import { useRef, useState } from 'react';
import type { AppData } from '../../hooks/useAppData';
import { Card, CardHeader } from '../common/Card';
import { IconUpload, IconTrash, IconCheck } from '../common/Icons';
import { Badge } from '../common/Badge';
import { fmtDate, fmtNum } from '../../lib/format';
import clsx from 'clsx';

export function DataPanel({ data }: { data: AppData }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (f) void data.addSnapshotFromFile(f);
  };

  return (
    <div className="flex flex-col gap-5 animate-in">
      <div>
        <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
          البيانات واللقطات
        </h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          ارفع تقرير «Top Models» يوميًا أو أسبوعيًا من نظامك لبناء تاريخ يتيح رصد سرعة المبيعات الفعلية
        </p>
      </div>

      <Card>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileRef.current?.click()}
          className={clsx('rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center py-12 px-6 cursor-pointer transition-colors')}
          style={{ borderColor: dragging ? 'var(--accent)' : 'var(--border)', background: dragging ? 'color-mix(in srgb, var(--accent) 5%, transparent)' : 'transparent' }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}>
            <IconUpload className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            اسحب ملف Excel هنا أو اضغط للاختيار
          </h4>
          <p className="text-sm mt-1 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
            يدعم نفس تنسيق تقرير Top Models (SupplierCode, ModelCode, SoldQty, Balance لكل فرع…)
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      </Card>

      <Card padded={false}>
        <div className="p-5 pb-0">
          <CardHeader title="سجل اللقطات" subtitle={`${data.snapshots.length} لقطة محفوظة محليًا في متصفحك`} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs" style={{ borderColor: 'var(--border)' }}>
                <th className="px-5 py-2.5 text-start font-bold" style={{ color: 'var(--muted)' }}>
                  التاريخ
                </th>
                <th className="px-3 py-2.5 font-bold" style={{ color: 'var(--muted)' }}>
                  المصدر
                </th>
                <th className="px-3 py-2.5 font-bold" style={{ color: 'var(--muted)' }}>
                  عدد الموديلات
                </th>
                <th className="px-3 py-2.5 font-bold" style={{ color: 'var(--muted)' }}>
                  الحالة
                </th>
                <th className="px-5 py-2.5 font-bold" style={{ color: 'var(--muted)' }} />
              </tr>
            </thead>
            <tbody>
              {[...data.snapshots].reverse().map((s) => {
                const isSelected = s.id === data.selectedSnapshotId;
                return (
                  <tr key={s.id} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-5 py-3 font-bold" style={{ color: 'var(--text-primary)' }}>
                      {fmtDate(s.date)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge tone={s.source === 'seed' ? 'accent' : 'neutral'} dot={false}>
                        {s.source === 'seed' ? 'بيانات أولية' : 'مرفوع يدويًا'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {fmtNum(s.rows.length)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--good)' }}>
                          <IconCheck className="w-3.5 h-3.5" /> معروضة الآن
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-left">
                      {confirmDelete === s.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => {
                              void data.removeSnapshot(s.id);
                              setConfirmDelete(null);
                            }}
                            className="text-xs font-bold rounded-lg px-2.5 py-1.5 text-white"
                            style={{ background: 'var(--critical)' }}
                          >
                            تأكيد الحذف
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="text-xs font-bold rounded-lg px-2.5 py-1.5" style={{ color: 'var(--text-secondary)' }}>
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(s.id)}
                          disabled={data.snapshots.length <= 1}
                          className="p-2 rounded-lg disabled:opacity-30"
                          style={{ color: 'var(--muted)' }}
                          title="حذف اللقطة"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
