// index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const { getFootballStatsForDay } = require("./engines/apiFootball");
const { getBasketballStatsForDay } = require("./engines/basketballEngine");
const { getTennisStatsForDay } = require("./engines/tennisEngine");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

// Loglamak için basit middleware
app.use((req, res, next) => {
  console.log("👉 Gelen istek:", req.method, req.path, req.query);
  next();
});

// ANA İSTATİSTİK ENDPOINTİ
app.get("/api/stats", async (req, res) => {
  const sport = (req.query.sport || "futbol").toLowerCase();
  const dayOffset = parseInt(req.query.day || "0", 10);

  console.log("⚽️ Yeni istek:", { sport, dayOffset });

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

// SAĞLIK KONTROLÜ
app.get("/", (req, res) => {
  res.send("sports-stats-api servis çalışıyor ✅");
});

// 404 - BİZDEN DÖNEN
app.use((req, res) => {
  res.status(404).json({ error: "Route bulunamadı", path: req.path });
});

app.listen(PORT, () => {
  console.log(`✅ sports-stats-api ${PORT} portunda çalışıyor`);
});
