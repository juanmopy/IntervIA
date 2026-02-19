/**
 * Maps phonemes / word-initial characters to Oculus-compatible viseme identifiers.
 * These visemes map to TalkingHead's Oculus blend shapes.
 *
 * Oculus Viseme IDs:
 *  viseme_sil  — silence
 *  viseme_PP   — p, b, m
 *  viseme_FF   — f, v
 *  viseme_TH   — th (θ, ð)
 *  viseme_DD   — t, d, n
 *  viseme_kk   — k, g
 *  viseme_CH   — ch, j, sh
 *  viseme_SS   — s, z
 *  viseme_nn   — n, l
 *  viseme_RR   — r
 *  viseme_aa   — a
 *  viseme_E    — e
 *  viseme_I    — i
 *  viseme_O    — o
 *  viseme_U    — u
 */

const CHAR_TO_VISEME: Record<string, string> = {
  a: 'viseme_aa',
  á: 'viseme_aa',
  b: 'viseme_PP',
  c: 'viseme_kk',
  d: 'viseme_DD',
  e: 'viseme_E',
  é: 'viseme_E',
  f: 'viseme_FF',
  g: 'viseme_kk',
  h: 'viseme_sil',
  i: 'viseme_I',
  í: 'viseme_I',
  j: 'viseme_CH',
  k: 'viseme_kk',
  l: 'viseme_nn',
  m: 'viseme_PP',
  n: 'viseme_nn',
  o: 'viseme_O',
  ó: 'viseme_O',
  p: 'viseme_PP',
  q: 'viseme_kk',
  r: 'viseme_RR',
  s: 'viseme_SS',
  t: 'viseme_DD',
  u: 'viseme_U',
  ú: 'viseme_U',
  v: 'viseme_FF',
  w: 'viseme_U',
  x: 'viseme_SS',
  y: 'viseme_I',
  z: 'viseme_SS',
};

/**
 * Check if a word starts with 'th' for the TH viseme.
 */
function getVisemeForWord(word: string): string {
  const lower = word.toLowerCase().replace(/[^a-záéíóúñ]/g, '');
  if (!lower) return 'viseme_sil';

  if (lower.startsWith('th')) return 'viseme_TH';
  if (lower.startsWith('sh') || lower.startsWith('ch'))
    return 'viseme_CH';

  return CHAR_TO_VISEME[lower[0]] || 'viseme_sil';
}

/**
 * Estimate viseme timing from word-level timestamps.
 * Each word gets one primary viseme based on its initial phoneme.
 */
export function wordsToVisemes(
  words: { word: string; startTime: number; endTime: number }[],
): { start: number; end: number; viseme: string; word: string }[] {
  return words.map(({ word, startTime, endTime }) => ({
    start: startTime,
    end: endTime,
    viseme: getVisemeForWord(word),
    word,
  }));
}

/**
 * Generate estimated word timestamps when real timestamps are unavailable.
 * Uses a simple heuristic: ~150ms per word average.
 */
export function estimateWordTimings(
  text: string,
  durationSeconds?: number,
): { word: string; startTime: number; endTime: number }[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const totalDuration = durationSeconds ?? words.length * 0.15;
  const wordDuration = totalDuration / words.length;

  return words.map((word, i) => ({
    word,
    startTime: +(i * wordDuration).toFixed(3),
    endTime: +((i + 1) * wordDuration).toFixed(3),
  }));
}
