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
            const pack = (bucket) => bucket ? {
              played: typeof bucket.played === "number" ? bucket.played : 0,
              homeWinsPercent: bucket.homeWinsPercent ?? null,
              awayWinsPercent: bucket.awayWinsPercent ?? null,
              drawsPercent: bucket.drawsPercent ?? null,
              stats: Array.isArray(bucket.stats)
                ? bucket.stats.map((s) => ({
                    name: s.h2hname,
                    val: s.h2hval,
                    count: s.h2hcount || null,
                  }))
                : [],
            } : null;

            result[id] = {
              all: pack(j.data.all),
              home: pack(j.data.home), // H2H maçlarında ev sahibi takımın kendi evinde oynadığı maçlar
              away: pack(j.data.away), // H2H maçlarında deplasman takımının kendi deplasmanında oynadığı maçlar
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
