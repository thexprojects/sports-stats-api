// engines/tennisEngine.js

function getTargetDate(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

// Şimdilik gerçek API kullanmıyoruz, statik ama mantıklı örnekler dönüyoruz.
async function getTennisStatsForDay(offset = 0) {
  const date = getTargetDate(offset);

  const stats = {
    "🎾 Maç Sonucu": [
      {
        flag: "🇪🇸",
        teams: "Carlos Alcaraz vs Rafael Nadal",
        detail:
          "Bu iki İspanyol yıldızın maçları genelde yüksek tempoda geçiyor.",
        highlight: "Alcaraz Kazanır",
      },
      {
        flag: "🇷🇸",
        teams: "Novak Djokovic vs Casper Ruud",
        detail: "Djokovic son dönemde servis oyunlarında çok sağlam.",
        highlight: "Djokovic Kazanır",
      },
    ],
    "👁️ Toplam Oyun": [
      {
        flag: "🇺🇸",
        teams: "Taylor Fritz vs Frances Tiafoe",
        detail:
          "İki güçlü servisçi, tie-break'e giden setler sık görülüyor.",
        highlight: "22.5 Üst",
      },
    ],
    "⚠️ Set Kaybeder mi?": [
      {
        flag: "🇩🇪",
        teams: "Alexander Zverev vs Daniil Medvedev",
        detail:
          "İki oyuncu da uzun rallilerle maçı üç sete taşımaya müsait.",
        highlight: "Her İki Oyuncu da Set Alır",
      },
    ],
    "🔺 Aces / Çift Hata": [
      {
        flag: "🇦🇺",
        teams: "Nick Kyrgios vs Stefanos Tsitsipas",
        detail:
          "Kyrgios'un servis performansı maçı tamamen değiştirebiliyor.",
        highlight: "Kyrgios 10+ Ace",
      },
    ],
  };

  return {
    date,
    sport: "tenis",
    stats,
  };
}

module.exports = {
  getTennisStatsForDay,
};
