# 🚀 RENDER.COM HIZLI KURULUM - 5 DAKİKA

## 📋 ÖNCESİNDE YAPILACAKLAR (Windsurf'te)

### 1. Package.json'u Güncelle
Mevcut `package.json` dosyanızdaki `scripts` bölümünü şununla DEĞİŞTİR:

```json
"scripts": {
  "dev": "tsx server.ts",
  "build": "vite build",
  "start": "NODE_ENV=production tsx server.ts",
  "preview": "vite preview",
  "clean": "rm -rf dist",
  "lint": "tsc --noEmit"
},
```

VE `dependencies` altına `tsx` ekle (şu anda `devDependencies`'de):

```json
"dependencies": {
  ...diğer paketler...
  "tsx": "^4.21.0",
  "vite": "^6.2.0"
}
```

### 2. render.yaml Dosyası Ekle
Proje kök dizinine `render.yaml` dosyası oluştur:

```yaml
services:
  - type: web
    name: etkinlik-app
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        value: etkinlik_gizli_anahtar_2026_render
      - key: DATABASE_PATH
        value: /opt/render/project/src/etkinlik.db
    disk:
      name: etkinlik-data
      mountPath: /opt/render/project/src
      sizeGB: 1
```

### 3. .gitignore Kontrol Et
`.gitignore` dosyanda bunların olduğundan emin ol:

```
node_modules
dist
*.db
.env
```

### 4. GitHub'a Push Et
```bash
git add .
git commit -m "Render deployment ready"
git push origin main
```

---

## 🌐 RENDER.COM'DA DEPLOYMENT

### 1. Hesap Oluştur
- https://render.com adresine git
- **"Get Started for Free"** tıkla
- **"Sign Up with GitHub"** ile kayıt ol
- GitHub yetkilendirmesini onayla

### 2. Yeni Service Oluştur
- Dashboard'da sağ üstte **"New +"** butonuna tıkla
- **"Web Service"** seç

### 3. Repository Bağla
- **"Connect a repository"** altında GitHub ikonuna tıkla
- `HknAkn42/etkinlik` repository'sini BUL ve **"Connect"** tıkla
- Bulamıyorsan: **"Configure account"** → Repo'ya erişim ver

### 4. Ayarları Yap
**Temel Ayarlar:**
- **Name:** `etkinlik-app` (veya istediğin isim)
- **Region:** `Frankfurt (EU Central)`
- **Branch:** `main`
- **Root Directory:** (boş bırak)
- **Runtime:** `Node`

**Build Ayarları:**
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

**Plan:**
- **Instance Type:** `Free` seç ✅

### 5. Environment Variables
Aşağı kaydır, **"Add Environment Variable"** butonuna tıkla:

```
NODE_ENV = production
JWT_SECRET = etkinlik_gizli_anahtar_2026_render
DATABASE_PATH = /opt/render/project/src/etkinlik.db
```

### 6. Disk Ekle (ÇOK ÖNEMLİ!)
**"Add Disk"** butonuna tıkla:
- **Name:** `etkinlik-data`
- **Mount Path:** `/opt/render/project/src`
- **Size:** `1 GB`

### 7. Deploy!
- En altta **"Create Web Service"** butonuna tıkla
- Deploy başlayacak (2-5 dakika sürer)
- **Logları izle**, hata varsa göreceksin

### 8. URL'ni Al
- Deploy bitince üstte **URL göreceksin**: `https://etkinlik-app.onrender.com`
- Bu URL'yi tarayıcıda aç!

---

## ✅ İLK GİRİŞ

Tarayıcıda URL'ni açtığında:

1. **İlk yükleme 30-60 saniye sürebilir** (free plan cold start)
2. Login ekranı gelecek
3. Test hesabıyla gir:
   - **Email:** `superadmin@test.com`
   - **Şifre:** `super123`

---

## ⚠️ SORUN YAŞARSAN

### Deploy Hatası Alıyorsan:
1. Render Dashboard → Service'ini seç → **"Logs"** sekmesine git
2. Kırmızı hataları oku
3. Genelde şunlardan biri:
   - `package.json` hatalı → Düzelt, push et
   - Environment variable eksik → Ekle, **"Manual Deploy"** tıkla
   - Disk mount yanlış → Disk ayarlarını kontrol et

### Database Hatası:
- Disk eklendiğinden emin ol
- Mount path doğru mu: `/opt/render/project/src`
- Environment'da `DATABASE_PATH` doğru mu

### Uygulama Açılmıyor:
- 15 dakika inactive kalmış olabilir (free plan)
- Sayfayı yenile, 30 saniye bekle

---

## 🎉 TAMAMDIR!

Artık uygulamanız çalışıyor:
- ✅ Tamamen ücretsiz
- ✅ SSL (HTTPS) otomatik
- ✅ Veritabanı persist ediyor
- ✅ Her push'ta otomatik deploy

**URL'ni paylaş, kullanmaya başla!** 🚀

---

## 📱 Sonraki Adımlar

1. Test hesaplarıyla giriş yap
2. Etkinlik oluştur
3. Bilet sat
4. Domain bağla (opsiyonel): Render Dashboard → Custom Domain

Başarılar! 🎯
