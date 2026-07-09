import type { BranchCode, ModelRow } from '../../lib/types';
import { branchColor } from './BranchTag';

export function MiniBranchBar({ row, branches, metric = 'sold' }: { row: ModelRow; branches: BranchCode[]; metric?: 'sold' | 'balance' }) {
  const values = branches.map((b) => ({
    b,
    v: Math.max(0, row.branches[b]?.[metric] ?? 0),
  }));
  const total = values.reduce((a, x) => a + x.v, 0);
  if (total === 0) {
    return <div className="h-2 w-full rounded-full" style={{ background: 'var(--gridline)' }} />;
  }
  return (
    <div className="h-2 w-full rounded-full overflow-hidden flex" style={{ background: 'var(--gridline)' }}>
      {values.map(
        ({ b, v }) =>
          v > 0 && <div key={b} style={{ width: `${(v / total) * 100}%`, background: branchColor(b, branches) }} title={`${b}: ${v}`} />,
      )}
    </div>
  );
}
