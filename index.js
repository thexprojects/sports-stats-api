// index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Engine'ler
const { getFootballStatsForDay } = require("./engines/apiFootball");
const { getBasketballStatsForDay } = require("./engines/basketballEngine");
const { getTennisStatsForDay } = require("./engines/tennisEngine");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

/**
 * ANA ENDPOINT
 *  GET /api/stats?sport=futbol|basketbol|tenis&day=0|1|2
 */
app.get("/api/stats", async (req, res) => {
  const sport = (req.query.sport || "futbol").toLowerCase(); // futbol / basketbol / tenis
  const dayOffset = parseInt(req.query.day || "0", 10);      // 0 = bugün, 1 = yarın, 2 = öbür gün

  console.log("🎯 Yeni istek:", { sport, dayOffset });

  try {
    let payload;

    if (sport === "futbol") {
      payload = await getFootballStatsForDay(dayOffset);
    } else if (sport === "basketbol") {
      payload = await getBasketballStatsForDay(dayOffset);
    } else if (sport === "tenis") {
      payload = await getTennisStatsForDay(dayOffset);
    } else {
      return res.status(400).json({ error: "Geçersiz spor parametresi" });
    }

    return res.json(payload);
  } catch (err) {
    console.error("🚨 DETAYLI İSTATİSTİK HATASI:", {
      sport,
      dayOffset,
      message: err?.message,
      responseData: err?.response?.data,
    });

    return res
      .status(500)
      .json({ error: "İstatistik hesaplanırken hata oluştu" });
  }
});

/**
 * SAĞLIK KONTROLÜ
 */
app.get("/", (req, res) => {
  res.send("sports-stats-api servis çalışıyor ✅");
});

app.listen(PORT, () => {
  console.log(`✅ sports-stats-api ${PORT} portunda çalışıyor`);
});

// (Opsiyonel ama zarar vermez)
module.exports = app;
