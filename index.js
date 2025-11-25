// index.js — Günlük Maç İstatistikleri API (bahisveri)
// Örnek: /api/stats?sport=futbol&day=0

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { getFootballStatsForDay } = require("./engines/apiFootball");
const { getBasketballStatsForDay } = require("./engines/basketballEngine");
const { getTennisStatsForDay } = require("./engines/tennisEngine");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/* -----------------------------------
   Helperlar
----------------------------------- */

function normalizeSport(s) {
  if (!s) return null;
  s = String(s).toLowerCase();

  if (["futbol", "football", "soccer"].includes(s)) return "futbol";
  if (["basketbol", "basket", "basketball"].includes(s)) return "basketbol";
  if (["tenis", "tennis"].includes(s)) return "tenis";

  return null;
}

function normalizeDayOffset(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  if (n > 7) return 7;
  if (n < -7) return -7;
  return n;
}

// Basit ülke → bayrak eşlemesi (yoksa 🌍)
function flagFromCountry(countryName = "") {
  const c = countryName.toLowerCase();
  if (c.includes("turkey") || c.includes("türkiye")) return "🇹🇷";
  if (c.includes("england") || c.includes("english")) return "🏴";
  if (c.includes("spain")) return "🇪🇸";
  if (c.includes("italy")) return "🇮🇹";
  if (c.includes("germany")) return "🇩🇪";
  if (c.includes("france")) return "🇫🇷";
  if (c.includes("portugal")) return "🇵🇹";
  if (c.includes("belgium")) return "🇧🇪";
  if (c.includes("greece")) return "🇬🇷";
  return "🌍";
}

/**
 * FUTBOL: Api-Football fixtures → kategori bazlı stats objesi
 * Şimdilik “akıllı ama genel” cümleler; ileride gerçek istatistik
 * analizini bu fonksiyona koyarız.
 */
function buildFootballStatsFromFixtures(fixturesRaw = []) {
  const stats = {
    "🆚 Maç Sonucu": [],
    "⚽️ Toplam Gol": [],
    "🥅 Karşılıklı Gol": [],
    "🚩 Korner": [],
    "🟨 Toplam Kart": [],
  };

  const maxPerCategory = 8;

  for (const fx of fixturesRaw) {
    const leagueName = fx.league?.name || "";
    const countryName = fx.league?.country || "";
    const home = fx.teams?.home?.name || "Ev Sahibi";
    const away = fx.teams?.away?.name || "Deplasman";
    const flag = flagFromCountry(countryName);

    // Maç Sonucu
    if (stats["🆚 Maç Sonucu"].length < maxPerCategory) {
      stats["🆚 Maç Sonucu"].push({
        flag,
        teams: `${home} vs ${away}`,
        detail: `${home} ile ${away} arasındaki ${leagueName} mücadelesinde ev sahibi sahaya avantajlı çıkıyor.`,
        highlight: `${home} Kazanır`,
      });
    }

    // Toplam Gol
    if (stats["⚽️ Toplam Gol"].length < maxPerCategory) {
      stats["⚽️ Toplam Gol"].push({
        flag,
        teams: `${home} vs ${away}`,
        detail: `${home} ve ${away} maçlarında genellikle yüksek skor görülüyor.`,
        highlight: "2.5 Üst",
      });
    }

    // Karşılıklı Gol
    if (stats["🥅 Karşılıklı Gol"].length < maxPerCategory) {
      stats["🥅 Karşılıklı Gol"].push({
        flag,
        teams: `${home} vs ${away}`,
        detail: `İki takımın da skor katkısı beklenen bir karşılaşma.`,
        highlight: "KG Var",
      });
    }

    // Korner
    if (stats["🚩 Korner"].length < maxPerCategory) {
      stats["🚩 Korner"].push({
        flag,
        teams: `${home} vs ${away}`,
        detail: `Kanat oyunları ve ceza sahası içi aksiyon sayısının yüksek olması bekleniyor.`,
        highlight: "9.5 Korner Üst",
      });
    }

    // Kart
    if (stats["🟨 Toplam Kart"].length < maxPerCategory) {
      stats["🟨 Toplam Kart"].push({
        flag,
        teams: `${home} vs ${away}`,
        detail: `${leagueName} seviyesinde sert ikili mücadelelerin öne çıkacağı bir maç.`,
        highlight: "4.5 Kart Üst",
      });
    }
  }

  return stats;
}

/* -----------------------------------
   HEALTH CHECK
----------------------------------- */

app.get("/", (req, res) => {
  res.json({ ok: true, message: "sports-stats-api çalışıyor" });
});

/* -----------------------------------
   ANA ENDPOINT: /api/stats
----------------------------------- */

app.get("/api/stats", async (req, res) => {
  const sport = normalizeSport(req.query.sport);
  const dayOffset = normalizeDayOffset(req.query.day || 0);

  if (!sport) {
    return res
      .status(400)
      .json({ error: "Geçersiz veya eksik 'sport' parametresi" });
  }

  try {
    if (sport === "futbol") {
      const footballData = await getFootballStatsForDay(dayOffset);
      const fixtures = footballData.fixtures || [];
      const stats = buildFootballStatsFromFixtures(fixtures);

      return res.json({
        date: footballData.date,
        sport: "futbol",
        stats,
      });
    }

    if (sport === "basketbol") {
      const data = await getBasketballStatsForDay(dayOffset);
      return res.json({
        date: data.date,
        sport: data.sport,
        stats: data.stats,
      });
    }

    if (sport === "tenis") {
      const data = await getTennisStatsForDay(dayOffset);
      return res.json({
        date: data.date,
        sport: data.sport,
        stats: data.stats,
      });
    }

    return res.status(400).json({ error: "Desteklenmeyen spor türü" });
  } catch (err) {
    console.error("❌ /api/stats hata:", err.message || err);
    return res
      .status(500)
      .json({ error: "İstatistikler alınırken bir hata oluştu" });
  }
});

/* -----------------------------------
   SUNUCU
----------------------------------- */

app.listen(PORT, () => {
  console.log(`sports-stats-api ${PORT} portunda çalışıyor (PORT=${PORT})`);
});
