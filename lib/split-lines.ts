/**
 * Line index of each word from the top of its box (px), words in reading
 * order. A word starts a new line when it sits lower than the previous one by
 * more than `tolerance` (sub-pixel rounding, a scaled window mid-animation).
 */
export function lineIndexes(tops: readonly number[], tolerance = 2): number[] {
  let line = 0;
  return tops.map((top, i) => {
    if (i > 0 && top - tops[i - 1] > tolerance) line++;
    return line;
  });
}
