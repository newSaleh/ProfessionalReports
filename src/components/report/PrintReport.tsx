import type { CSSProperties, ReactNode } from 'react';
import type { AppData } from '../../hooks/useAppData';
import { branchName } from '../../lib/analytics';
import { fmtDate, fmtNum, fmtPct } from '../../lib/format';

const ink = '#0b0b0b';
const muted = '#5c5c5c';
const line = '#d8d8d4';

/** Always mounted, hidden on screen — only shown to the browser's print engine (see .print-report
 *  rules in index.css). Styled with plain black-on-white so it prints identically in light/dark mode. */
export function PrintReport({ data }: { data: AppData }) {
  const snap = data.selectedSnapshot;
  if (!snap) return null;

  const PAGE_CAP = 20;
  const rows = snap.rows;
  const totalSold = rows.reduce((a, r) => a + Math.max(0, r.TotalQtySold), 0);
  const totalBalance = rows.reduce((a, r) => a + Math.max(0, r.TotalBalance), 0);
  const openRecs = data.recommendations.filter((r) => r.status === 'open');
  const allOrders = openRecs.filter((r) => r.kind === 'order');
  const allReturns = openRecs.filter((r) => r.kind === 'return');
  const orders = allOrders.slice(0, PAGE_CAP);
  const returns = allReturns.slice(0, PAGE_CAP);
  const anomalies = data.anomalies.slice(0, PAGE_CAP);
  const topModels = [...rows].sort((a, b) => b.TotalQtySold - a.TotalQtySold).slice(0, 15);

  const th: CSSProperties = { textAlign: 'right', padding: '5px 6px', borderBottom: `1.5px solid ${ink}`, fontSize: 10.5 };
  const td: CSSProperties = { textAlign: 'right', padding: '5px 6px', borderBottom: `1px solid ${line}`, fontSize: 10.5 };

  return (
    <div className="print-report" dir="rtl" style={{ color: ink, background: '#fff', fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `2px solid ${ink}`, paddingBottom: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>تقرير رادار الموديلات</div>
          <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>لقطة بتاريخ {fmtDate(snap.date)} — {rows.length} موديل عبر {snap.branches.length} فروع</div>
        </div>
        <div style={{ fontSize: 10, color: muted, textAlign: 'left' }}>
          <div>{new Date().toLocaleString('ar')}</div>
          <div style={{ marginTop: 2 }}>القوائم أدناه تعرض أعلى {PAGE_CAP} أولوية من كل نوع — للبيانات الكاملة استخدم تصدير Excel</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {[
          ['إجمالي القطع المباعة', fmtNum(totalSold)],
          ['إجمالي الرصيد الحالي', fmtNum(totalBalance)],
          ['طلبات من المورّد', fmtNum(allOrders.length)],
          ['إعادات للمورّد', fmtNum(allReturns.length)],
          ['أخطاء بيانات (رصيد سالب)', fmtNum(data.anomalies.length)],
        ].map(([label, value]) => (
          <div key={label} style={{ flex: 1, border: `1px solid ${line}`, borderRadius: 6, padding: '8px 10px' }}>
            <div style={{ fontSize: 9.5, color: muted }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{value}</div>
          </div>
        ))}
      </div>

      <Section title="طلبات مقترحة من المورّد">
        {orders.length === 0 ? (
          <Empty text="لا توجد طلبات مقترحة حاليًا." />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>الموديل</th>
                <th style={th}>الفئة</th>
                <th style={th}>المورّد</th>
                <th style={th}>الفرع</th>
                <th style={th}>الرصيد</th>
                <th style={th}>الكمية المقترحة</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((r) => (
                <tr key={r.id}>
                  <td style={td}>{r.modelCode}</td>
                  <td style={td}>{r.stockGroupName}</td>
                  <td style={td}>
                    {r.supplierName} ({r.supplierCode})
                  </td>
                  <td style={td}>{branchName(r.branch, data.branchNames)}</td>
                  <td style={td}>{fmtNum(r.branchBalance)}</td>
                  <td style={{ ...td, fontWeight: 800 }}>{fmtNum(r.suggestedQty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {allOrders.length > orders.length && <More n={allOrders.length - orders.length} />}
      </Section>

      <Section title="بضاعة يُنصح بإعادتها للمورّد">
        {returns.length === 0 ? (
          <Empty text="لا توجد بضاعة راكدة حاليًا." />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>الموديل</th>
                <th style={th}>الفئة</th>
                <th style={th}>المورّد</th>
                <th style={th}>الفرع</th>
                <th style={th}>نسبة البيع</th>
                <th style={th}>الكمية المقترح إعادتها</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((r) => (
                <tr key={r.id}>
                  <td style={td}>{r.modelCode}</td>
                  <td style={td}>{r.stockGroupName}</td>
                  <td style={td}>
                    {r.supplierName} ({r.supplierCode})
                  </td>
                  <td style={td}>{branchName(r.branch, data.branchNames)}</td>
                  <td style={td}>{fmtPct(r.branchSellThrough)}</td>
                  <td style={{ ...td, fontWeight: 800 }}>{fmtNum(r.suggestedQty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {allReturns.length > returns.length && <More n={allReturns.length - returns.length} />}
      </Section>

      {data.anomalies.length > 0 && (
        <Section title="تنبيهات بيانات — رصيد سالب يحتاج تصحيحًا">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>الموديل</th>
                <th style={th}>المورّد</th>
                <th style={th}>الفرع</th>
                <th style={th}>الرصيد المسجَّل</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map((a) => (
                <tr key={a.id}>
                  <td style={td}>{a.modelCode}</td>
                  <td style={td}>
                    {a.supplierName} ({a.supplierCode})
                  </td>
                  <td style={td}>{branchName(a.branch, data.branchNames)}</td>
                  <td style={{ ...td, fontWeight: 800, color: '#a00' }}>{fmtNum(a.rawBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.anomalies.length > anomalies.length && <More n={data.anomalies.length - anomalies.length} />}
        </Section>
      )}

      <Section title="أفضل 15 موديلًا مبيعًا">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>#</th>
              <th style={th}>الموديل</th>
              <th style={th}>الفئة</th>
              <th style={th}>المورّد</th>
              <th style={th}>إجمالي المباع</th>
              <th style={th}>إجمالي الرصيد</th>
            </tr>
          </thead>
          <tbody>
            {topModels.map((r, i) => (
              <tr key={r.StockCode}>
                <td style={td}>{i + 1}</td>
                <td style={td}>{r.ModelCode}</td>
                <td style={td}>{r.StockGroupName}</td>
                <td style={td}>
                  {r.SupplierName} ({r.SupplierCode})
                </td>
                <td style={td}>{fmtNum(Math.max(0, r.TotalQtySold))}</td>
                <td style={td}>{fmtNum(Math.max(0, r.TotalBalance))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function More({ n }: { n: number }) {
  return (
    <div style={{ fontSize: 10, color: muted, marginTop: 4 }}>
      + {n} إضافية — راجعها داخل التطبيق أو في تصدير Excel الكامل
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 16, breakInside: 'avoid' }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6, borderBottom: `1px solid ${line}`, paddingBottom: 4 }}>{title}</div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div style={{ fontSize: 11, color: muted }}>{text}</div>;
}
