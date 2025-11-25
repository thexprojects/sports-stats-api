// ===========================
//  sports-stats-api / index.js
// ===========================

const express = require("express");
const axios = require("axios");
const cors = require("cors");
// index.js / server.js en üstlerde bir yere EKLE

// Lig isimleriyle filtre (lig adı içinde geçmesi yeterli)
const ALLOWED_LEAGUE_KEYWORDS = [
  'uefa champions league',
  'uefa europa league',
  'uefa conference league',
  'premier league',
  'la liga',
  'serie a',
  'bundesliga',
  'ligue 1',
  'super lig',              // Turkish Super League
  'super league',           // İsviçre vb. ile karışmasın diye kupada ülke filtresi var
  'eredivisie',
  'pro league',             // Belgium Pro League
  '1. lig',                 // Turkish 1. Lig
  'bundesliga 2',
  '2. bundesliga',
  'serie b',
  'ligue 2',
  'la liga 2',
  'segunda division',       // La Liga 2 alternatif
  'eerste divisie',
  'switzerland super league',
  'sweden allsvenskan',
  'championship'            // England Championship
];

// Ulusal kupa için ülke listesi
const CUP_COUNTRIES = [
  'england',
  'germany',
  'france',
  'italy',
  'spain',
  'turkey'
];

// Kupa adlarında geçebilecek anahtar kelimeler
const CUP_KEYWORDS = [
  'cup',          // fa cup, turkish cup
  'pokal',        // dfb pokal
  'coppa',        // coppa italia
  'copa del rey', // ispanya
  'kupa'          // türkiye kupası
];

// apifootball event objesini alır, bu maçı kullanıp kullanmayacağımıza karar verir
function isAllowedFootballMatch(event) {
  const leagueName = (event.league_name || '').toLowerCase();
  const countryName = (event.country_name || '').toLowerCase();

  // 1) Direkt lig filtreleri
  const inFixedLeague = ALLOWED_LEAGUE_KEYWORDS.some(key =>
    leagueName.includes(key)
  );

  // 2) Ulusal kupa (sadece seçili ülkeler)
  const isCup =
    CUP_COUNTRIES.some(c => countryName.includes(c)) &&
    CUP_KEYWORDS.some(k => leagueName.includes(k));

  return inFixedLeague || isCup;
}

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
