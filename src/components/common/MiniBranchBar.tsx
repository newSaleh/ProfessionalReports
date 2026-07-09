import { BRANCH_CODES, type ModelRow } from '../../lib/types';
import { branchColor } from './BranchTag';

export function MiniBranchBar({ row, metric = 'sold' }: { row: ModelRow; metric?: 'sold' | 'balance' }) {
  const values = BRANCH_CODES.map((b) => ({
    b,
    v: Math.max(0, row[`${b}${metric === 'sold' ? 'SoldQty' : 'Balance'}` as keyof ModelRow] as number),
  }));
  const total = values.reduce((a, x) => a + x.v, 0);
  if (total === 0) {
    return <div className="h-2 w-full rounded-full" style={{ background: 'var(--gridline)' }} />;
  }
  return (
    <div className="h-2 w-full rounded-full overflow-hidden flex" style={{ background: 'var(--gridline)' }}>
      {values.map(
        ({ b, v }) =>
          v > 0 && (
            <div
              key={b}
              style={{ width: `${(v / total) * 100}%`, background: branchColor(b) }}
              title={`${b}: ${v}`}
            />
          ),
      )}
    </div>
  );
}
