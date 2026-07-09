const numberFmt = new Intl.NumberFormat('en-US');
const currencyFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function fmtNum(n: number): string {
  return numberFmt.format(Math.round(n));
}

export function fmtMoney(n: number): string {
  return currencyFmt.format(Math.round(n));
}

export function fmtPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

const arabicDateFmt = new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function fmtDate(iso: string): string {
  try {
    return arabicDateFmt.format(new Date(iso + 'T00:00:00'));
  } catch {
    return iso;
  }
}

export function fmtDateShort(iso: string): string {
  return iso;
}
