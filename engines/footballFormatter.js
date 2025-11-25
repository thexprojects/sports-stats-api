function buildFootballCategories(fixtures) {
  // Şimdilik sadece 5–8 adet dummy örnek döndürüyoruz
  // Daha sonra buraya gerçek istatistik cümleleri gelecek

  const sample = fixtures.slice(0, 8).map(f => {
    return {
      flag: f.teams?.home?.logo ? "" : "⚽️",
      teams: `${f.teams.home.name} vs ${f.teams.away.name}`,
      detail: "İstatistik hazırlanıyor…",   // geçici
      highlight: "Hazırlanıyor"             // geçici
    };
  });

  return {
    "🆚 Maç Sonucu": sample.slice(0, 5),
    "⚽️ Toplam Gol": sample.slice(0, 5),
    "🥅 Karşılıklı Gol": sample.slice(0, 5),
    "🚩 Korner": sample.slice(0, 5),
    "🟨 Toplam Kart": sample.slice(0, 5),
  };
}

module.exports = { buildFootballCategories };
