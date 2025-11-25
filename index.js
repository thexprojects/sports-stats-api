// ===========================
//  sports-stats-api / index.js
// ===========================

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// ===========================
//  GENEL AYARLAR
// ===========================

app.use(cors());

const APIFOOTBALL_BASE_URL =
  process.env.APIFOOTBALL_BASE_URL || "https://apiv3.apifootball.com";
const APIFOOTBALL_KEY = process.env.APIFOOTBALL_KEY || process.env.API_FOOTBALL_KEY;

// Gün ofsetine göre (0: bugün, -1: dün, 1: yarın) YYYY-MM-DD üret
function getDateWithOffset(dayOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + Number(dayOffset || 0));
  return d.toISOString().slice(0, 10);
}

// Belirli gün sayısı önceki tarih (takım son maçları için)
function getDateNDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ================================
// LİG FİLTRESİ YARDIMCI FONKSİYONLAR
// ================================

// Sadece bu lig isimlerini (ve türevlerini) istiyoruz
const ALLOWED_LEAGUE_KEYWORDS = [
  "uefa champions league",
  "uefa europa league",
  "uefa conference league",

  "premier league",
  "la liga",
  "serie a",
  "bundesliga",
  "ligue 1",

  "super lig", // Turkish Super Lig
  "super league", // Switzerland Super League
  "eredivisie",
  "pro league", // Belgium Pro League

  "1. lig", // Turkish 1. Lig
  "ligue 2",
  "la liga 2",
  "eerste divisie",
  "allsvenskan",
  "championship", // England Championship
  "bundesliga 2",
  "2. bundesliga",
  "serie b",
];

// Ulusal kupalar: sadece bu ülkelerin kupa maçları
const CUP_COUNTRIES = ["England", "Germany", "France", "Italy", "Spain", "Turkey"];

function isAllowedLeague(leagueNameRaw, countryNameRaw) {
  if (!leagueNameRaw) return false;

  const leagueName = String(leagueNameRaw).toLowerCase();
  const countryName = (countryNameRaw || "").toLowerCase();

  // 1) Lig adı içinde listedeki keyword’lerden biri geçiyorsa
  const isAllowedByName = ALLOWED_LEAGUE_KEYWORDS.some((key) =>
    leagueName.includes(key)
  );
  if (isAllowedByName) return true;

  // 2) Ulusal kupalar: isimde "cup" geçecek + ülke listede olacak
  const isCup = leagueName.includes("cup");
  const isCupCountry = CUP_COUNTRIES.some((c) =>
    countryName.includes(c.toLowerCase())
  );
  if (isCup && isCupCountry) return true;

  return false;
}

// ================================
//  TAKIM SON MAÇ ANALİZİ (FUTBOL)
// ================================

// Belirli bir takımın son maçlarını çek
async function fetchTeamLastMatches(teamId, lastCount = 5) {
  if (!teamId) return [];

  // Son 40 gün içerisindeki maçları alıyoruz, sonra son N maça düşürüyoruz
  const from = getDateNDaysAgo(40);
  const to = getDateNDaysAgo(-1); // bugünden 1 gün sonrası (güvenli aralık)

  const url = `${APIFOOTBALL_BASE_URL}/?action=get_events&from=${from}&to=${to}&team_id=${teamId}&APIkey=${APIFOOTBALL_KEY}`;

  const { data } = await axios.get(url);
  if (!Array.isArray(data)) return [];

  // Tarihe göre sırala, en yenilerden son N maçı al
  return data
    .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))
    .slice(0, lastCount);
}

