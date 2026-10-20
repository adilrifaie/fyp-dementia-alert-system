# TODO — DementIQ

> Proje durumu: **Teslim aşaması**. Aşağıdaki liste öncelik sırasına göre düzenlenmiştir.

---

## 🟡 Teknik Borç

### Backend
- [ ] Backend'i deploy et (Railway, Render veya benzeri ücretsiz platform)
- [ ] `predictions.json` dosyasının deploy ortamında erişilebilir olduğunu doğrula
- [ ] API endpoint'lerine temel hata yönetimi (error handling) ekle
- [ ] `/api/summary` endpoint'inin döndürdüğü veriyi dokümante et

### Mobil (DementIQ)
- [ ] `groqApiKey` değerini `app.json` içinden çıkar — environment variable veya güvenli depolama kullan
- [ ] `apiBaseUrl`'i sabit IP yerine deploy edilmiş backend URL'siyle değiştir
- [ ] APK build'i al (backend deploy edildikten sonra `eas build` ile)
- [ ] iOS/Android'de edge case'leri test et: ağ hatası, boş hasta verisi, Groq API timeout

### ML Pipeline
- [ ] `model.py` çıktısına confusion matrix ve classification report ekle
- [ ] SMOTE parametrelerini (`k_neighbors`, `sampling_strategy`) dokümante et
- [ ] `feature_engineering.py`'ye eksik gün satırlarının nasıl ele alındığını açıklayan yorum ekle
- [ ] `predict.py` çıktısının şemasını (`predictions.json` yapısı) dokümante et

### Web Arayüzü
- [ ] Web frontend'i deploy et (Vercel veya Netlify)
- [ ] `PatientView.jsx` sayfasına yükleme (loading) durumu ekle
- [ ] Boş/hatalı API yanıtı için fallback UI ekle

---

## 🟢 Kalite ve Dokümantasyon

- [ ] `AGENT.md` dosyasını repoya ekle
- [ ] `TODO.md` dosyasını repoya ekle
- [ ] `model_config.json` içeriğini README'de açıkla
- [ ] Kurulum adımlarını temiz bir ortamda (fresh environment) test et — README'deki adımların çalıştığını doğrula
- [ ] `.gitignore` kontrolü: `node_modules/`, `*.pkl`, `*.csv`, `.env` tanımlı mı?
- [ ] `package.json` içindeki `name` ve `version` alanlarını kontrol et (her iki `package.json` için)

---

## 🔵 Akademik Çıktılar

- [ ] Model performans sonuçlarını journal paper formatında hazırla (tablo + yorum)
- [ ] LOPO metodolojisini literatürdeki benzer çalışmalarla karşılaştır
- [ ] Bitirme raporu / tez yazımını tamamla
- [ ] Proje sunumu için slayt hazırla

---

## 🟣 YZM401 — Gelecek Dönem Planı (Bitirme Projesi 2)

DementIQ şu an **HOOTL** (ML otomatik skorlama) ve **HOTL** (bakıcı rozet takibi) seviyelerinde çalışmaktadır. YZM401 kapsamında **HITL** katmanı eklenecektir.

### Human-in-the-Loop Entegrasyonu

- [ ] **HITL Acknowledge** — HIGH alert'lerde "Kontrol Ettim ✓" / "Eskalasyon 🚨" butonu; aksiyon alınmadan alert kapanmaz, timestamp loglanır
- [ ] **Neden Ateşlendi? (Why Did This Fire)** — HIGH skoru oluşturan öznitelikleri plain language olarak göster (örn. "Koridor hareketi normalden %40 düşük + ilk hareket saati 3 saat gecikti"); `model_config.json` öznitelik önem sıralamasından türetilecek
- [ ] **Erteleme Gerekçesi (Snooze with Reason)** — Bakıcı "Bugün doktor randevusu var" diyerek alert'i gerekçeyle erteleyebilir; sistem bağlamı loglar, o gün için suppress eder (Humwork pattern)
- [ ] `POST /api/alerts/acknowledge` endpoint'i ekle — `{ patientId, date, action, reason? }`
- [ ] `acknowledgments.json` ile acknowledgment store oluştur — veritabanı gerektirmez
- [ ] Unacknowledged HIGH alert için pulsing/urgent UI state; acknowledged için dimmed + checkmark state

---

## ⚪ Uzun Vadeli İterasyonlar (Kapsam Dışı — Şimdilik)

- [ ] TIHM dışında ikinci bir veri setiyle harici validasyon
- [ ] Gerçek zamanlı sensör entegrasyonu (MQTT veya WebSocket)
- [ ] Çok dilli bakım ipuçları (İngilizce, Türkçe, Arapça)
- [ ] Klinisyen paneli — bakıcı uyarılarını takip eden ayrı arayüz
- [ ] Giyilebilir sensör verisiyle öznitelik genişletmesi
- [ ] Otonom deney döngüsü (autoresearch) entegrasyonu