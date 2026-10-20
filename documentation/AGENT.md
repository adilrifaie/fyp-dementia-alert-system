# AGENT.md — DementIQ Coding Agent Guide

> Bu dosya, kodlama ajanlarına (Claude Code, Cursor, Copilot vb.) proje hakkında yapılandırılmış bağlam sağlar.
> Görev listesi için → [`TODO.md`](./TODO.md)

---

## Projenin Tek Cümlelik Özeti

Ev ortamındaki PIR sensör verilerini günlük özniteliklere dönüştüren, Random Forest ile ajitasyon riski skoru üreten ve bu skoru bakıcıya mobil uygulama üzerinden sunan tam yığın (full-stack) bir yapay zeka sistemi.

---

## Mimari Genel Bakış

```
Datasets/ (CSV)
    └─► feature_engineering.py → daily_features.csv
                                        └─► model.py → agitation_model.pkl + model_config.json
                                                              └─► predict.py → predictions.json
                                                                                      └─► server/index.js (Express API :3001)
                                                                                                ├─► client/ (React + Vite :5173)
                                                                                                └─► DementIQ/ (React Native + Expo)
```

---

## Bileşenler ve Sorumluluklar

### ML Pipeline (Python)

| Dosya | Girdi | Çıktı | Açıklama |
|-------|-------|-------|----------|
| `feature_engineering.py` | `Datasets/*.csv` | `daily_features.csv` | 5 CSV → hasta×gün öznitelik matrisi (2.722 satır, 13 öznitelik) |
| `model.py` | `daily_features.csv` | `agitation_model.pkl`, `model_config.json` | SMOTE + LOPO + Random Forest eğitimi, eşik 0.13 |
| `predict.py` | `agitation_model.pkl`, `model_config.json`, `daily_features.csv` | `predictions.json` | 56 hasta için günlük risk skoru ve alert flag'i |

### Backend (Node.js / Express)

| Dosya | Port | Açıklama |
|-------|------|----------|
| `server/index.js` | 3001 | `predictions.json` okur, 3 endpoint sunar |

**Endpoint'ler:**
```
GET /api/summary          → { total_patients, total_days, alert_days, ... }
GET /api/patients         → [ { patient_id, alert_rate, alert_days, ... } ] — risk bazlı sıralı
GET /api/patient/:id      → { patient_id, days: [ { date, risk_score, alert, features } ] }
```

### Web Frontend (React + Vite)

| Dosya | Açıklama |
|-------|----------|
| `client/src/pages/Dashboard.jsx` | Hasta listesi, risk filtresi |
| `client/src/pages/PatientView.jsx` | Bireysel hasta zaman serisi |

### Mobil Uygulama (React Native + Expo)

| Dosya | Açıklama |
|-------|----------|
| `mobile/src/screens/DashboardScreen.js` | Filtreli hasta listesi (HIGH/WATCH/SAFE tappable) |
| `mobile/src/screens/PatientDetailScreen.js` | Risk grafiği + Care Tip + günlük geçmiş |
| `mobile/src/screens/DayDetailScreen.js` | Sensör sinyalleri ve sapma etiketleri |
| `mobile/src/screens/AlertScreen.js` | Uyarı detayları ve aksiyon butonları |
| `mobile/src/components/RiskChart.js` | Dokunmaya duyarlı SVG risk grafiği |
| `mobile/src/theme/colors.js` | Risk renk paleti ve yardımcı fonksiyonlar |
| `mobile/app.json` | `apiBaseUrl` ve `groqApiKey` config (⚠️ geliştirme ortamı) |

---

## Kritik Tasarım Kararları

Değiştirmeden önce mutlaka anlayın:

**1. LOPO çapraz doğrulama — rastgele bölme kullanmayın**
Aynı hastanın günleri rastgele bölünürse veri sızıntısı (data leakage) oluşur. `model.py` her zaman LOPO kullanmalıdır.

**2. Eşik 0.13 — 0.50'ye döndürmeyin**
Varsayılan eşikle recall %9'a düşer. Eşik `model_config.json` içinde tanımlıdır ve `predict.py` oradan okur.

**3. Z-skor sapma öznitelikleri — ham sayıları doğrudan karşılaştırmayın**
`dev_` önekli öznitelikler, hastanın kendi geçmiş ortalamasına göre z-skor sapmasıdır. Bu olmadan model genelleşemez.

**4. Badge hesabı — max risk skoru değil, oran**
`DashboardScreen.js` badge seviyesi `alert_days / total_days` oranından türetilir. Geçmişteki en yüksek skor kullanılmaz.

**5. Groq API çağrısı — PatientDetailScreen içinde**
Care Tip, `PatientDetailScreen.js` içinde Groq API'ye doğrudan istek atar. API anahtarı şu an `app.json` içindedir (güvenlik borcu — TODO'da işaretli).

---

## Veri Akışı: `predictions.json` Şeması

```json
[
  {
    "patient_id": "P001",
    "days": [
      {
        "date": "2019-03-01",
        "risk_score": 0.21,
        "alert": true,
        "features": {
          "total_movements": 145,
          "dev_total_movements": 1.8,
          "dev_Hallway": 2.3,
          ...
        }
      }
    ]
  }
]
```

---

## Ortam Gereksinimleri

### Python
```
python==3.10
scikit-learn
pandas
numpy
imbalanced-learn
joblib
```

### Node.js
```
node>=18
express
cors
```

### Expo / React Native
```
expo SDK (bkz. DementIQ/package.json)
react-native-svg
```

---

## Bilinen Kısıtlamalar

- **Veri seti:** 56 hasta, tek merkez (İngiltere), %4,2 pozitif oran — küçük örneklem
- **Backend:** Deploy edilmemiş, yerel çalışır (`localhost:3001`)
- **Groq API anahtarı:** `app.json` içinde açık metin — production'da secret management gerekir
- **APK:** Build alınmamış — backend deploy edilmeden APK anlamlı değil

---

## Görev Listesi

→ Tüm açık görevler için [`TODO.md`](./TODO.md) dosyasına bakın.

---

*Bu proje YZM310 Bitirme Projesi 1 kapsamında geliştirilmiştir — Samsun Üniversitesi, 2026.*