// Tek bir takımın maç listesi üzerinden özet istatistik üret
function analyzeMatches(matches, teamName) {
  if (!matches || matches.length === 0) {
    return {
      teamName,
      games: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsForAvg: 0,
      goalsAgainstAvg: 0,
      bttsCount: 0,
      over25Count: 0,
    };
  }

  let wins = 0,
    draws = 0,
    losses = 0;
  let goalsFor = 0,
    goalsAgainst = 0;
  let bttsCount = 0,
    over25Count = 0;

  matches.forEach((m) => {
    const homeGoals = Number(m.match_hometeam_score || 0);
    const awayGoals = Number(m.match_awayteam_score || 0);
    const isHome = m.match_hometeam_name === teamName;

    const gf = isHome ? homeGoals : awayGoals;
    const ga = isHome ? awayGoals : homeGoals;

    goalsFor += gf;
    goalsAgainst += ga;

    if (gf > ga) wins++;
    else if (gf === ga) draws++;
    else losses++;

    const totalGoals = homeGoals + awayGoals;
    if (homeGoals > 0 && awayGoals > 0) bttsCount++;
    if (totalGoals >= 3) over25Count++;
  });

  const games = matches.length;

  return {
    teamName,
    games,
    wins,
    draws,
    losses,
    goalsForAvg: games ? goalsFor / games : 0,
    goalsAgainstAvg: games ? goalsAgainst / games : 0,
    bttsCount,
    over25Count,
  };
}

// İki takım için öne çıkan bahis türünü ve açıklamayı oluştur
function buildHighlightFromStats(homeStats, awayStats) {
  const homeWinRate = homeStats.games ? homeStats.wins / homeStats.games : 0;
  const awayWinRate = awayStats.games ? awayStats.wins / awayStats.games : 0;
  const homeBttsRate = homeStats.games ? homeStats.bttsCount / homeStats.games : 0;
  const awayBttsRate = awayStats.games ? awayStats.bttsCount / awayStats.games : 0;
  const homeOver25Rate = homeStats.games
    ? homeStats.over25Count / homeStats.games
    : 0;
  const awayOver25Rate = awayStats.games
    ? awayStats.over25Count / awayStats.games
    : 0;

  // 1) KG Var
  if (homeBttsRate >= 0.6 && awayBttsRate >= 0.6) {
    return {
      betType: "Karşılıklı Gol Var",
      description: `${homeStats.teamName} ve ${awayStats.teamName} son maçlarında yüksek oranda karşılıklı gol içeren karşılaşmalar oynadı. Öne çıkan bahis türü: Karşılıklı Gol Var.`,
    };
  }

  // 2) 2.5 Üst
  if (homeOver25Rate >= 0.6 && awayOver25Rate >= 0.6) {
    return {
      betType: "Toplam 2.5 Gol Üstü",
      description: `${homeStats.teamName} ve ${awayStats.teamName} son maçlarında gol ortalaması yüksek. Öne çıkan bahis türü: Toplam 2.5 Gol Üstü.`,
    };
  }

  // 3) Ev sahibi formda
  if (homeWinRate - awayWinRate >= 0.3) {
    return {
      betType: `${homeStats.teamName} Kazanır`,
      description: `${homeStats.teamName} son ${homeStats.games} maçında ${homeStats.wins} galibiyet aldı. Form durumu ${awayStats.teamName}’e göre daha iyi görünüyor. Öne çıkan bahis türü: ${homeStats.teamName} Kazanır.`,
    };
  }

  // 4) Deplasman formda
  if (awayWinRate - homeWinRate >= 0.3) {
    return {
      betType: `${awayStats.teamName} Kazanır`,
      description: `${awayStats.teamName} son ${awayStats.games} maçında ${awayStats.wins} galibiyet aldı. Form durumu ${homeStats.teamName}’e göre daha iyi görünüyor. Öne çıkan bahis türü: ${awayStats.teamName} Kazanır.`,
    };
  }

  // 5) Default: dengeli bir maç
  return {
    betType: "Dengeli Karşılaşma",
    description: `${homeStats.teamName} ve ${awayStats.teamName} son maçlarında benzer formda. Maç dengeli geçmeye aday görünüyor.`,
  };
}

