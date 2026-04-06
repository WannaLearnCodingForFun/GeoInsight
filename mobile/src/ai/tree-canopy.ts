export type TreeCanopyResult = {
  totalCanopies: number;
  densityPerAcre: number;
  stressedCount: number;
  confidencePct: number;
  changeVsPrevious: { missing: number; new: number };
};

export function estimateTreeCanopy(params: { ndviSeries: number[]; areaAcres: number; resolutionMetersPerPixel?: number }): TreeCanopyResult {
  const resolution = params.resolutionMetersPerPixel ?? 0.08;
  const vigor = params.ndviSeries.reduce((s, x) => s + Math.max(0, x), 0) / Math.max(1, params.ndviSeries.length);
  const totalCanopies = Math.max(8, Math.round(params.areaAcres * 70 * (0.65 + vigor)));
  const densityPerAcre = totalCanopies / Math.max(0.1, params.areaAcres);
  const stressedCount = Math.round(totalCanopies * Math.max(0.03, 0.18 - vigor * 0.2));
  const missing = Math.max(0, Math.round(totalCanopies * 0.015));
  const newlyDetected = Math.max(0, Math.round(totalCanopies * 0.01));

  const clarity = Math.max(0, Math.min(1, 0.18 / resolution));
  const confidencePct = Math.round((0.6 + 0.3 * clarity) * 100);

  return {
    totalCanopies,
    densityPerAcre: Number(densityPerAcre.toFixed(1)),
    stressedCount,
    confidencePct,
    changeVsPrevious: { missing, new: newlyDetected },
  };
}

