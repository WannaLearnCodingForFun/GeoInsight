export type NdviZoneKey = 'bare_stressed' | 'sparse' | 'healthy' | 'dense';

export type NdviZonesResult = {
  zones: Record<NdviZoneKey, { count: number; pct: number }>;
  confidencePct: number;
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function classifyNdviZones(ndviValues: number[]): NdviZonesResult {
  const total = ndviValues.length || 1;
  const counts: Record<NdviZoneKey, number> = {
    bare_stressed: 0,
    sparse: 0,
    healthy: 0,
    dense: 0,
  };

  for (const v of ndviValues) {
    if (v < 0.2) counts.bare_stressed += 1;
    else if (v < 0.4) counts.sparse += 1;
    else if (v < 0.6) counts.healthy += 1;
    else counts.dense += 1;
  }

  const zones = (Object.keys(counts) as NdviZoneKey[]).reduce(
    (acc, k) => {
      acc[k] = { count: counts[k], pct: (counts[k] / total) * 100 };
      return acc;
    },
    {} as Record<NdviZoneKey, { count: number; pct: number }>
  );

  // Demo confidence: more samples + higher spread -> higher confidence
  const mean = ndviValues.reduce((s, x) => s + x, 0) / total;
  const variance = ndviValues.reduce((s, x) => s + (x - mean) ** 2, 0) / total;
  const std = Math.sqrt(variance);
  const sampleFactor = clamp01(Math.log10(total + 1) / 2); // 0..~1
  const spreadFactor = clamp01(std / 0.2); // heuristic
  const confidencePct = Math.round((0.55 + 0.25 * sampleFactor + 0.2 * spreadFactor) * 100);

  return { zones, confidencePct };
}

