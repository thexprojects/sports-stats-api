// index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// .env yükle
dotenv.config();

// API key kontrolü (sadece startup’ta bir kere log atıyor)
if (!process.env.API_FOOTBALL_KEY) {
  console.warn("⚠ API_FOOTBALL_KEY .env içinde TANIMLI DEĞİL!");
} else {
  console.log("✅ API_FOOTBALL_KEY yüklendi (ilk 4 karakter):", process.env.API_FOOTBALL_KEY.slice(0, 4), "****");
}

// Engine'ler
const { getFootballStatsForDay } = require("./engines/apiFootball");
const { getBasketballStatsForDay } = require("./engines/basketballEngine");
const { getTennisStatsForDay } = require("./engines/tennisEngine");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

// Ana istatistik endpoint'i
app.get("/api/stats", async (req, res) => {
  const sport = (req.query.sport || "futbol").toLowerCase(); // futbol / basketbol / tenis
  const dayOffset = parseInt(req.query.day || "0", 10);      // 0 = bugün, 1 = yarın, 2 = öbür gün

  console.log("🆕 Yeni istek:", { sport, dayOffset });

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

// Sağlık kontrolü
app.get("/", (req, res) => {
  res.send("sports-stats-api servis çalışıyor ✅");
});

app.listen(PORT, () => {
  console.log(`✅ sports-stats-api ${PORT} portunda çalışıyor`);
});
