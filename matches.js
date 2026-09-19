export default async function handler(req, res) {
  try {
    const upstream = await fetch(
      "https://santra24.6stats.com/api/v1/football/matches/lite",
      { headers: { accept: "application/json" } }
    );

    if (!upstream.ok) {
      return res.status(502).json({ success: false, error: "Kaynak siteye ulaşılamadı" });
    }

    const json = await upstream.json();
    if (!json || json.success !== true || !Array.isArray(json.data)) {
      return res.status(502).json({ success: false, error: "Beklenmeyen veri formatı" });
    }

    const matches = json.data.map((m) => {
      // Kaynak API, henüz başlamamış/oynanmayan maçlarda skor alanlarını
      // bazen null yerine 0 (veya başka bir sayı) döndürüyor. Bu yüzden
      // "gerçekten skoru var mı" kararını status alanına göre veriyoruz:
      // sadece Playing/Played durumundaki maçların skor/İY verisi geçerli
      // sayılır, diğer tüm durumlarda (Fixture, Postponed, Cancelled,
      // Suspended, bilinmeyen) skor alanları zorla null'a çekilir.
      const hasStarted = m.status === "Playing" || m.status === "Played";

      const hp1 = hasStarted && typeof m.hp1 === "number" ? m.hp1 : null;
      const ap1 = hasStarted && typeof m.ap1 === "number" ? m.ap1 : null;
      const hscore = hasStarted && typeof m.hscore === "number" ? m.hscore : null;
      const ascore = hasStarted && typeof m.ascore === "number" ? m.ascore : null;

      const hasHT = hp1 !== null && ap1 !== null;
      const hasFT = hscore !== null && ascore !== null;

      const iyTotal = hasHT ? hp1 + ap1 : null;
      const iy2Total = hasHT && hasFT ? hscore - hp1 + (ascore - ap1) : null;
      const msTotal = hasFT ? hscore + ascore : null;

      return {
        id: m.id,
        homeId: m.homeId,
        awayId: m.awayId,
        leagueId: m.leagueId,
        status: m.status || null, // Fixture | Playing | Played | Postponed | Cancelled | Suspended
        st: m.st || "",
        min: typeof m.min === "number" ? m.min : null,
        hscore,
        ascore,
        hp1,
        ap1,
        flags: {
          iy05ust: iyTotal === null ? null : iyTotal >= 1,
          iy15ust: iyTotal === null ? null : iyTotal >= 2,
          iy2y05ust: iy2Total === null ? null : iy2Total >= 1,
          ms25ust: msTotal === null ? null : msTotal >= 3,
          ms25alt: msTotal === null ? null : msTotal <= 2,
          ms35ust: msTotal === null ? null : msTotal >= 4,
          ms35alt: msTotal === null ? null : msTotal <= 3,
          iykgvar: hasHT ? hp1 > 0 && ap1 > 0 : null,
        },
      };
    });

    res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate=30");
    return res.status(200).json({ success: true, count: matches.length, matches });
  } catch (err) {
    return res.status(500).json({ success: false, error: String(err) });
  }
}
