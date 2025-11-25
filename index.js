// ===========================
//  sports-stats-api / index.js
// ===========================

const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

// App
const app = express();
app.use(cors());

// Port
const PORT = process.env.PORT || 10000;

// Root test endpoint
app.get("/", (req, res) => {
  res.json({ ok: true, message: "sports-stats-api çalışıyor" });
});

// Test Key Endpoint
app.get("/api/test-key", (req, res) => {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    return res.json({ keyExists: false, key: null });
  }
  res.json({ keyExists: true, key: "LOADED" });
});

// ===========================
//  FUTBOL İSTATİSTİKLERİ (API-FOOTBALL)
// ===========================

app.get("/api/stats", async (req, res) => {
  try {
    const sport = req.query.sport || "";
    const dayOffset = Number(req.query.day || 0);

    console.log("⚽ Futbol isteği hazırlanıyor:", {
      isoDate: new Date(Date.now() + dayOffset * 86400000)
        .toISOString()
        .slice(0, 10),
      dayOffset,
    });

    // Sadece futbol API-Football'dan çekiliyor
    if (sport !== "futbol") {
      return res.json({
        "🆚 Maç Sonucu": [],
        "⚽ Toplam Gol": [],
        "❗ Karşılıklı Gol": [],
        "▶️ Korner": [],
        "🟨 Toplam Kart": []
      });
    }

    const targetDate = new Date(Date.now() + dayOffset * 86400000)
      .toISOString()
      .slice(0, 10);

    const API_KEY = process.env.API_FOOTBALL_KEY;

    const response = await axios.get(
      `https://v3.football.api-sports.io/fixtures?date=${targetDate}`,
      {
        headers: {
          "x-apisports-key": API_KEY,
        },
      }
    );

    console.log("⚽ Futbol API cevabı:", {
      count: response.data.results,
      status: response.status,
    });

    // Veriyi normalize et
    const fixtures = response.data.response || [];

    const formatted = {
      "🆚 Maç Sonucu": [],
      "⚽ Toplam Gol": [],
      "❗ Karşılıklı Gol": [],
      "▶️ Korner": [],
      "🟨 Toplam Kart": []
    };

    fixtures.forEach((match) => {
      const home = match.teams?.home?.name || "";
      const away = match.teams?.away?.name || "";
      const league = match.league?.name || "";
      const flag = match.teams?.home?.logo || "";

      const item = {
        flag: "🏳️",
        teams: `${home} vs ${away}`,
        detail: `${league} – ${home} form durumu analiz edildi.`,
        highlight: "İstatistik Yükleniyor"
      };

      formatted["🆚 Maç Sonucu"].push(item);
      formatted["⚽ Toplam Gol"].push(item);
      formatted["❗ Karşılıklı Gol"].push(item);
      formatted["▶️ Korner"].push(item);
      formatted["🟨 Toplam Kart"].push(item);
    });

    res.json(formatted);

  } catch (err) {
    console.error("❌ Futbol API HATASI:", err.message);
    return res.status(500).json({ error: "Football API error", detail: err.message });
  }
});

// ===========================
//  SERVER START
// ===========================

app.listen(PORT, () => {
  console.log(`🚀 sports-stats-api ${PORT} portunda çalışıyor`);
});
