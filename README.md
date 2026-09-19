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

Liste ilk yüklendiğinde ekranda görünen (filtreye uyan) maçlar için arka
planda `/api/details` çağrılır — bu, `santra24.6stats.com/.../match/{id}`
endpoint'inden gerçek takım ve lig adını çeker ve tarayıcının
`localStorage`'ına kaydeder. Bir sonraki sefer aynı ID göründüğünde tekrar
istek atmaz.

Otomatik gelmeyen ya da farklı görmek istediğin bir isim varsa, takım/lig
adına **tıklayıp** manuel değiştirebilirsin — bu değişiklik otomatik
doldurmanın önüne geçer ve kalıcı kalır.

`/api/details` bir seferde en fazla 60 maçı zenginleştirir (üst API'ye aşırı
yüklenmemek için), bu yüzden çok geniş bir filtre sonucunda ilk birkaç
saniye bazı satırlar "Takım #…" olarak görünüp sonra gerçek isme
dönüşebilir.

## Deploy (Vercel)

1. Bu klasörü bir GitHub reposuna push et (mac-bulucu projesinle aynı akış).
2. vercel.com → New Project → repoyu seç → Deploy.
   Build ayarı gerekmiyor (framework: Other), otomatik algılanır.
3. `index.html` kök dizinde, `api/matches.js` fonksiyon olarak otomatik
   devreye girer.

Yerelde denemek için: `npx vercel dev`
