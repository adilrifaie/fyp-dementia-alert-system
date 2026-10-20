# 🧠 DementIQ — Ev Ortamında Demans Bakımı İçin Davranışsal Tespit ve Uyarı Sistemi

> Demans hastalarının günlük sensör verilerini analiz ederek bakıcıya sabah ajitasyon riski sunan yapay zeka destekli sistem.

---

## 🎬 Demo

[![DementIQ Demo](https://img.youtube.com/vi/xGd2jyL4Srg/0.jpg)](https://youtube.com/shorts/xGd2jyL4Srg?si=37_ySdQcovNtK6oP)

▶️ [YouTube'da izle](https://youtube.com/shorts/xGd2jyL4Srg?si=37_ySdQcovNtK6oP)

---

## 📱 Ekran Görüntüleri

| Dashboard | Hasta Detay | Gün Detay | Uyarı Sayfası |
|-----------|-------------|-----------| ------------- |
| ![Dashboard](screenshots/dashboard.jpg) | ![PatientDetail](screenshots/patient_detail.jpg) | ![DayDetail](screenshots/day_detail.jpg) | ![Alert](screenshots/warning.jpg)

---

## 📋 İçindekiler

1. [Proje Hakkında](#1-proje-hakkında)
2. [Neden Bu Proje?](#2-neden-bu-proje)
3. [Veri Seti](#3-veri-seti)
4. [Sistem Mimarisi](#4-sistem-mimarisi)
5. [Makine Öğrenmesi Yaklaşımı](#5-makine-öğrenmesi-yaklaşımı)
6. [Model Performansı](#6-model-performansı)
7. [Teknoloji Yığını](#7-teknoloji-yığını)
8. [Kurulum ve Çalıştırma](#8-kurulum-ve-çalıştırma)
9. [Proje Dizin Yapısı](#9-proje-dizin-yapısı)
10. [Önemli Tasarım Kararları](#10-önemli-tasarım-kararları)

---

## 1. Proje Hakkında

DementIQ, demans hastası bireylerin ev içi hareket sensörü verilerini makine öğrenmesiyle analiz ederek **günlük ajitasyon riski** sunan bir erken uyarı sistemidir.

**Sistem üç katmanda çalışır:**
- Ham sensör verisinden klinik açıdan anlamlı davranışsal özniteliklerin çıkarılması
- Hastaya özgü temel çizgi normalizasyonu ile kişiselleştirilmiş risk değerlendirmesi
- Bakıcıya o günkü riski ve bakım ipucunu tek ekranda sunan mobil uygulama

Bakıcı sabah uyandığında uygulamayı açar, hastasının risk seviyesini (YÜKSEK / İZLE / GÜVENLİ) ve o güne özel yapay zeka destekli bakım ipucunu görür. Tedavi değil — **erken farkındalık** hedeflenir.

---

## 2. Neden Bu Proje?

Demans hastaları ajitasyon krizleri yaşadığında bakıcılar çoğunlukla hazırlıksız yakalanır. Mevcut sistemler ya gerçek zamanlı izleme gerektirir (yüksek donanım maliyeti) ya da klinisyen müdahalesine bağımlıdır (günlük bakımda ölçeklenemez).

Bu proje, açık erişimli gerçek hasta verisi (TIHM, Imperial College London) ve makine öğrenmesi araçlarıyla bu boşluğu kapatan bakıcı odaklı bir yazılım çözümü sunmaktadır.

**Başarı kriteri:** Ajitasyon vakalarının en az %70'inin önceden tespit edilmesi.
**Mevcut performans:** %79 recall — kriter karşılandı.

---

## 3. Veri Seti

**Kaynak:** TIHM (Technology Integrated Health Management) Veri Seti  
**Yayın:** Palermo ve ark., *Nature Scientific Data*, 2023  
**Erişim:** [Zenodo — zenodo.org/records/7622128](https://zenodo.org/records/7622128)  
**Kurum:** Imperial College London, UK Dementia Research Institute

| Tablo | İçerik | Satır Sayısı |
|-------|--------|-------------|
| `Activity.csv` | Oda bazlı PIR sensör tetiklenmeleri | 1.030.559 |
| `Sleep.csv` | Uyku evresi ve kalp hızı verileri | 461.423 |
| `Physiology.csv` | Manuel ölçüm fizyoloji verileri | — |
| `Labels.csv` | Klinik olaylar ve davranışsal etiketler | 608 |
| `Demographics.csv` | Hasta demografik bilgileri | 56 |

**Ön analiz bulguları:**
- `Labels.type` incelendiğinde yalnızca **Ajitasyon** (135 olay) gerçek davranışsal etiket olarak tanımlanmıştır.
- Uyku verisi yalnızca 17 hastayı kapsamakta, ajitasyon etiketi olan hastalarla kesişim yalnızca 6 hastaya düşmektedir — kapsam dışı bırakıldı.
- Aktivite verisiyle eşleştirme sonrası 134/135 ajitasyon olayı kullanılabilir durumdadır.

---

## 4. Sistem Mimarisi

```
Ham Veri (Activity.csv)
         │
         ▼
feature_engineering.py
  - Olay düzeyinden gün düzeyine dönüşüm
  - Oda bazlı hareket sayımları
  - Gece hareketleri, ilk hareket saati, en uzun pasif süre
  - Hasta bazlı z-skor sapma öznitelikleri
         │
         ▼
daily_features.csv (2.722 satır — hasta × gün)
         │
         ▼
model.py
  - Random Forest sınıflandırıcı
  - SMOTE ile sınıf dengesizliği giderimi
  - LOPO çapraz doğrulama
  - Eşik optimizasyonu (0,50 → 0,13)
         │
         ▼
agitation_model.pkl + model_config.json
         │
         ▼
predict.py → predictions.json (56 hasta, 2.722 gün)
         │
         ▼
Express API (Node.js)
  /api/summary       — Kohort özeti
  /api/patients      — Hasta listesi (risk bazlı sıralama)
  /api/patient/:id   — Günlük risk zaman serisi + öznitelik tablosu
         │
         ├──────────────────────────────────────┐
         ▼                                      ▼
React Arayüzü (Vite)               DementIQ Mobil (React Native + Expo)
  Dashboard — hasta listesi          Dashboard — filtreli hasta listesi
  Risk filtreleme                    PatientDetail — risk grafiği + bakım ipucu
  Günlük risk zaman serisi           DayDetail — sensör sinyalleri
                                     AlertScreen — uyarı detayları + aksiyon
```

---

## 5. Makine Öğrenmesi Yaklaşımı

### 5.1 Öznitelik Mühendisliği

Ham aktivite verisi, her hasta için günlük özet satırlarına dönüştürülmüştür:

- **Hacim öznitelikleri** — günlük toplam hareket miktarı ve zaman dilimine göre dağılımı
- **Oda bazlı öznitelikler** — Mutfak, Koridor, Oturma Odası, Yatak Odası, Banyo, Ön Kapı, Arka Kapı
- **Sapma öznitelikleri (z-skor)** — her hastanın kendi kişisel ortalamasına göre bugünkü sapması

Sapma öznitelikleri projenin en kritik tasarım kararıdır. Hastalar arası bireysel farklılıkları ortadan kaldırarak modelin genelleşmesine olanak tanır.

### 5.2 Model Seçimi — Random Forest

- Doğrusal olmayan ilişkileri modelleyebilme
- Öznitelik önem derecesi çıktısı (klinik yorum için kritik)
- Gürültülü özniteliklere karşı dayanıklılık

### 5.3 Değerlendirme — LOPO (Leave-One-Patient-Out)

Rastgele bölme bu veri setinde veri sızıntısına (data leakage) yol açar — aynı hastanın farklı günleri hem eğitim hem teste karışır. LOPO, modeli hiç görmediği bir hasta üzerinde test ederek klinik uygulamayı simüle eder.

### 5.4 Sınıf Dengesizliği

Pozitif oran yaklaşık %4,2 (114 ajitasyon günü / 2.722 toplam gün). İki yöntem birlikte uygulandı:
- **SMOTE** — eğitim verisinde sentetik ajitasyon örnekleri üretir
- **class_weight='balanced'** — model kaybında azınlık sınıfını ağırlıklandırır

### 5.5 Eşik Optimizasyonu

Varsayılan 0,50 eşiğiyle recall yalnızca %9'dur. Precision-Recall analizi sonrası eşik **0,13** olarak belirlendi — recall **%79**'a yükseldi. Kaçırılan ajitasyonun maliyeti yanlış alarmdan çok daha yüksektir; bu nedenle yüksek recall önceliklendirildi.

---

## 6. Model Performansı

| Metrik | Değer | Açıklama |
|--------|-------|----------|
| ROC-AUC | 0,655 | Eşikten bağımsız ayırt edici güç (0,5 = rastgele) |
| Ajitasyon Recall | %79 | Gerçek ajitasyon günlerinin tespit oranı |
| Ajitasyon Precision | %11 | Uyarıların gerçek ajitasyona isabet oranı |
| Optimal Eşik | 0,13 | F1 maksimizasyonuyla belirlenen karar sınırı |

**En öngörülü öznitelikler:**

| Sıra | Öznitelik | Önem |
|------|-----------|------|
| 1 | `dev_Hallway` — Koridor sapması | 0,133 |
| 2 | `dev_total_movements` — Toplam hareket sapması | 0,105 |
| 3 | `dev_first_movement_hour` — İlk hareket saati sapması | 0,088 |
| 4 | `dev_Kitchen` — Mutfak sapması | 0,084 |
| 5 | `dev_Lounge` — Oturma odası sapması | 0,083 |

---

## 7. Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Makine Öğrenmesi | Python 3.10, scikit-learn, pandas, numpy, imbalanced-learn |
| Model Serileştirme | joblib |
| Arka Uç | Node.js, Express.js |
| Web Ön Uç | React, Vite, React Router, Recharts, Axios |
| Mobil Uygulama | React Native, Expo, react-native-svg |
| LLM Entegrasyonu | Groq API (llama-3.1-8b-instant) — bakım ipucu üretimi |
| Geliştirme Ortamı | Anaconda, PyCharm, VS Code |

---

## 8. Kurulum ve Çalıştırma

### Ön Koşullar
- Python 3.10 (Anaconda ortamı)
- Node.js 18 veya üzeri
- Expo CLI (`npm install -g expo-cli`)
- TIHM veri seti CSV dosyaları ([Zenodo](https://zenodo.org/records/7622128)'dan indirin)

### Adım 1 — Python Ortamını Hazırlama

```bash
conda create -n fyp-yazilim python=3.10 -y
conda activate fyp-yazilim
conda install numpy pandas scikit-learn -c conda-forge -y
pip install imbalanced-learn joblib
```

### Adım 2 — ML Pipeline'ını Çalıştırma

CSV dosyalarını `Datasets/` klasörüne yerleştirdikten sonra:

```bash
python feature_engineering.py   # daily_features.csv oluşturur
python model.py                  # modeli eğitir, agitation_model.pkl kaydeder
python predict.py                # tüm hastaları skorlar, predictions.json kaydeder
```

### Adım 3 — Backend Sunucusu

```bash
cp predictions.json server/
cd dementia-app
npm install
node server/index.js             # http://localhost:3001
```

### Adım 4 — Web Arayüzü

```bash
cd dementia-app/client
npm install
npm run dev                      # http://localhost:5173
```

### Adım 5 — DementIQ Mobil Uygulama

```bash
cd DementIQ
npm install
npx expo start
```

`app.json` dosyasındaki `extra` alanını güncelleyin:

```json
"extra": {
  "apiBaseUrl": "http://<bilgisayar-ip-adresi>:3001",
  "groqApiKey": "<groq-api-anahtari>"
}
```

> **Not:** Mobil cihaz ve backend aynı ağda olmalıdır. `localhost` yerine yerel IP adresi kullanın (örn. `192.168.1.x`). Expo Go ile QR kod okutularak çalıştırılabilir.

---

## 9. Proje Dizin Yapısı

```
dementia-app/
├── server/
│   ├── index.js                  # Express API — 3 endpoint
│   └── predictions.json          # Skorlanmış tahmin verisi
├── client/
│   └── src/
│       ├── App.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   └── PatientView.jsx
│       └── components/
│           └── RiskBadge.jsx
│
DementIQ/                         # Mobil uygulama (React Native + Expo)
├── App.js
├── app.json                      # apiBaseUrl, groqApiKey
└── src/
    ├── navigation/
    │   └── AppNavigator.js
    ├── screens/
    │   ├── DashboardScreen.js
    │   ├── PatientDetailScreen.js
    │   ├── DayDetailScreen.js
    │   └── AlertScreen.js
    ├── components/
    │   └── RiskChart.js
    └── theme/
        ├── colors.js
        ├── ThemeContext.js
        └── index.js
│
Datasets/                         # TIHM CSV dosyaları (git'e eklenmez)
feature_engineering.py
model.py
predict.py
agitation_model.pkl               # (git'e eklenmez)
model_config.json
daily_features.csv                # (git'e eklenmez)
```

---

## 10. Önemli Tasarım Kararları

**Uyku verisinin kapsam dışı bırakılması:** Yalnızca 6 hastayla ajitasyon etiketi kesişimi olan uyku verisinden anlamlı öznitelik çıkarmak mümkün değildir.

**Z-skor normalizasyonu:** Ham hareket sayıları hastalar arasında karşılaştırılamaz. Z-skor, her özniteliği hastanın kendi geçmiş ortalamasına göre ifade ederek modelin bireysel davranış profillerini öğrenmesini sağlar.

**LOPO zorunluluğu:** Rastgele bölme veri sızıntısına yol açar. LOPO, klinik uygulamayı doğru simüle eden tek değerlendirme yöntemidir.

**Eşik optimizasyonu:** Kaçırılan ajitasyon olayı yanlış alarmdan çok daha ciddi sonuçlar doğurur. Eşik 0,50'den 0,13'e düşürülerek recall %9'dan %79'a yükseltildi.

**Badge hesabı:** Geçmişteki en yüksek risk skoru yerine `alert_days / total_days` oranı kullanılır — anlık risk algısını daha doğru yansıtır.

**Care Tip mimarisi:** Groq API, en güncel sensör verisi üzerinden bakıcıya kişiselleştirilmiş günlük bakım ipucu üretir.

---

## 📎 Bağlantılar

- 🎬 [Demo Video](https://youtube.com/shorts/xGd2jyL4Srg?si=37_ySdQcovNtK6oP)
- 📊 [TIHM Veri Seti (Zenodo)](https://zenodo.org/records/7622128)
- 🏆 [GNEC Hackathon 2026 — Devpost](https://devpost.com/software/dementiq)

---

*YZM310 Bitirme Projesi 1 — Samsun Üniversitesi — 2026*  
*Veri seti araştırma amaçlı kamuya açık olup Imperial College London ve Surrey and Borders Partnership NHS Foundation Trust tarafından sağlanmıştır.*