import raw from './seed.json';
import type { ModelRow, Snapshot } from '../lib/types';

export const SEED_ROWS = raw as unknown as ModelRow[];

export const SEED_SNAPSHOT: Snapshot = {
  id: 'seed-2026-07-09',
  date: '2026-07-09',
  capturedAt: new Date('2026-07-09T09:19:39').getTime(),
  label: 'أفضل الموديلات — 09 يوليو 2026',
  source: 'seed',
  rows: SEED_ROWS,
};
