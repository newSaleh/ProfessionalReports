import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BalanceAnomaly, BranchCode, Recommendation, Snapshot, ThresholdSettings } from '../lib/types';
import { DEFAULT_THRESHOLDS } from '../lib/types';
import { SEED_SNAPSHOT } from '../data/seed';
import { dateFromFilename, parseTopModelsFile } from '../lib/excel';
import {
  deleteSnapshot,
  listSnapshots,
  loadBranchSettings,
  loadRecommendationStatuses,
  loadThresholds,
  saveBranchSettings,
  saveRecommendationStatuses,
  saveSnapshot,
  saveThresholds,
  type RecommendationStatusMap,
} from '../lib/storage';
import { buildRecommendations, compareSnapshots, findBalanceAnomalies, type TrendRow } from '../lib/analytics';

export function useAppData() {
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [branchNames, setBranchNamesState] = useState<Partial<Record<BranchCode, string>>>({});
  const [thresholds, setThresholdsState] = useState<ThresholdSettings>(DEFAULT_THRESHOLDS);
  const [recStatuses, setRecStatuses] = useState<RecommendationStatusMap>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let existing = await listSnapshots();
      if (existing.length === 0) {
        await saveSnapshot(SEED_SNAPSHOT);
        existing = [SEED_SNAPSHOT];
      }
      const [names, thr, statuses] = await Promise.all([
        loadBranchSettings(),
        loadThresholds(),
        loadRecommendationStatuses(),
      ]);
      setSnapshots(existing);
      setSelectedSnapshotId(existing[existing.length - 1]!.id);
      setBranchNamesState(names.names);
      setThresholdsState(thr);
      setRecStatuses(statuses);
      setLoading(false);
    })();
  }, []);

  const sorted = useMemo(() => [...snapshots].sort((a, b) => a.capturedAt - b.capturedAt), [snapshots]);
  const latestSnapshot = sorted[sorted.length - 1] ?? null;
  const previousSnapshot = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
  const selectedSnapshot = useMemo(
    () => sorted.find((s) => s.id === selectedSnapshotId) ?? latestSnapshot,
    [sorted, selectedSnapshotId, latestSnapshot],
  );

  /** Every branch code seen across all stored snapshots — lets Settings name a branch even if it's
   *  absent from whichever snapshot happens to be selected right now. */
  const allBranchCodes = useMemo(() => {
    const set = new Set<string>();
    for (const s of sorted) for (const b of s.branches) set.add(b);
    return [...set];
  }, [sorted]);

  const addSnapshotFromFile = useCallback(
    async (file: File, dateOverride?: string) => {
      setUploadError(null);
      try {
        const { rows, branches } = await parseTopModelsFile(file);
        const date = dateOverride || dateFromFilename(file.name) || new Date().toISOString().slice(0, 10);
        const existingSameDate = snapshots.find((s) => s.date === date);
        const id = existingSameDate ? existingSameDate.id : `upload-${date}-${Date.now()}`;
        const snap: Snapshot = {
          id,
          date,
          capturedAt: existingSameDate ? existingSameDate.capturedAt : new Date(`${date}T12:00:00`).getTime(),
          label: `أفضل الموديلات — ${date}`,
          source: 'upload',
          rows,
          branches,
        };
        await saveSnapshot(snap);
        const refreshed = await listSnapshots();
        setSnapshots(refreshed);
        setSelectedSnapshotId(snap.id);
        setBanner(
          existingSameDate
            ? `تم تحديث بيانات تاريخ ${date} (${rows.length} موديل).`
            : `تم إضافة لقطة جديدة بتاريخ ${date} (${rows.length} موديل). إجمالي اللقطات: ${refreshed.length}.`,
        );
        return snap;
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : 'تعذّرت قراءة الملف.');
        return null;
      }
    },
    [snapshots],
  );

  const removeSnapshot = useCallback(
    async (id: string) => {
      await deleteSnapshot(id);
      const refreshed = await listSnapshots();
      setSnapshots(refreshed);
      if (refreshed.length > 0) {
        setSelectedSnapshotId((cur) => (cur === id ? refreshed[refreshed.length - 1]!.id : cur));
      }
    },
    [],
  );

  const setBranchNames = useCallback(async (names: Partial<Record<BranchCode, string>>) => {
    setBranchNamesState(names);
    await saveBranchSettings({ names });
  }, []);

  const setThresholds = useCallback(async (t: ThresholdSettings) => {
    setThresholdsState(t);
    await saveThresholds(t);
  }, []);

  const setRecommendationStatus = useCallback(
    async (id: string, status: Recommendation['status']) => {
      setRecStatuses((prev) => {
        const next = { ...prev, [id]: status };
        void saveRecommendationStatuses(next);
        return next;
      });
    },
    [],
  );

  const recommendations: Recommendation[] = useMemo(() => {
    if (!selectedSnapshot) return [];
    return buildRecommendations(selectedSnapshot.rows, selectedSnapshot.branches, thresholds).map((r) => ({
      ...r,
      status: recStatuses[r.id] ?? 'open',
    }));
  }, [selectedSnapshot, thresholds, recStatuses]);

  const anomalies: BalanceAnomaly[] = useMemo(() => {
    if (!selectedSnapshot) return [];
    return findBalanceAnomalies(selectedSnapshot.rows, selectedSnapshot.branches);
  }, [selectedSnapshot]);

  const trend: TrendRow[] | null = useMemo(() => {
    if (!previousSnapshot || !selectedSnapshot || previousSnapshot.id === selectedSnapshot.id) return null;
    return compareSnapshots(previousSnapshot, selectedSnapshot);
  }, [previousSnapshot, selectedSnapshot]);

  return {
    loading,
    snapshots: sorted,
    latestSnapshot,
    previousSnapshot,
    selectedSnapshot,
    selectedSnapshotId: selectedSnapshot?.id ?? null,
    setSelectedSnapshotId,
    addSnapshotFromFile,
    removeSnapshot,
    branchNames,
    setBranchNames,
    allBranchCodes,
    thresholds,
    setThresholds,
    recommendations,
    setRecommendationStatus,
    anomalies,
    trend,
    uploadError,
    setUploadError,
    banner,
    setBanner,
  };
}

export type AppData = ReturnType<typeof useAppData>;
