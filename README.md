# Hava Durumu Discord Bot

Discord.js v14 ile yazılmış profesyonel hava durumu botu. OpenWeatherMap API'si ile gerçek hava durumu verilerini sunar.

## Özellikler

- `/hava-durumu sehir <şehir_adı>` - Belirtilen şehrin hava durumunu gösterir
- `/hava-durumu guncel` - Varsayılan konum (İstanbul) için hava durumunu gösterir
- OpenWeatherMap API ile gerçek hava durumu verileri
- Detaylı hava durumu bilgileri (sıcaklık, nem, rüzgar, yağış ihtimali)
- 3 günlük hava durumu tahmini
- Kapsamlı Türkçe çeviri sistemi
- Güzel embed tasarımı ile hava durumu bilgileri
- Hava durumu durumuna göre emoji desteği
- Gelişmiş hata yönetimi ve kullanıcı dostu mesajlar
- Interaction timeout koruması
- Dünya çapında şehir desteği

## Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/jokerizm3169/hava-durumu-altyapi.git
cd hava-durumu-altyapi
```

2. Gerekli paketleri yükleyin:
```bash
npm install
```

3. `config.example.json` dosyasını `config.json` olarak kopyalayın ve düzenleyin:
```bash
copy config.example.json config.json
```

```json
{
  "token": "BOT_TOKEN_BURAYA",
  "clientId": "CLIENT_ID_BURAYA", 
  "guildId": "GUILD_ID_BURAYA_VEYA_BOŞ_BIRAK"
}
```

4. Discord Developer Portal'dan bot oluşturun:
   - https://discord.com/developers/applications adresine gidin
   - "New Application" butonuna tıklayın
   - Bot sekmesinden token'ı kopyalayın
   - OAuth2 > General sekmesinden Client ID'yi kopyalayın
   - Bot'u sunucunuza davet edin (applications.commands yetkisi gerekli)

5. Botu başlatın:
```bash
npm start
```

## Kullanım

Bot başladıktan sonra Discord sunucunuzda şu komutları kullanabilirsiniz:

- `/hava-durumu sehir ankara` - Ankara'nın hava durumunu gösterir
- `/hava-durumu sehir istanbul` - İstanbul'un hava durumunu gösterir  
- `/hava-durumu guncel` - Varsayılan konum için hava durumunu gösterir

## Dosya Yapısı

```
hava-durumu-bot/
├── commands/
│   └── hava-durumu.js    # Hava durumu komutu
├── config.json          # Bot konfigürasyonu
├── index.js             # Ana bot dosyası
├── package.json         # Proje bağımlılıkları
└── README.md           # Bu dosya
```

## Veri Kaynağı

Bu bot OpenWeatherMap API'si ile gerçek hava durumu verilerini çeker. API'den şu bilgileri alır:

- Anlık sıcaklık (Celsius)
- Hava durumu açıklaması (Türkçe çeviri ile)
- Nem oranı (%)
- Rüzgar hızı (km/sa)
- Yağış ihtimali (%)
- 3 günlük hava durumu tahmini
- Dünya çapında şehir desteği

Örnek API yanıtı:
```json
{
  "location": "Istanbul, TR",
  "temperature": 23,
  "condition": "Parçalı Bulutlu",
  "humidity": "%65",
  "wind": "15 km/sa",
  "precipitation": "%10",
  "dailyForecast": [
    {
      "day": "Pazartesi",
      "high": 25,
      "low": 18,
      "desc": "Güneşli"
    }
  ]
}
```

## API Bilgileri

- **API Sağlayıcı**: OpenWeatherMap
- **API Limiti**: Ücretsiz plan ile 1000 istek/gün
- **Güncelleme Sıklığı**: Her 10 dakikada bir
- **Kapsam**: Dünya çapında 200,000+ şehir

## Gereksinimler

- Node.js 16.9.0 veya üzeri
- Discord.js v14
- Axios (HTTP istekleri için)
- OpenWeatherMap API Key (ücretsiz)

## Lisans

MIT
