import { useEffect, useState } from 'react';
import { useAppData } from './hooks/useAppData';
import { getInitialTheme, applyTheme, type ThemeMode } from './lib/theme';
import { SidebarContent } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { NAV_ITEMS, type TabId } from './components/layout/nav';
import { Dashboard } from './components/dashboard/Dashboard';
import { Recommendations } from './components/recommendations/Recommendations';
import { DataAlerts } from './components/alerts/DataAlerts';
import { Explorer } from './components/explorer/Explorer';
import { Trends } from './components/trends/Trends';
import { Heatmap } from './components/heatmap/Heatmap';
import { DataPanel } from './components/upload/DataPanel';
import { WelcomeScreen } from './components/upload/WelcomeScreen';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { PrintReport } from './components/report/PrintReport';
import { exportFullReportExcel } from './lib/exportWorkbook';
import { IconCheck, IconX } from './components/common/Icons';

export default function App() {
  const data = useAppData();
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme());
  const [tab, setTab] = useState<TabId>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!data.banner) return;
    const t = setTimeout(() => data.setBanner(null), 5000);
    return () => clearTimeout(t);
  }, [data.banner, data]);

  const criticalCount = data.recommendations.filter((r) => r.status === 'open' && r.severity === 'critical').length;
  const activeLabel = NAV_ITEMS.find((n) => n.id === tab)?.label ?? '';

  const handleExportExcel = () => {
    if (!data.selectedSnapshot) return;
    exportFullReportExcel({
      snapshot: data.selectedSnapshot,
      recommendations: data.recommendations,
      anomalies: data.anomalies,
      branchNames: data.branchNames,
    });
  };

  if (data.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--page)' }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-4 animate-spin"
            style={{ borderColor: 'var(--gridline)', borderTopColor: 'var(--accent)' }}
          />
          <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
            جارِ تحميل البيانات…
          </p>
        </div>
      </div>
    );
  }

  if (data.snapshots.length === 0) {
    return <WelcomeScreen data={data} />;
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--page)' }}>
      <aside
        className="hidden lg:flex flex-col w-72 shrink-0 border-e px-4 py-5 sticky top-0 h-screen"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
      >
        <SidebarContent active={tab} onSelect={setTab} criticalCount={criticalCount} anomalyCount={data.anomalies.length} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-72 px-4 py-5 shadow-2xl" style={{ background: 'var(--surface-1)' }}>
            <SidebarContent
              active={tab}
              onSelect={(id) => {
                setTab(id);
                setDrawerOpen(false);
              }}
              criticalCount={criticalCount}
              anomalyCount={data.anomalies.length}
              onClose={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          snapshots={data.snapshots}
          selectedId={data.selectedSnapshotId}
          onSelect={data.setSelectedSnapshotId}
          onMenu={() => setDrawerOpen(true)}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          onQuickUpload={(f) => void data.addSnapshotFromFile(f)}
          onPrint={() => window.print()}
          onExportExcel={handleExportExcel}
          title={activeLabel}
        />

        <main className="flex-1 min-w-0 p-4 lg:p-6 max-w-[1400px] w-full mx-auto">
          {tab === 'dashboard' && <Dashboard data={data} onNavigate={setTab} />}
          {tab === 'recommendations' && <Recommendations data={data} />}
          {tab === 'alerts' && <DataAlerts data={data} />}
          {tab === 'explorer' && <Explorer data={data} />}
          {tab === 'trends' && <Trends data={data} />}
          {tab === 'heatmap' && <Heatmap data={data} />}
          {tab === 'data' && <DataPanel data={data} />}
          {tab === 'settings' && <SettingsPanel data={data} />}
        </main>
      </div>

      <div className="fixed bottom-4 inset-x-0 flex flex-col items-center gap-2 z-50 px-4 pointer-events-none">
        {data.banner && (
          <div
            className="pointer-events-auto animate-in flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-lg text-white max-w-md"
            style={{ background: 'var(--good)' }}
          >
            <IconCheck className="w-4 h-4 shrink-0" />
            {data.banner}
            <button onClick={() => data.setBanner(null)} className="ms-auto opacity-80 hover:opacity-100">
              <IconX className="w-4 h-4" />
            </button>
          </div>
        )}
        {data.uploadError && (
          <div
            className="pointer-events-auto animate-in flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-lg text-white max-w-md"
            style={{ background: 'var(--critical)' }}
          >
            {data.uploadError}
            <button onClick={() => data.setUploadError(null)} className="ms-auto opacity-80 hover:opacity-100">
              <IconX className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <PrintReport data={data} />
    </div>
  );
}
