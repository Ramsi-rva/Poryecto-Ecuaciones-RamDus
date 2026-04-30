function pdf(z) {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z);
}

exports.normalCurve = (req, res) => {
  const { zMin = -5, zMax = 5, steps = 100 } = req.query;

  const xs = [];
  const ys = [];

  const step = (zMax - zMin) / steps;

  for (let i = 0; i <= steps; i++) {
    const z = +zMin + i * step;
    xs.push(z);
    ys.push(pdf(z));
  }

  res.json({ x: xs, y: ys });
};

exports.normalArea = (req, res) => {
  const { a, b } = req.body;

  const step = 0.001;
  let sum = 0;

  for (let z = a; z <= b; z += step) {
    sum += pdf(z) * step;
  }

  res.json({ area: sum });
};