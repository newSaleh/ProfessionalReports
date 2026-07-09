import type { BranchCode } from '../../lib/types';

const SLOTS = 8;

export function branchColor(code: BranchCode, branches: BranchCode[]): string {
  const idx = branches.indexOf(code);
  return `var(--branch-${idx >= 0 ? idx % SLOTS : 0})`;
}

export function BranchDot({ code, branches }: { code: BranchCode; branches: BranchCode[] }) {
  return <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: branchColor(code, branches) }} />;
}

export function BranchTag({ code, name, branches }: { code: BranchCode; name: string; branches: BranchCode[] }) {
  const color = branchColor(code, branches);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold"
      style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
    >
      <BranchDot code={code} branches={branches} />
      {name}
    </span>
  );
}
