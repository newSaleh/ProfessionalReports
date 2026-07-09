const SEQ_LIGHT = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'];
const SEQ_DARK = ['#184f95', '#1c5cab', '#256abf', '#3987e5', '#5598e7', '#86b6ef', '#b7d3f6'];

/** t in [0,1] -> sequential blue hex step, for heatmap / magnitude cells. */
export function seqColor(t: number, dark = false): string {
  const scale = dark ? SEQ_DARK : SEQ_LIGHT;
  const idx = Math.min(scale.length - 1, Math.max(0, Math.round(t * (scale.length - 1))));
  return scale[idx];
}

/** readable ink color for text placed on top of a seqColor cell */
export function seqTextColor(t: number, dark = false): string {
  if (dark) return t > 0.55 ? '#0b0b0b' : '#ffffff';
  return t > 0.45 ? '#ffffff' : '#0b0b0b';
}