// ================================
//  FUTBOL İÇİN GÜNLÜK MAÇ + ANALİZ
// ================================
async function fetchFootballStats(dayOffset) {
  const date = getDateWithOffset(dayOffset);

  const url = `${APIFOOTBALL_BASE_URL}/?action=get_events&from=${date}&to=${date}&APIkey=${APIFOOTBALL_KEY}`;

  const { data } = await axios.get(url);

  if (!Array.isArray(data)) {
    console.error("apifootball beklenmeyen yanıt:", data);
    return [];
  }

  console.log("Toplam maç sayısı:", data.length);

  // 1) Sadece istenen ligler
  const filteredFixtures = data.filter((fix) =>
    isAllowedLeague(fix.league_name, fix.country_name)
  );

  console.log("Lig filtresi sonrası maç sayısı:", filteredFixtures.length);

  // Eğer filtre sonrası hiç maç kalmadıysa, eski davranışa dön:
  const fixturesToUse =
    filteredFixtures.length > 0 ? filteredFixtures : data;

  // 2) Her maç için son maçları analiz ederek öne çıkan bahis türünü oluştur
  const result = await Promise.all(
    fixturesToUse.map(async (fix) => {
      const homeTeam = fix.match_hometeam_name;
      const awayTeam = fix.match_awayteam_name;
      const homeId = fix.match_hometeam_id;
      const awayId = fix.match_awayteam_id;

      let highlightBetType = "";
      let highlightText = "";

      try {
        const [homeLast, awayLast] = await Promise.all([
          fetchTeamLastMatches(homeId, 5),
          fetchTeamLastMatches(awayId, 5),
        ]);

        const homeStats = analyzeMatches(homeLast, homeTeam);
        const awayStats = analyzeMatches(awayLast, awayTeam);

        const highlight = buildHighlightFromStats(homeStats, awayStats);
        highlightBetType = highlight.betType;
        highlightText = highlight.description;
      } catch (e) {
        console.error("Analiz hatası:", e.message);
        highlightBetType = `${homeTeam} Kazanır`;
        highlightText = `${homeTeam} – ${awayTeam} karşılaşması için temel form analizi sırasında hata oluştu.`;
      }

      return {
        id: fix.match_id,
        league: fix.league_name,
        country: fix.country_name,
        matchTime: `${fix.match_date} ${fix.match_time}`,
        homeTeam,
        awayTeam,
        highlightBetType,
        highlightText,
      };
    })
  );

  return result;
}


// ================================
//  BASKETBOL & TENİS (BASİT ÖRNEK)
// ================================
// Şimdilik basit dummy veri; istersen bunları sonra gerçek API’ye bağlarız.

function fetchBasketballStats(dayOffset) {
  return [
    {
      id: "b1",
      league: "NBA",
      country: "USA",
      matchTime: getDateWithOffset(dayOffset) + " 21:00",
      homeTeam: "Lakers",
      awayTeam: "Warriors",
      highlightBetType: "Toplam Sayı 220.5 Üst",
      highlightText:
        "İki takım da tempolu oynuyor, son maçlarda toplam sayı ortalaması 225 civarında. Öne çıkan bahis türü: Toplam Sayı 220.5 Üst.",
    },
  ];
}

function fetchTennisStats(dayOffset) {
  return [
    {
      id: "t1",
      tournament: "ATP 500",
      country: "Spain",
      matchTime: getDateWithOffset(dayOffset) + " 16:00",
      homePlayer: "Nadal",
      awayPlayer: "Djokovic",
      highlightBetType: "Toplam Set 2.5 Üstü",
      highlightText:
        "İki oyuncu da birbirine yakın güçte, maçın uzun sürmesi bekleniyor. Öne çıkan bahis türü: Toplam Set 2.5 Üstü.",
    },
  ];
}

// ================================
//  API ENDPOINT’İ
// ================================

app.get("/api/stats", async (req, res) => {
  try {
    const sport = (req.query.sport || "").toLowerCase();
    const day = Number(req.query.day || 0);

    if (!sport) {
      return res.status(400).json({ error: "sport parametresi gerekli" });
    }

    if (sport === "futbol") {
      const matches = await fetchFootballStats(day);
      return res.json({ sport: "futbol", day, matches });
    }

    if (sport === "basketbol") {
      const matches = fetchBasketballStats(day);
      return res.json({ sport: "basketbol", day, matches });
    }

    if (sport === "tenis") {
      const matches = fetchTennisStats(day);
      return res.json({ sport: "tenis", day, matches });
    }

    return res.status(400).json({ error: "Geçersiz sport parametresi" });
  } catch (err) {
    console.error("API /api/stats hata:", err.message);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Basit health check
app.get("/", (req, res) => {
  res.send("sports-stats-api çalışıyor");
});

// ================================
//  SUNUCUYU BAŞLAT
// ================================

app.listen(PORT, () => {
  console.log(`sports-stats-api ${PORT} portunda çalışıyor`);
});
