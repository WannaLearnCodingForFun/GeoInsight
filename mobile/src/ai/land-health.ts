export type LandHealthInputs = {
  ndviCurrent: number; // 0..1
  ndviTwoYearMean: number; // 0..1
  rainfallAdequacy: number; // 0..1
  soilQuality: number; // 0..1
  temperatureSuitability: number; // 0..1
};

export type LandHealthResult = {
  score: number; // 0..100
  label: 'Healthy' | 'Moderate' | 'At Risk';
  confidencePct: number;
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function labelForScore(score: number): LandHealthResult['label'] {
  if (score >= 75) return 'Healthy';
  if (score >= 50) return 'Moderate';
  return 'At Risk';
}

export function computeLandHealthScore(inputs: LandHealthInputs): LandHealthResult {
  const ndviTrend = clamp01(0.5 + (inputs.ndviCurrent - inputs.ndviTwoYearMean)); // centered at 0.5

  const score01 =
    0.4 * ndviTrend +
    0.3 * clamp01(inputs.rainfallAdequacy) +
    0.2 * clamp01(inputs.soilQuality) +
    0.1 * clamp01(inputs.temperatureSuitability);

  const score = Math.round(score01 * 100);

  // Demo confidence: penalize if signals look default-ish (close to 0.5)
  const signalDeltas = [
    Math.abs(ndviTrend - 0.5),
    Math.abs(inputs.rainfallAdequacy - 0.5),
    Math.abs(inputs.soilQuality - 0.5),
    Math.abs(inputs.temperatureSuitability - 0.5),
  ];
  const distinctness = clamp01(signalDeltas.reduce((s, x) => s + x, 0) / 1.2);
  const confidencePct = Math.round((0.6 + 0.35 * distinctness) * 100);

  return { score, label: labelForScore(score), confidencePct };
}

