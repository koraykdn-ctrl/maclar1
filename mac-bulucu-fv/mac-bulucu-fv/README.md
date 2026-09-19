# Maç Bulucu — İstatistik Filtresi

futbolverileri.com'un arka uç API'sini (`santra24.6stats.com`) kullanarak
canlı/biten maçları şu istatistik kombinasyonlarına göre süzer:

- İY 0.5 Üst
- İY 1.5 Üst
- İY KG Var
- 2Y 0.5 Üst
- MS 2.5 Üst / Alt
- MS 3.5 Üst / Alt

Birden fazla filtre seçilirse **VE (AND)** mantığıyla çalışır.

## Nasıl çalışıyor

- `/api/matches.js` — Vercel serverless fonksiyonu. Her istekte
  `santra24.6stats.com/api/v1/football/matches/lite` adresinden ham veriyi
  çeker, her maç için filtre bayraklarını (true/false) hesaplar ve tarayıcıya
  döner. (CORS sorunlarını önlemek ve hesaplama mantığını tek yerde tutmak için
  proxy olarak kullanılıyor.)
- `index.html` — arayüz. 30 saniyede bir otomatik yenilenir (kapatılabilir).

## Takım / lig isimleri

Kaynak API takım ve lig **isim** vermiyor, sadece ID veriyor (`homeId`,
`awayId`, `leagueId`). Bu yüzden başlangıçta "Takım #287" gibi görünür.

Bir takım veya lig adına **tıklayınca** ona kalıcı bir isim atayabilirsin —
bu eşleme tarayıcının `localStorage`'ında saklanır, bir daha o ID her
göründüğünde otomatik gösterilir. Zamanla sık karşılaştığın takımları
isimlendirdikçe liste daha okunaklı hale gelir.

(İleride gerçek bir takım/lig isim endpoint'i bulunursa, `api/matches.js`
içine kolayca eklenip otomatik doldurma yapılabilir — DevTools → Network'te
bir maç detayına tıklarken çıkan `team`/`league` geçen bir istek ararsan
bana ilet, entegre ederim.)

## Deploy (Vercel)

1. Bu klasörü bir GitHub reposuna push et (mac-bulucu projesinle aynı akış).
2. vercel.com → New Project → repoyu seç → Deploy.
   Build ayarı gerekmiyor (framework: Other), otomatik algılanır.
3. `index.html` kök dizinde, `api/matches.js` fonksiyon olarak otomatik
   devreye girer.

Yerelde denemek için: `npx vercel dev`
