# Ev Ortamında Demans Bakımı İçin Davranışsal Tespit ve Uyarı Sistemi

---

## İçindekiler

1. [Proje Hakkında](#1-proje-hakkında)
2. [Veri Seti](#2-veri-seti)
3. [Sistem Mimarisi](#3-sistem-mimarisi)
4. [Makine Öğrenmesi Yaklaşımı](#4-makine-öğrenmesi-yaklaşımı)
5. [Model Performansı](#5-model-performansı)
6. [Teknoloji Yığını](#6-teknoloji-yığını)
7. [Kurulum ve Çalıştırma](#7-kurulum-ve-çalıştırma)
8. [Proje Dizin Yapısı](#8-proje-dizin-yapısı)
9. [Önemli Tasarım Kararları](#9-önemli-tasarım-kararları)

---

## 1. Proje Hakkında

Bu proje, demans hastası bireylerin ev içi hareket sensörü verilerini analiz ederek **ajitasyon (agitation) riskini günlük bazda tahmin eden** bir erken uyarı sistemi geliştirmeyi amaçlamaktadır.

Demans hastalarında ajitasyon, bakım verenler için en zorlu durumlardan biridir ve önceden tespit edilmesi hem hasta güvenliğini hem de bakım kalitesini doğrudan etkiler. Bu sistem, ev içine yerleştirilen pasif kızılötesi (PIR) hareket sensörlerinden elde edilen anonim veri üzerinde makine öğrenmesi modeli çalıştırarak her hasta için günlük risk skoru üretmekte ve belirli bir eşik değerinin üzerinde risk tespit edildiğinde uyarı oluşturmaktadır.

**Projenin katkısı üç katmanda özetlenebilir:**
- Ham sensör verilerinden klinik açıdan anlamlı davranışsal özniteliklerin çıkarılması
- Hastaya özgü temel çizgi normalizasyonu ile kişiselleştirilmiş risk değerlendirmesi
- Gerçek zamanlı izleme ve uyarı sunan tam yığın (full-stack) web uygulaması

---

## 2. Veri Seti

**Kaynak:** TIHM (Technology Integrated Health Management) Veri Seti  
**Yayın:** Palermo ve ark., *Nature Scientific Data*, 2023  
**Erişim:** [Zenodo — zenodo.org/records/7622128](https://zenodo.org/records/7622128)  
**Kurum:** Imperial College London, UK Dementia Research Institute

Veri seti beş ayrı CSV tablosundan oluşmaktadır:

| Tablo | İçerik | Satır Sayısı |
|-------|--------|-------------|
| `Activity.csv` | Oda bazlı PIR sensör tetiklenmeleri | 1.030.559 |
| `Sleep.csv` | Uyku evresi ve kalp hızı verileri | 461.423 |
| `Physiology.csv` | Manuel ölçüm fizyoloji verileri | — |
| `Labels.csv` | Klinik olaylar ve davranışsal etiketler | 608 |
| `Demographics.csv` | Hasta demografik bilgileri | 56 |

**Ön analiz bulguları:**
- `Labels.type` incelendiğinde yalnızca **Ajitasyon** (135 olay) gerçek davranışsal etiket olarak tanımlanmıştır; diğer etiketler fizyoloji ölçümlerinin yanlış sınıflandırılmasından kaynaklanmaktadır.
- Uyku verisi yalnızca 17 hastayı kapsamakta, bunlardan ajitasyon etiketi olan hastalarla kesişim yalnızca 6 hastaya düşmektedir. Bu nedenle uyku verisi kapsam dışı bırakılmıştır.
- Aktivite verisi ile eşleştirme sonrası 134/135 ajitasyon olayı kullanılabilir durumdadır.

---

## 3. Sistem Mimarisi

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
  - LOPO (Leave-One-Patient-Out) çapraz doğrulama
  - Eşik optimizasyonu (0,50 → 0,13)
         │
         ▼
agitation_model.pkl + model_config.json
         │
         ▼
predict.py → predictions.json (56 hasta, 2.722 gün)
         │
         ▼
Express API (Node.js) ←→ React Arayüzü (Vite)
  /api/summary            Dashboard — hasta listesi
  /api/patients           Risk filtreleme ve sıralama
  /api/patient/:id        Günlük risk zaman serisi + öznitelik tablosu
```

---

## 4. Makine Öğrenmesi Yaklaşımı

### 4.1 Öznitelik Mühendisliği

Ham aktivite verisi, her hasta için günlük özet satırlarına dönüştürülmüştür. Öznitelikler üç kategoride tanımlanmıştır:

**Hacim öznitelikleri** — günlük toplam hareket miktarı ve zaman dilimine göre dağılımı  
**Oda bazlı öznitelikler** — Mutfak, Koridor, Oturma Odası, Yatak Odası, Banyo, Ön Kapı, Arka Kapı için ayrı sayımlar  
**Sapma öznitelikleri (z-skor)** — Her hastanın kendi kişisel ortalama davranışına göre bugünkü sapması

Sapma öznitelikleri projenin en kritik tasarım kararıdır. Hastalar arasındaki bireysel farklılıkları (bir hasta günde 300 hareket yaparken diğeri 80 yapabilir) ortadan kaldırarak modelin genelleştirilmesine olanak tanır.

### 4.2 Model Seçimi

Tablo verisi için **Random Forest** tercih edilmiştir. Gerekçeleri:
- Doğrusal olmayan ilişkileri modelleyebilme
- Öznitelik önem derecesi çıktısı (klinik yorum için kritik)
- Gürültülü özniteliklere karşı dayanıklılık
- Hiperparametre ayarı gerektirmeden makul performans

### 4.3 Değerlendirme Yöntemi

**Leave-One-Patient-Out (LOPO) Çapraz Doğrulama** kullanılmıştır. Rastgele veri bölme yöntemi bu veri seti için uygun değildir; zira aynı hastanın farklı günlerine ait veriler eğitim ve test kümelerine karışırsa model genelleşme değil ezber yapar. LOPO, her adımda bir hastayı dışarıda bırakarak modelin hiç görmediği bir hasta üzerinde test edilmesini sağlar.

### 4.4 Sınıf Dengesizliği

Pozitif oran yaklaşık %4,2 (114 ajitasyon günü / 2.722 toplam gün) olup bu ciddi bir sınıf dengesizliği problemidir. Çözüm için iki yöntem birlikte uygulanmıştır:
- **SMOTE** (Synthetic Minority Oversampling Technique) — eğitim verisinde sentetik ajitasyon örnekleri üretir
- **class_weight='balanced'** — model kaybında azınlık sınıfını ağırlıklandırır

### 4.5 Eşik Optimizasyonu

Varsayılan 0,50 eşiği ile ajitasyon geri çağırma oranı (recall) yalnızca %9'dur. Precision-Recall eğrisi analizi sonrası optimal eşik **0,13** olarak belirlenmiş, recall %79'a yükseltilmiştir. Klinik bir uyarı sisteminde kaçırılan ajitasyon olayının maliyeti yanlış alarm maliyetinden çok daha yüksektir; bu nedenle yüksek recall önceliklendirilmiştir.

---

## 5. Model Performansı

| Metrik | Değer | Açıklama |
|--------|-------|----------|
| ROC-AUC | 0,655 | Eşikten bağımsız ayırt edici güç (0,5 = rastgele) |
| Ajitasyon Recall | %79 | Gerçek ajitasyon günlerinin tespit oranı |
| Ajitasyon Precision | %11 | Uyarıların gerçek ajitasyona isabet oranı |
| Optimal Eşik | 0,13 | F1 maksimizasyonuyla belirlenen karar sınırı |

**En öngörülü öznitelikler (Random Forest önem sıralaması):**

1. `dev_Hallway` — Koridor hareketlerindeki sapma (0,133)
2. `dev_total_movements` — Toplam hareket sapması (0,105)
3. `dev_first_movement_hour` — İlk hareket saatindeki sapma (0,088)
4. `dev_Kitchen` — Mutfak hareketlerindeki sapma (0,084)
5. `dev_Lounge` — Oturma odası hareketlerindeki sapma (0,083)

---

## 6. Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Makine Öğrenmesi | Python 3.10, scikit-learn, pandas, numpy, imbalanced-learn |
| Model Serileştirme | joblib |
| Arka Uç (Backend) | Node.js, Express.js |
| Ön Uç (Frontend) | React, Vite, React Router, Recharts, Axios |
| Geliştirme Ortamı | Anaconda, PyCharm, VS Code |

---

## 7. Kurulum ve Çalıştırma

### Ön Koşullar
- Python 3.10 (Anaconda ortamı)
- Node.js 18 veya üzeri
- TIHM veri seti CSV dosyaları ([Zenodo](https://zenodo.org/records/7622128)'dan indirin)

### Adım 1 — Python Ortamını Hazırlama

```bash
conda create -n fyp-yazilim python=3.10 -y
conda activate fyp-yazilim
conda install numpy pandas scikit-learn -c conda-forge -y
pip install imbalanced-learn joblib
```

### Adım 2 — Makine Öğrenmesi Pipeline'ını Çalıştırma

CSV dosyaları `Datasets/` klasörüne yerleştirildikten sonra sırasıyla:

```bash
python feature_engineering.py   # daily_features.csv oluşturur
python model.py                  # modeli eğitir, agitation_model.pkl kaydeder
python predict.py                # tüm hastaları skorlar, predictions.json kaydeder
```

### Adım 3 — Arka Uç Sunucusunu Başlatma

```bash
cp predictions.json server/
cd dementia-app
npm install
node server/index.js             # http://localhost:3001 adresinde çalışır
```

### Adım 4 — Ön Uç Uygulamasını Başlatma

```bash
cd dementia-app/client
npm install
npm run dev                      # http://localhost:5173 adresinde çalışır
```

Tarayıcıdan `http://localhost:5173` adresine gidildiğinde sistem arayüzü açılır.

---

## 8. Proje Dizin Yapısı

```
dementia-app/
├── server/
│   ├── index.js              # Express API — 3 endpoint
│   └── predictions.json      # Skorlanmış tahmin verisi
├── client/
│   └── src/
│       ├── App.jsx            # Yönlendirici (Router)
│       ├── pages/
│       │   ├── Dashboard.jsx  # Hasta listesi ve istatistikler
│       │   └── PatientView.jsx # Bireysel hasta zaman serisi
│       └── components/
│           └── RiskBadge.jsx  # Risk seviyesi rozeti
├── Datasets/                  # TIHM CSV dosyaları (git'e eklenmez)
│   ├── Activity.csv
│   ├── Sleep.csv
│   ├── Physiology.csv
│   ├── Labels.csv
│   └── Demographics.csv
├── feature_engineering.py     # Öznitelik mühendisliği pipeline'ı
├── model.py                   # Model eğitimi ve değerlendirme
├── predict.py                 # Tüm hastaları skorlama
├── agitation_model.pkl        # Eğitilmiş model (git'e eklenmez)
├── model_config.json          # Eşik ve öznitelik listesi
└── daily_features.csv         # Mühendislik çıktısı (git'e eklenmez)
```

---

## 9. Önemli Tasarım Kararları

**Uyku verisinin kapsam dışı bırakılması:** Uyku verisi yalnızca 17 hastayı kapsamakta olup ajitasyon etiketi bulunan hastalarla kesişimi yalnızca 6 hastadır. Bu büyüklükte bir alt kümeden anlamlı öznitelik çıkarmak mümkün değildir; bu nedenle model yalnızca aktivite verisi üzerine kurulmuştur.

**Hasta bazlı z-skor normalizasyonu:** Ham hareket sayıları hastalar arasında karşılaştırılamaz. Z-skor normalizasyonu, her özniteliği hastanın kendi geçmiş ortalamasına göre ifade ederek modelin bireysel davranış profillerini öğrenmesini sağlar.

**LOPO yerine rastgele bölme kullanılmaması:** Aynı hastanın farklı günlerine ait verilerin eğitim ve test kümelerine rastgele dağıtılması veri sızıntısına (data leakage) yol açar ve gerçekçi olmayan performans metrikleri üretir. LOPO, modeli hiç görmediği bir hasta üzerinde test ederek klinik uygulamayı simüle eder.

**Eşik optimizasyonu:** Klinik bir uyarı sisteminde kaçırılan ajitasyon olayı, yanlış alarmdan çok daha ciddi sonuçlar doğurur. Bu nedenle karar eşiği varsayılan 0,50'den 0,13'e düşürülerek recall %9'dan %79'a yükseltilmiştir.

---

*Bu proje YZM310 Bitirme Projesi 1 kapsamında geliştirilmiştir. Veri seti araştırma amaçlı kullanım için kamuya açık olup Imperial College London ve Surrey and Borders Partnership NHS Foundation Trust tarafından sağlanmıştır.*