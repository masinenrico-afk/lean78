import type { RecoveryCheck } from "./types";

export function recoveryScore(recovery?: RecoveryCheck) {
  if (!recovery) return 4;
  return Math.round(((recovery.sleep + recovery.energy + (6 - recovery.soreness)) / 15) * 5 * 10) / 10;
}

export function recoveryStatus(recovery?: RecoveryCheck) {
  const score = recoveryScore(recovery);
  if (score >= 4) return "Pronto quando vuoi.";
  if (score >= 3) return "Allenati stabile. Carico onesto.";
  return "Recupero basso. Mantieni il carico e muoviti bene.";
}

export function shouldMaintainLoad(recovery?: RecoveryCheck) {
  return recoveryScore(recovery) < 3;
}
