import { BRANCH_CODES, type BranchCode } from '../../lib/types';
import { branchName } from '../../lib/analytics';
import { BranchDot } from './BranchTag';

export function BranchLegend({ branchNames }: { branchNames: Partial<Record<BranchCode, string>> }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {BRANCH_CODES.map((b) => (
        <span key={b} className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
          <BranchDot code={b} />
          {branchName(b, branchNames)}
        </span>
      ))}
    </div>
  );
}
