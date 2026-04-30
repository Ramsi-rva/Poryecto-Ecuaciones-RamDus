exports.variance = (req, res) => {
  const { data, type } = req.body;

  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;

  const sum = data.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0);

  const variance = type === 'sample'
    ? sum / (n - 1)
    : sum / n;

  res.json({
    mean,
    variance,
    standardDeviation: Math.sqrt(variance),
    n,
    type,
    deviations: data.map(x => +(Math.pow(x - mean, 2).toFixed(4)))
  });
};

exports.expectedValue = (req, res) => {
  const { distribution } = req.body;

  const expectedValue = distribution.reduce((acc, x) => acc + x.value * x.prob, 0);

  const expectedValueSquared = distribution.reduce(
    (acc, x) => acc + Math.pow(x.value, 2) * x.prob,
    0
  );

  const variance = expectedValueSquared - Math.pow(expectedValue, 2);

  res.json({
    expectedValue,
    expectedValueSquared,
    variance,
    standardDeviation: Math.sqrt(variance),
    sumOfProbs: distribution.reduce((a, b) => a + b.prob, 0),
    isValid: Math.abs(distribution.reduce((a, b) => a + b.prob, 0) - 1) < 0.01
  });
};