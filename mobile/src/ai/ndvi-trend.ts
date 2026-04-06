export type NdviStatus = 'Healthy' | 'Degrading' | 'Recovering';

export type NdviTrendResult = {
  current: number;
  twoYearMean: number;
  monthlyTrend: number[];
  status: NdviStatus;
  confidencePct: number;
  lowerZoneIncreasePct: number;
};

export function computeNdviTrend(params: { currentSeries: number[]; previousSeries?: number[] }): NdviTrendResult {
  const curr = params.currentSeries.length ? params.currentSeries : [0.3];
  const current = curr[curr.length - 1]!;
  const twoYearMean = avg(curr);

  const slope = (current - curr[0]!) / Math.max(1, curr.length - 1);
  const status: NdviStatus = slope < -0.015 ? 'Degrading' : slope > 0.015 ? 'Recovering' : 'Healthy';

  const prev = params.previousSeries ?? curr.map((v) => Math.max(-1, v - 0.05));
  const lowCurr = curr.filter((v) => v < 0.4).length / curr.length;
  const lowPrev = prev.filter((v) => v < 0.4).length / prev.length;
  const lowerZoneIncreasePct = Math.max(0, (lowCurr - lowPrev) * 100);

  const variance = curr.reduce((s, x) => s + (x - twoYearMean) ** 2, 0) / curr.length;
  const confidencePct = Math.round((0.65 + Math.min(0.3, Math.sqrt(variance))) * 100);

  return {
    current,
    twoYearMean,
    monthlyTrend: curr,
    status,
    confidencePct,
    lowerZoneIncreasePct,
  };
}

function avg(arr: number[]) {
  return arr.reduce((s, x) => s + x, 0) / Math.max(1, arr.length);
}

