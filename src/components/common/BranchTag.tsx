import type { BranchCode } from '../../lib/types';

export function branchColor(code: BranchCode) {
  return `var(--branch-${code})`;
}

export function BranchDot({ code }: { code: BranchCode }) {
  return <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: branchColor(code) }} />;
}

export function BranchTag({ code, name }: { code: BranchCode; name: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold"
      style={{ background: `color-mix(in srgb, ${branchColor(code)} 14%, transparent)`, color: branchColor(code) }}
    >
      <BranchDot code={code} />
      {name}
    </span>
  );
}
