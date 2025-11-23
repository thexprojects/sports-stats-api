// server.js — Günlük Maç İstatistikleri API (FINAL)
// /api/stats?sport=futbol&day=0

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ------------------ Dummy veri (5–8 arası) ------------------ //

const todayFutbol = [
  {
    home: "Galatasaray",
    away: "Fenerbahçe",
    league: "Süper Lig",
    time: "20:00",
    market: "Maç Sonucu",
    line: "1X2",
    odds: "2.10 / 3.40 / 3.00"
  },
  {
    home: "Beşiktaş",
    away: "Trabzonspor",
    league: "Süper Lig",
    time: "17:00",
    market: "Toplam Gol",
    line: "2.5 Üst",
    odds: "1.80"
  },
  {
    home: "Manchester City",
    away: "Liverpool",
    league: "Premier League",
    time: "15:30",
    market: "Maç Sonucu",
    line: "1X2",
    odds: "1.95 / 3.80 / 3.40"
  },
  {
    home: "Real Madrid",
    away: "Barcelona",
    league: "La Liga",
    time: "22:00",
    market: "Karşılıklı Gol",
    line: "Evet",
    odds: "1.65"
  },
  {
    home: "Inter",
    away: "Milan",
    league: "Serie A",
    time: "19:00",
    market: "Toplam Gol",
    line: "2.5 Alt",
    odds: "1.90"
  },
  {
    home: "PSG",
    away: "Lyon",
    league: "Ligue 1",
    time: "21:45",
    market: "Ev Sahibi Gol",
    line: "1.5 Üst",
    odds: "1.60"
  }
];

const todayBasketbol = [
  {
    home: "Anadolu Efes",
    away: "Fenerbahçe Beko",
    league: "BSL",
    time: "20:30",
    market: "Maç Sonu Toplam Sayı",
    line: "165.5 Üst",
    odds: "1.85"
  },
  {
    home: "CSKA Moskova",
    away: "Real Madrid",
    league: "EuroLeague",
    time: "21:00",
    market: "Ev Sahibi Toplam Sayı",
    line: "82.5 Üst",
    odds: "1.80"
  },
  {
    home: "Boston Celtics",
    away: "Miami Heat",
    league: "NBA",
    time: "03:00",
    market: "Maç Sonu Toplam Sayı",
    line: "219.5 Üst",
    odds: "1.90"
  },
  {
    home: "Los Angeles Lakers",
    away: "Golden State Warriors",
    league: "NBA",
    time: "05:30",
    market: "Deplasman Toplam Sayı",
    line: "112.5 Üst",
    odds: "1.88"
  },
  {
    home: "Barcelona",
    away: "Olympiacos",
    league: "EuroLeague",
    time: "19:45",
    market: "Maç Sonu Toplam Sayı",
    line: "157.5 Alt",
    odds: "1.92"
  }
];

const todayTenis = [
  {
    home: "N. Djokovic",
    away: "C. Alcaraz",
    league: "ATP",
    time: "14:00",
    market: "Maç Sonucu",
    line: "Djokovic",
    odds: "1.75"
  },
  {
    home: "I. Swiatek",
    away: "A. Sabalenka",
    league: "WTA",
    time: "16:30",
    market: "Toplam Oyun",
    line: "21.5 Üst",
    odds: "1.85"
  },
  {
    home: "R. Nadal",
    away: "D. Medvedev",
    league: "ATP",
    time: "18:00",
    market: "Set Bahsi",
    line: "2-1",
    odds: "3.20"
  },
  {
    home: "S. Tsitsipas",
    away: "A. Zverev",
    league: "ATP",
    time: "20:00",
    market: "Toplam Set",
    line: "3 Set",
    odds: "2.10"
  },
  {
    home: "O. Jabeur",
    away: "C. Gauff",
    league: "WTA",
    time: "12:00",
    market: "Maç Sonucu",
    line: "Gauff",
    odds: "1.90"
  }
];

// ------------------ Helperlar ------------------ //

function normalizeSport(s) {
  if (!s) return null;
  s = String(s).toLowerCase();
  if (s === "futbol" || s === "football" || s === "soccer") return "futbol";
  if (s === "basketbol" || s === "basket" || s === "basketball") return "basketbol";
  if (s === "tenis" || s === "tennis") return "tenis";
  return null;
}

function normalizeDayOffset(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  if (n > 7) return 7;
  if (n < -7) return -7;
  return n;
}

// ------------------ API ------------------ //

// Sağlık kontrolü
app.get("/", (req, res) => {
  res.json({ ok: true, message: "sports-stats-api çalışıyor" });
});

// Asıl endpoint
app.get("/api/stats", (req, res) => {
  const sport = normalizeSport(req.query.sport);
  const dayOffset = normalizeDayOffset(req.query.day || 0);

  if (!sport) {
    return res.status(400).json({ error: "Geçersiz veya eksik 'sport' parametresi" });
  }

  // Şimdilik sadece bugün için veri veriyoruz, farklı günler için boş liste
  if (dayOffset !== 0) {
    return res.json([]);
  }

  let list = [];
  if (sport === "futbol") list = todayFutbol;
  if (sport === "basketbol") list = todayBasketbol;
  if (sport === "tenis") list = todayTenis;

  // EXTRA güvenlik: 8 adetten fazlaysa kıs
  if (list.length > 8) {
    list = list.slice(0, 8);
  }

  console.log(
    `[INFO] /api/stats -> sport=${sport}, dayOffset=${dayOffset}, count=${list.length}`
  );

  return res.json(list);
});

// ------------------ Sunucu ------------------ //
app.listen(PORT, () => {
  console.log(`sports-stats-api ${PORT} portunda çalışıyor (PORT=${PORT})`);
});
