// ===========================
//  sports-stats-api / index.js
// ===========================

require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");

// Eğer bu dosyalar sende varsa kullanıyoruz (yoksa bu iki satırı silebilirsin)
let getBasketballStatsForDay;
let getTennisStatsForDay;
try {
  ({ getBasketballStatsForDay } = require("./engines/basketballEngine"));
  ({ getTennisStatsForDay } = require("./engines/tennisEngine"));
} catch (e) {
  // opsiyonel, yoksa sorun değil
  console.log("Basketbol / tenis engine'leri bulunamadı, sadece futbol çalışacak.");
}

// -------------------------------------------------
// Lig filtreleri (API-FOOTBALL v3 fixtures formatına göre)
// -------------------------------------------------

const ALLOWED_LEAGUE_KEYWORDS = [
  "uefa champions league",
  "uefa europa league",
  "uefa conference league",
  "premier league",
  "la liga",
  "serie a",
  "bundesliga",
  "ligue 1",
  "super lig", // Türkiye
  "eredivisie",
  "pro league", // Belçika
  "championship",
  "bundesliga 2",
  "2. bundesliga",
  "serie b",
  "ligue 2",
  "la liga 2",
  "segunda division",
  "eerste divisie",
  "allsvenskan",
  "super league"
];

const CUP_COUNTRIES = [
  "england",
  "germany",
  "france",
  "italy",
  "spain",
  "turkey"
];

const CUP_KEYWORDS = [
  "cup",
  "pokal",
  "coppa",
  "copa del rey",
  "kupa"
];

// API-FOOTBALL fixture objesi alır
function isAllowedFootballMatch(fix) {
  const leagueName = (fix.league?.name || "").toLowerCase();
  const countryName = (fix.league?.country || "").toLowerCase();

  const inFixedLeague = ALLOWED_LEAGUE_KEYWORDS.some((key) =>
    leagueName.includes(key)
  );

  const isCup =
    CUP_COUNTRIES.some((c) => countryName.includes(c)) &&
    CUP_KEYWORDS.some((k) => leagueName.includes(k));

  return inFixedLeague || isCup;
}

// Basit ülke -> bayrak (tam değil, placeholder)
function getFlagEmoji(countryName = "") {
  const name = countryName.toLowerCase();
  if (name.includes("turkey") || name.includes("türkiye")) return "🇹🇷";
  if (name.includes("england") || name.includes("united kingdom")) return "🏴";
  if (name.includes("spain")) return "🇪🇸";
  if (name.includes("italy")) return "🇮🇹";
  if (name.includes("germany")) return "🇩🇪";
  if (name.includes("france")) return "🇫🇷";
  if (name.includes("netherlands")) return "🇳🇱";
  if (name.includes("portugal")) return "🇵🇹";
  return "🏳️";
}

// İstatistik cümlesi (şimdilik dummy ama net “istatistik cümlesi”)
function buildStatSentence(fix) {
  const home = fix.teams?.home?.name || "Ev sahibi";
  const away = fix.teams?.away?.name || "Deplasman";
  const league = fix.league?.name || "Lig";

  return `${league} kapsamında oynanacak ${home} – ${away} karşılaşması için son maç istatistikleri analiz edildi.`;
}

// Kategoriye göre öne çıkan bahis metni
function buildHighlight(fix, categoryKey) {
  const home = fix.teams?.home?.name || "Ev sahibi";
  const away = fix.teams?.away?.name || "Deplasman";

  switch (categoryKey) {
    case "🆚 Maç Sonucu":
      return `${home} Kazanır`;
    case "⚽ Toplam Gol":
      return "2.5 Üst";
    case "❗ Karşılıklı Gol":
      return "KG Var";
    case "▶️ Korner":
      return "9.5 Üst Korner";
    case "🟨 Toplam Kart":
      return "4.5 Üst Kart";
    default:
      return `${home} Kaybetmez`;
  }
}

// -------------------------------------------------
// App
// -------------------------------------------------

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;

// Root test
app.get("/", (req, res) => {
  res.json({ ok: true, message: "sports-stats-api çalışıyor" });
});

// Key test
app.get("/api/test-key", (req, res) => {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    return res.json({ keyExists: false, key: null });
  }
  res.json({ keyExists: true, key: "LOADED" });
});

// -------------------------------------------------
//  /api/stats endpoint'i
// -------------------------------------------------

app.get("/api/stats", async (req, res) => {
  try {
    const sport = (req.query.sport || "").toLowerCase();
    const dayOffset = Number(req.query.day || 0);

    // BASKETBOL & TENİS (dummy)
    if (sport === "basketbol" && typeof getBasketballStatsForDay === "function") {
      const data = await getBasketballStatsForDay(dayOffset);
      return res.json(data.stats || {});
    }

    if (sport === "tenis" && typeof getTennisStatsForDay === "function") {
      const data = await getTennisStatsForDay(dayOffset);
      return res.json(data.stats || {});
    }

    // FUTBOL
    if (sport !== "futbol") {
      // Geçersiz sport gelirse boş obje dön
      return res.json({});
    }

    const targetDate = new Date(Date.now() + dayOffset * 86400000)
      .toISOString()
      .slice(0, 10);

    console.log("⚽ Futbol isteği hazırlanıyor:", {
      targetDate,
      dayOffset,
    });

    const API_KEY = process.env.API_FOOTBALL_KEY;
    if (!API_KEY) {
      throw new Error("API_FOOTBALL_KEY tanımlı değil");
    }

    const response = await axios.get(
      `https://v3.football.api-sports.io/fixtures?date=${targetDate}`,
      {
        headers: {
          "x-apisports-key": API_KEY,
        },
      }
    );

    console.log("⚽ Futbol API cevabı:", {
      results: response.data.results,
      status: response.status,
    });

    const fixtures = response.data.response || [];

    // Lig filtresi
    let usedFixtures = fixtures.filter(isAllowedFootballMatch);
    if (usedFixtures.length === 0) {
      // o gün filtreye uyan maç yoksa, tümünü kullan (boş ekran olmasın)
      usedFixtures = fixtures;
    }

    const formatted = {
      "🆚 Maç Sonucu": [],
      "⚽ Toplam Gol": [],
      "❗ Karşılıklı Gol": [],
      "▶️ Korner": [],
      "🟨 Toplam Kart": [],
    };

    usedFixtures.forEach((fix) => {
      const home = fix.teams?.home?.name || "";
      const away = fix.teams?.away?.name || "";
      const league = fix.league?.name || "";
      const country = fix.league?.country || "";

      const base = {
        flag: getFlagEmoji(country),
        teams: `${home} vs ${away}`,
        detail: buildStatSentence(fix),
      };

      Object.keys(formatted).forEach((catKey) => {
        formatted[catKey].push({
          ...base,
          highlight: buildHighlight(fix, catKey),
        });
      });
    });

    // Her kategori için maksimum 8 maç göster
    Object.keys(formatted).forEach((key) => {
      formatted[key] = formatted[key].slice(0, 8);
    });

    return res.json(formatted);
  } catch (err) {
    console.error("❌ Futbol API HATASI:", err.message);
    return res
      .status(500)
      .json({ error: "Football API error", detail: err.message });
  }
});

// -------------------------------------------------
//  SERVER START
// -------------------------------------------------

app.listen(PORT, () => {
  console.log(`🚀 sports-stats-api ${PORT} portunda çalışıyor`);
});
