# Etkinlik Yönetim Platformu

Kapsamlı etkinlik yönetimi, biletleme ve firmalar için SaaS platformu.

## 🚀 Render.com'da Ücretsiz Deploy (ÖNERİLEN)

### Adım 1: GitHub'a Push
```bash
git add .
git commit -m "Render deployment hazır"
git push origin main
```

### Adım 2: Render.com'a Kayıt
1. https://render.com adresine git
2. GitHub ile giriş yap (Sign Up with GitHub)

### Adım 3: Yeni Web Service Oluştur
1. Dashboard'da **"New +"** butonuna tıkla
2. **"Web Service"** seç
3. GitHub repo'nu seç: `HknAkn42/etkinlik`
4. Aşağıdaki ayarları yap:

**Build & Deploy Ayarları:**
- **Name:** `etkinlik-app` (veya istediğin isim)
- **Region:** `Frankfurt` (Türkiye'ye en yakın)
- **Branch:** `main`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

**Plan:**
- **Free** seçeneğini seç ✅

**Environment Variables (Ortam Değişkenleri):**
Şunları ekle:
```
NODE_ENV=production
JWT_SECRET=etkinlik_gizli_anahtar_2026_render
DATABASE_PATH=/opt/render/project/src/etkinlik.db
PORT=10000
```

### Adım 4: Disk (Persistent Storage) Ekle
1. Service oluşturulduktan sonra **"Disks"** sekmesine git
2. **"Add Disk"** tıkla
3. Ayarlar:
   - **Name:** `etkinlik-data`
   - **Mount Path:** `/opt/render/project/src`
   - **Size:** `1 GB` (ücretsiz)
4. **"Save"** tıkla

### Adım 5: Deploy!
- **"Create Web Service"** butonuna tıkla
- 2-3 dakika bekle, otomatik deploy olacak
- Deploy bitince URL'ni al: `https://etkinlik-app.onrender.com`

---

## 🎯 Yerel Geliştirme

```bash
# Dependencies yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcıda aç: http://localhost:3000

## 📦 Test Hesapları

- **SuperAdmin:** `superadmin@test.com` / `super123`
- **Müşteri:** `musteri@test.com` / `musteri123`
- **Personel:** `personel@test.com` / `personel123`

## ⚠️ Önemli Notlar

### Render Free Plan Özellikleri:
- ✅ Tamamen ücretsiz
- ✅ SQLite persist eder (1GB disk)
- ✅ SSL sertifikası otomatik
- ⚠️ 15 dakika inaktivite sonrası sleep mode (ilk istek 30 saniye sürebilir)
- ⚠️ Aylık 750 saat kullanım (günde 24 saat = 720 saat, yeterli!)

### SQLite Veritabanı
- Veritabanı `/opt/render/project/src/etkinlik.db` konumunda saklanır
- Persistent disk sayesinde veriler korunur
- Otomatik backup yapmayı unutma!

---

## 🔧 Alternatif: Railway (Ücretli - $5/ay)

Railway daha hızlı ama ücretli. Render ile başla, ihtiyaç olursa Railway'e geç.

## 📞 Destek

Sorun yaşarsan:
1. Render Dashboard → Logs kontrol et
2. Environment variables doğru mu kontrol et
3. Disk mount path'i doğru mu kontrol et

---

**Hazırlayan:** Hakan Akın @ Akınrobotics
**Versiyon:** 1.0.0
**Son Güncelleme:** 2026-03-28
