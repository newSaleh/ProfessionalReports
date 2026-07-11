import type { AppData } from '../../hooks/useAppData';
import { Card } from '../common/Card';
import { UploadDropzone } from '../common/UploadDropzone';
import { IconSparkles } from '../common/Icons';

/** Shown whenever there is no snapshot at all — nothing loads automatically, ever.
 *  The user brings their own file, on their own schedule. */
export function WelcomeScreen({ data }: { data: AppData }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--page)' }}>
      <div className="w-full max-w-lg animate-in">
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--branch-2))' }}
          >
            <IconSparkles className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            رادار الموديلات
          </h1>
          <p className="text-sm mt-1.5 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
            لا توجد بيانات محمّلة حاليًا. ارفع ملف «Top Models» لبدء المتابعة — البيانات تبقى في متصفحك فقط ولا تُحمَّل تلقائيًا في أي وقت.
          </p>
        </div>

        <Card>
          <UploadDropzone onFile={(f) => void data.addSnapshotFromFile(f)} />
        </Card>

        {data.uploadError && (
          <p className="text-sm font-bold text-center mt-4" style={{ color: 'var(--critical)' }}>
            {data.uploadError}
          </p>
        )}
      </div>
    </div>
  );
}
