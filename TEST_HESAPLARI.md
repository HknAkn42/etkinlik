# Etkinlik Uygulaması Test Hesapları

Uygulama başarıyla çalışıyor! Tüm test hesapları oluşturuldu ve localhost:3000'de erişilebilir durumda.

## 🔴 SuperAdmin Hesabı
**Platform yönetimi için:**
- **E-posta**: `superadmin@test.com`
- **Şifre**: `super123`
- **Yetkiler**: Tüm firmaları yönetme, lisans atama, platform istatistikleri
- **Giriş sonrası**: `/superadmin` sayfasına yönlendirilir

## 🟡 Müşteri Hesabı (Ana Test)
**Müşteri tarafı testleri için:**
- **E-posta**: `musteri@test.com`
- **Şifre**: `musteri123`
- **Firma**: Test Müşteri Organizasyonu
- **Lisans**: Aktif
- **Yetkiler**: Etkinlik yönetimi, satış, personel, raporlar

## 🟢 Personel Hesabı
**Kısıtlı yetkili personel testleri:**
- **E-posta**: `personel@test.com`
- **Şifre**: `personel123`
- **Firma**: Test Müşteri Organizasyonu
- **Rol**: Staff
- **Yetkiler**: Sadece satış ve bilet okuma (gelir görüntüleme yok)

## 🔵 Demo Müşteri
**Demo modu testleri için:**
- **E-posta**: `demo@test.com`
- **Şifre**: `demo123`
- **Firma**: Demo Organizasyon
- **Lisans**: 14 günlük demo
- **Yetkiler**: Kısıtlı (personel yönetemez)

## 🟣 Premium Müşteri
**Premium özellikler testleri için:**
- **E-posta**: `premium@test.com`
- **Şifre**: `premium123`
- **Firma**: Premium Organizasyon
- **Lisans**: 1 yıllık premium
- **Yetkiler**: Tam yetkili

## Test Senaryoları

### 1. SuperAdmin Testleri
- [ ] Yeni firma oluşturma
- [ ] Lisans sürelerini yönetme
- [ ] Demo modu aktif/pasif etme
- [ ] Platform gelirlerini görme

### 2. Müşteri Testleri (Öncelikli)
- [ ] Etkinlik oluşturma/yayınlama
- [ ] Bilet satışı yapma
- [ ] Personel ekleme/yönetme
- [ ] Raporları görüntüleme

### 3. Personel Testleri
- [ ] Sadece satış yapabildiğini kontrol et
- [ ] Bilet okuyabildiğini kontrol et
- [ ] Gelir verilerini göremediğini kontrol et
- [ ] Etkinlik yönetemediğini kontrol et

### 4. Demo Müşteri Testleri
- [ ] Demo uyarılarını görme
- [ ] Personel yönetemediğini kontrol et
- [ ] Lisans süresi kontrolü
- [ ] Kısıtlı özellikler

### 5. Premium Müşteri Testleri
- [ ] Tüm özelliklere erişim
- [ ] Sınırsız etkinlik oluşturma
- [ ] Premium özellikler

## Veritabanı Bilgisi

- **Veritabanı**: `etkinlik.db` (projenin ana dizininde)
- **Tür**: SQLite (yerel dosya tabanlı)
- **Yedekleme**: Veritabanı dosyasını kopyalayarak yedekleyebilirsiniz

## Uygulama Erişimi

- **URL**: http://localhost:3000
- **Durum**: ✅ Aktif
- **Veri Saklama**: Yerel SQLite veritabanı
- **Port**: 3000

## Notlar

- Tüm şifreler test için basit tutulmuştur
- Uygulama tamamen yerel çalışmaktadır
- Verileriniz sizin bilgisayarınızda saklanır
- Sunucuyu durdurmak için `Ctrl+C` kullanın

## Önemli Test Akışı

1. **Önce SuperAdmin ile giriş yap** → Firma yönetimi kontrol et
2. **Sonra Müşteri hesabı ile giriş yap** → Etkinlik oluşturma test et
3. **Personel hesabı ile test et** → Yetki sınırlamalarını kontrol et

Artık uygulamanın tüm özelliklerini bu hesaplarla test edebilirsiniz!
