import { get, set, del, keys } from 'idb-keyval';
import type { BranchSettings, Recommendation, Snapshot, ThresholdSettings } from './types';
import { DEFAULT_THRESHOLDS } from './types';

const SNAPSHOT_PREFIX = 'snapshot:';
const SETTINGS_KEY = 'settings:branches';
const THRESHOLDS_KEY = 'settings:thresholds';
const REC_STATUS_KEY = 'recommendations:status';

export async function listSnapshots(): Promise<Snapshot[]> {
  const allKeys = (await keys()) as string[];
  const snapshotKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith(SNAPSHOT_PREFIX));
  const snaps = await Promise.all(snapshotKeys.map((k) => get<Snapshot>(k)));
  return snaps.filter((s): s is Snapshot => Boolean(s)).sort((a, b) => a.capturedAt - b.capturedAt);
}

export async function saveSnapshot(snap: Snapshot): Promise<void> {
  await set(SNAPSHOT_PREFIX + snap.id, snap);
}

export async function deleteSnapshot(id: string): Promise<void> {
  await del(SNAPSHOT_PREFIX + id);
}

export async function loadBranchSettings(): Promise<BranchSettings> {
  const s = await get<BranchSettings>(SETTINGS_KEY);
  return s ?? { names: {} };
}

export async function saveBranchSettings(s: BranchSettings): Promise<void> {
  await set(SETTINGS_KEY, s);
}

export async function loadThresholds(): Promise<ThresholdSettings> {
  const t = await get<ThresholdSettings>(THRESHOLDS_KEY);
  return t ?? DEFAULT_THRESHOLDS;
}

export async function saveThresholds(t: ThresholdSettings): Promise<void> {
  await set(THRESHOLDS_KEY, t);
}

export type RecommendationStatusMap = Record<string, Recommendation['status']>;

export async function loadRecommendationStatuses(): Promise<RecommendationStatusMap> {
  const m = await get<RecommendationStatusMap>(REC_STATUS_KEY);
  return m ?? {};
}

export async function saveRecommendationStatuses(m: RecommendationStatusMap): Promise<void> {
  await set(REC_STATUS_KEY, m);
}
