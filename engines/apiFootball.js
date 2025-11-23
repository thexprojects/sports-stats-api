// engines/apiFootball.js
const axios = require("axios");

const API_KEY = process.env.API_FOOTBALL_KEY;

// Uygulama ayağa kalkarken key yoksa direkt uyarı verelim
if (!API_KEY) {
  console.warn("⚠ API_FOOTBALL_KEY tanımlı değil, futbol istekleri çalışmaz!");
}

function getIsoDate(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

async function getFootballStatsForDay(dayOffset = 0) {
  const isoDate = getIsoDate(dayOffset);
  console.log("⚽️ Futbol isteği hazırlanıyor:", { isoDate, dayOffset });

  if (!API_KEY) {
    // .env yanlışsa burada net hata verelim
    throw new Error("FUTBOL API HATASI: API_FOOTBALL_KEY tanımlı değil");
  }

  const url = `https://v3.football.api-sports.io/fixtures?date=${isoDate}`;

  try {
    const response = await axios.get(url, {
      headers: {
        // Doğru header sadece bu: (RapidAPI kullanmıyoruz)
        "x-apisports-key": API_KEY,
      },
    });

    const body = response.data || {};
    const fixtures = body.response || [];
    console.log("✅ Futbol API cevabı:", {
      count: fixtures.length,
      status: response.status,
    });

    // Şimdilik ham maç listesini döndürelim
    return {
      date: isoDate,
      sport: "futbol",
      fixtures,
    };
  } catch (err) {
    console.error("❌ FUTBOL API HATASI:", err?.response?.data || err.message);
    throw new Error("Futbol API hatası");
  }
}

module.exports = { getFootballStatsForDay };
