type ValuationInputs = {
  landHealthScore: number; // 0..100
  soilQuality: number; // 0..1
  rainfallAdequacy: number; // 0..1
  proximityScore: number; // 0..1 (highway/town/water signal)
  nightLightIndex: number; // 0..1
  baseRsPerAcre?: number;
};

export type ValuationResult = {
  low: number;
  mid: number;
  high: number;
  confidencePct: number;
  topDrivers: string[];
  disclaimer: string;
};

export function estimateValuation(inputs: ValuationInputs): ValuationResult {
  const base = inputs.baseRsPerAcre ?? 200000;
  const weighted =
    0.3 * (inputs.landHealthScore / 100) +
    0.2 * clamp01(inputs.soilQuality) +
    0.15 * clamp01(inputs.rainfallAdequacy) +
    0.25 * clamp01(inputs.proximityScore) +
    0.1 * clamp01(inputs.nightLightIndex);

  const mid = Math.round(base * (0.7 + weighted));
  const low = Math.round(mid * 0.85);
  const high = Math.round(mid * 1.15);

  const confidencePct = Math.round(65 + 30 * Math.abs(weighted - 0.5));

  const factors = [
    { k: 'Land Health Score', v: 0.3 * (inputs.landHealthScore / 100) },
    { k: 'Soil quality', v: 0.2 * clamp01(inputs.soilQuality) },
    { k: 'Rainfall adequacy', v: 0.15 * clamp01(inputs.rainfallAdequacy) },
    { k: 'OSM proximity signal', v: 0.25 * clamp01(inputs.proximityScore) },
    { k: 'Night light index', v: 0.1 * clamp01(inputs.nightLightIndex) },
  ]
    .sort((a, b) => b.v - a.v)
    .slice(0, 3)
    .map((x) => x.k);

  return {
    low,
    mid,
    high,
    confidencePct,
    topDrivers: factors,
    disclaimer: 'Estimated intelligence range only; not a legal/government guideline valuation.',
  };
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

