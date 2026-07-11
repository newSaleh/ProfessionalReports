import { useRef, useState } from 'react';
import clsx from 'clsx';
import { IconUpload } from './Icons';

export function UploadDropzone({ onFile }: { onFile: (file: File) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (f) onFile(f);
  };

  return (
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
  );
}
