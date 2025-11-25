const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());

// -------------------------------------------------------
// 0) API KEY TEST ENDPOINT
// -------------------------------------------------------
app.get("/api/test-key", (req, res) => {
  res.json({
    keyExists: !!process.env.API_FOOTBALL_KEY,
    key: process.env.API_FOOTBALL_KEY ? "LOADED" : "NOT FOUND"
  });
});

// -------------------------------------------------------
// 1) Yardımcı Fonksiyonlar
// -------------------------------------------------------

// Gün ofsetine göre tarih hesaplama
function getDateFromOffset(dayOffset = 0) {
    const now = new Date();
    now.setDate(now.getDate() + dayOffset);
    return now.toISOString().split("T")[0];
}

// API-Football istek hazırlayıcı
async function fetchFootballFixtures(date) {
    try {
        const response = await axios.get("https://v3.football.api-sports.io/fixtures", {
            params: { date },
            headers: {
                "x-apisports-key": process.env.API_FOOTBALL_KEY,
                "x-rapidapi-host": "v3.football.api-sports.io"
            }
        });

        return response.data;
    } catch (err) {
        console.error("⚠️ Football API ERROR:", err?.response?.data || err.message);
        return null;
    }
}

// -------------------------------------------------------
// 2) İstatistikleri formatlayan fonksiyon
// -------------------------------------------------------

function buildFootballStats(fixtures) {
    const stats = {
        "🟨 Maç Sonucu": [],
        "⚽ Toplam Gol": [],
        "🤝 Karşılıklı Gol": [],
        "🚩 Korner": [],
        "🟨 Toplam Kart": []
    };

    fixtures.forEach(fx => {
        const home = fx.teams.home.name;
        const away = fx.teams.away.name;
        const goalsHome = fx.goals.home;
        const goalsAway = fx.goals.away;

        stats["🟨 Maç Sonucu"].push(`${home} - ${away} | Sonuç: ${goalsHome}-${goalsAway}`);
        stats["⚽ Toplam Gol"].push(`${home} - ${away} | Toplam: ${goalsHome + goalsAway}`);
        stats["🤝 Karşılıklı Gö l"].push(`${home} - ${away} | BTTS: ${(goalsHome > 0 && goalsAway > 0) ? "Evet" : "Hayır"}`);
        stats["🚩 Korner"].push(`${home} - ${away} | Korner verisi API-Football’dan premium endpoint`);
        stats["🟨 Toplam Kart"].push(`${home} - ${away} | Kart verisi premium endpoint`);
    });

    return stats;
}

// -------------------------------------------------------
// 3) /api/stats Route
// -------------------------------------------------------

app.get("/api/stats", async (req, res) => {
    const sport = req.query.sport;
    const day = Number(req.query.day || 0);

    if (!sport) return res.status(400).json({ error: "sport parametresi gerekli" });

    const date = getDateFromOffset(day);

    // FUTBOL
    if (sport === "futbol") {
        console.log("⚽ Futbol isteği hazırlanıyor:", { date, day });

        const data = await fetchFootballFixtures(date);

        if (!data || !data.response) {
            return res.json({
                "🟨 Maç Sonucu": [],
                "⚽ Toplam Gol": [],
                "🤝 Karşılıklı Gol": [],
                "🚩 Korner": [],
                "🟨 Toplam Kart": []
            });
        }

        console.log("✔️ Futbol API cevabı:", { count: data.response.length, status: data.results });

        const stats = buildFootballStats(data.response);
        return res.json(stats);
    }

    // BASKETBOL → Dummy veri
    if (sport === "basketbol") {
        return res.json({
            "🏀 Toplam Sayı": [
                "Lakers – Warriors maçları genelde yüksek skor olur.",
                "Celtics – Heat düşük tempo oynar."
            ]
        });
    }

    // TENİS → Dummy veri
    if (sport === "tenis") {
        return res.json({
            "🎾 Servis Kırma": [
                "Nadal – Djokovic maçlarında servis kırma oranı yüksektir.",
                "Alcaraz hızlı kortlarda agresif başlar."
            ]
        });
    }

    return res.status(400).json({ error: "Geçersiz sport parametresi" });
});

// -------------------------------------------------------
// 4) Root endpoint
// -------------------------------------------------------
app.get("/", (req, res) => {
    res.json({ ok: true, message: "sports-stats-api çalışıyor" });
});

// -------------------------------------------------------
// 5) Render Port
// -------------------------------------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`sports-stats-api ${PORT} portunda çalışıyor`);
});
