export default async function handler(req, res) {
  try {
    const idsParam = (req.query.ids || "").toString();
    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 60); // tek istekte en fazla 60 maç detayı

    if (ids.length === 0) {
      return res.status(200).json({ success: true, data: {} });
    }

    const result = {};
    const CONCURRENCY = 10;
    let cursor = 0;

    async function worker() {
      while (cursor < ids.length) {
        const id = ids[cursor++];
        try {
          const r = await fetch(
            `https://santra24.6stats.com/api/v1/football/match/${encodeURIComponent(id)}`,
            { headers: { accept: "application/json" } }
          );
          if (!r.ok) continue;
          const j = await r.json();
          if (j && j.success && j.data) {
            const d = j.data;
            result[id] = {
              homeId: d.homeId,
              home: d.home,
              awayId: d.awayId,
              away: d.away,
              leagueId: d.leagueId,
              league: d.league,
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
