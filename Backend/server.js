// ─────────────────────────────────────────────────────────────
// server.js  —  Servidor Express principal
// ─────────────────────────────────────────────────────────────

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const statsRoutes = require("./routes/stats.routes");
const distributionRoutes = require("./routes/distributions.routes");
const problemRoutes = require("./routes/problem.routes");
const expectedValueRoutes = require("./routes/expectedValueRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: "http://localhost:5173" })); // Puerto por defecto de Vite
app.use(express.json());

// ── Rutas ─────────────────────────────────────────────────────
app.use("/api/stats", statsRoutes);
app.use("/api/distributions", distributionRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/expected-value", expectedValueRoutes);

// ── Health check ──────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Statistics API running", port: PORT });
});

// ── Frontend compilado (producción) ───────────────────────────
// Si existe FrontEnd/mi-app/dist (después de `npm run build`), Express
// también sirve la página, así todo vive bajo un solo enlace.
const DIST = process.env.STATIC_DIR || path.join(__dirname, "..", "FrontEnd", "mi-app", "dist");
if (fs.existsSync(path.join(DIST, "index.html"))) {
  app.use(express.static(DIST));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api/")) {
      return res.sendFile(path.join(DIST, "index.html"));
    }
    next();
  });
}

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.path} no encontrada.` });
});

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Error interno del servidor." });
});

app.listen(PORT, () => {
  console.log(`\n✅ Statistics API corriendo en http://localhost:${PORT}`);
  console.log(`   Rutas disponibles:`);
  console.log(`   POST /api/stats/variance`);
  console.log(`   POST /api/stats/expected-value`);
  console.log(`   GET  /api/distributions/normal/curve`);
  console.log(`   POST /api/distributions/normal/area`);
  console.log(`   POST /api/distributions/normal/zscore`);
  console.log(`   GET  /api/distributions/tstudent/curve`);
  console.log(`   GET  /api/distributions/tstudent/compare`);
  console.log(`   GET  /api/problems`);
  console.log(`   GET  /api/problems/:id`);

  console.log(`   POST /api/expected-value/fx`);
  console.log(`   POST /api/expected-value/distribution`);
  console.log(`   POST /api/expected-value/fxy`);
  console.log(`   POST /api/expected-value/px\n`);
});