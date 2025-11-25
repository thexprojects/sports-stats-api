// server.js — FINAL

const express = require("express");
const cors = require("cors");

const { getFootballStatsForDay } = require("./engines/apiFootball");
const { getBasketballStatsForDay } = require("./engines/basketballEngine");
const { getTennisStatsForDay } = require("./engines/tennisEngine");
const { buildFootballCategories } = require("./engines/footballFormatter");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/* =========================
    HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.json({ ok: true, message: "sports-stats-api çalışıyor" });
});

/* =========================
      ANA ENDPOINT
   /api/stats?sport=&day=
========================= */
app.get("/api/stats", async (req, res) => {
  const sport = String(req.query.sport || "").toLowerCase();
  const offset = Number(req.query.day || 0);

  try {
    /* -----------------------------------
       FUTBOL (GERÇEK API + FORMATTER)
    ----------------------------------- */
    if (sport === "futbol") {
      const apiData = await getFootballStatsForDay(offset);
      const fixtures = apiData.fixtures || [];

      // UI formatına çeviriyoruz
      const categories = buildFootballCategories(fixtures);

      return res.json(categories);
    }

    /* -----------------------------------
       BASKETBOL (şimdilik dummy)
    ----------------------------------- */
    if (sport === "basketbol") {
      const data = await getBasketballStatsForDay(offset);
      return res.json(data.stats || {});
    }

    /* -----------------------------------
       TENİS (şimdilik dummy)
    ----------------------------------- */
    if (sport === "tenis") {
      const data = await getTennisStatsForDay(offset);
      return res.json(data.stats || {});
    }

    return res.status(400).json({ error: "Geçersiz spor parametresi" });
  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).json({
      error: "Veri alınırken hata oluştu",
      detail: err.message,
    });
  }
});

/* =========================
      SERVER START
========================= */
app.listen(PORT, () => {
  console.log(`sports-stats-api ${PORT} portunda çalışıyor`);
});
