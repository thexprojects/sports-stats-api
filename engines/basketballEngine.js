// engines/basketballEngine.js
// Şimdilik tamamen dummy: gerçek API yok, ama format doğru.

function getTargetDate(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

async function getBasketballStatsForDay(offset = 0) {
  const date = getTargetDate(offset);

  const stats = {
    "🏀 Toplam Sayı": [
      {
        flag: "🇺🇸",
        teams: "Boston Celtics vs Miami Heat",
        detail:
          "Celtics'in son 9 maçının 7'sinde 220'den fazla sayı çıktı.",
        highlight: "220.5 Üst",
      },
      {
        flag: "🇺🇸",
        teams: "Los Angeles Lakers vs Phoenix Suns",
        detail:
          "Lakers'ın iç saha maçlarında tempo genellikle yüksek.",
        highlight: "229.5 Üst",
      },
    ],
    "🏀 Handikap": [
      {
        flag: "🇪🇺",
        teams: "Real Madrid vs Barcelona",
        detail:
          "Euroleague'deki son El Clasico'larda Real Madrid iç sahada üstün.",
        highlight: "Real Madrid -4.5",
      },
    ],
  };

  return {
    date,
    sport: "basketbol",
    stats,
  };
}

module.exports = {
  getBasketballStatsForDay,
};
