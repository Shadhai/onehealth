function clampRisk(value) {
  return Math.max(0, Math.min(1, value));
}

function validPoints(series) {
  return series
    .map((point) => ({
      time: Date.parse(point.generated_at),
      risk: Number(point.risk_index),
    }))
    .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.risk))
    .sort((a, b) => a.time - b.time);
}

export function forecastRisk(series, days = 7) {
  const points = validPoints(Array.isArray(series) ? series : []);
  if (points.length < 2 || days < 1) {
    return { available: false, slopePerDay: 0, rSquared: 0, predictions: [] };
  }

  const start = points[0].time;
  const x = points.map((point) => (point.time - start) / 86_400_000);
  const y = points.map((point) => point.risk);
  const meanX = x.reduce((sum, value) => sum + value, 0) / x.length;
  const meanY = y.reduce((sum, value) => sum + value, 0) / y.length;
  const denominator = x.reduce((sum, value) => sum + (value - meanX) ** 2, 0);
  const slope = denominator === 0
    ? 0
    : x.reduce((sum, value, index) => sum + (value - meanX) * (y[index] - meanY), 0) / denominator;
  const intercept = meanY - slope * meanX;
  const predicted = (value) => intercept + slope * value;
  const residuals = y.reduce((sum, value, index) => sum + (value - predicted(x[index])) ** 2, 0);
  const total = y.reduce((sum, value) => sum + (value - meanY) ** 2, 0);
  const rSquared = total === 0 ? 1 : Math.max(0, 1 - residuals / total);
  const lastTime = points[points.length - 1].time;
  const lastX = (lastTime - start) / 86_400_000;

  const predictions = Array.from({ length: days }, (_, index) => {
    const forecastTime = lastTime + (index + 1) * 86_400_000;
    return {
      date: new Date(forecastTime).toISOString().slice(0, 10),
      risk_index: Number(clampRisk(predicted(lastX + index + 1)).toFixed(3)),
    };
  });

  return {
    available: true,
    slopePerDay: Number(slope.toFixed(4)),
    rSquared: Number(rSquared.toFixed(3)),
    predictions,
  };
}
