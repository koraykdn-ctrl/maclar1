// H2H (karşılıklı maç geçmişi) istatistiklerini santra24.6stats.com'dan
// çekip sadeleştirilmiş haliyle döner. Sadece henüz başlanmamış (Fixture)
// maçlar için anlamlı — geçmiş karşılaşmalara bakarak bir "eğilim" verir,
// kesin bir sonuç garantisi değildir.
export default async function handler(req, res) {
  try {
    const idsParam = (req.query.ids || "").toString();
    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 40); // tek istekte en fazla 40 maç (üst API'ye aşırı yüklenmemek için)

    if (ids.length === 0) {
      return res.status(200).json({ success: true, data: {} });
    }

    const result = {};
    const CONCURRENCY = 8;
    let cursor = 0;

    async function worker() {
      while (cursor < ids.length) {
        const id = ids[cursor++];
        try {
          const r = await fetch(
            `https://santra24.6stats.com/api/v1/football/match/${encodeURIComponent(id)}/h2h/all/stats`,
            { headers: { accept: "application/json" } }
          );
          if (!r.ok) continue;
          const j = await r.json();
          if (j && j.success && j.data && j.data.all) {
            const all = j.data.all;
            result[id] = {
              played: typeof all.played === "number" ? all.played : 0,
              homeWinsPercent: all.homeWinsPercent ?? null,
              awayWinsPercent: all.awayWinsPercent ?? null,
              drawsPercent: all.drawsPercent ?? null,
              // h2hname/h2hval çiftlerini sadeleştirip diziye çeviriyoruz
              stats: Array.isArray(all.stats)
                ? all.stats.map((s) => ({
                    name: s.h2hname,
                    val: s.h2hval,
                    count: s.h2hcount || null,
                  }))
                : [],
            };
          }
        } catch {
          // tek maç başarısız olursa listeyi durdurma, devam et
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, ids.length) }, worker)
    );

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: String(err) });
  }
}
