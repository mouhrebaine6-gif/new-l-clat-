// Petits retours haptiques (vibration) compatibles WebView Unity (Android principalement).
// iOS Safari ignore navigator.vibrate — on ne s'en sert que comme bonus tactile.
type Pattern = "tap" | "select" | "success" | "warn" | "rituel";

const patterns: Record<Pattern, number | number[]> = {
  tap: 8,
  select: 12,
  success: [10, 40, 20],
  warn: [30, 30, 30],
  rituel: [12, 60, 12, 60, 24],
};

export const haptic = (p: Pattern = "tap") => {
  try {
    if (typeof navigator === "undefined") return;
    if (typeof navigator.vibrate !== "function") return;
    navigator.vibrate(patterns[p]);
  } catch {
    /* noop */
  }
};
