# PWA Setup - DostOS App

Bu dosya, `dostos-app-new` uygulamasına eklenen Progressive Web App (PWA) desteğinin detaylarını içermektedir.

## Yapılan Değişiklikler

### 1. **Manifest Dosyası** (`public/manifest.json`)
- Uygulama adı, açıklaması ve başlangıç URL'si tanımlanmıştır
- Uygulama ikonları (192x192 ve 512x512) için referanslar eklendi
- Standalone mod etkinleştirildi (tam ekran uygulama deneyimi)
- Kısayollar (Arena, Discover) tanımlandı
- Maskable ikonlar desteği eklendi

### 2. **Service Worker** (`public/sw.js`)
- Offline desteği sağlayan Service Worker uygulandı
- Caching stratejisi: Network first, fallback to cache
- Otomatik cache güncelleme
- Eski cache versiyonlarının temizlenmesi
- Offline sayfası desteği

### 3. **HTML Meta Etiketleri** (`index.html`)
- PWA meta etiketleri eklendi:
  - `theme-color`: Tema rengi
  - `mobile-web-app-capable`: Mobil web uygulaması desteği
  - `apple-mobile-web-app-capable`: iOS desteği
  - `apple-mobile-web-app-title`: iOS başlık
  - `apple-mobile-web-app-status-bar-style`: iOS durum çubuğu stili
- Apple touch icons tanımlandı
- Manifest linki eklendi
- Favicon referansları eklendi
- Service Worker kayıt scripti eklendi

### 4. **Vite Konfigürasyonu** (`vite.config.ts`)
- Service Worker için gerekli header eklendi: `Service-Worker-Allowed: /`

### 5. **Paket Adı** (`package.json`)
- Uygulama adı `my-app` → `dostos-app-new` olarak güncellendi

## Gerekli Adımlar

### İkon Dosyalarının Eklenmesi
Aşağıdaki ikonları `public/` klasörüne eklemeniz gerekir:

```
public/
├── icon-192x192.png              (192x192 piksel)
├── icon-512x512.png              (512x512 piksel)
├── icon-192x192-maskable.png     (192x192 piksel, maskable)
├── icon-512x512-maskable.png     (512x512 piksel, maskable)
├── icon-96x96.png                (96x96 piksel, shortcuts için)
├── screenshot-540x720.png        (Dar ekran screenshot)
└── screenshot-1280x720.png       (Geniş ekran screenshot)
```

**İkon Özellikleri:**
- Format: PNG
- Arka plan: Şeffaf veya düz renk
- Maskable ikonlar: Güvenli alan içinde logo (en az 80px boşluk)

### İkon Oluşturma Araçları
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- [Favicon Generator](https://favicon-generator.org/)
- [Maskable Icon Generator](https://maskable.app/)

## Kurulum ve Test

### Geliştirme Ortamında Test
```bash
npm run dev
```

Tarayıcı DevTools'ta (F12):
1. Application → Service Workers → Service Worker kaydının durumunu kontrol edin
2. Application → Manifest → manifest.json dosyasının yüklendiğini doğrulayın
3. Network → offline modunu etkinleştirin ve uygulamanın çalışmasını test edin

### Üretim Derlemesi
```bash
npm run build
npm run preview
```

## PWA Özellikleri

### Desteklenen Özellikler
- ✅ Offline desteği (Service Worker caching)
- ✅ Install to home screen (iOS ve Android)
- ✅ Standalone mod
- ✅ Tema rengi özelleştirmesi
- ✅ Uygulama kısayolları
- ✅ Responsive ikonlar (maskable)
- ✅ Otomatik güncelleme kontrolü

### Browser Desteği
| Browser | Destek |
|---------|--------|
| Chrome/Edge | ✅ Tam destek |
| Firefox | ✅ Tam destek |
| Safari (iOS 15+) | ✅ Kısmi destek |
| Samsung Internet | ✅ Tam destek |

## Lighthouse Auditi

PWA kalitesini kontrol etmek için:
1. Chrome DevTools açın
2. Lighthouse sekmesine gidin
3. "PWA" kategorisini seçin
4. "Analyze page load" butonuna tıklayın

Hedef skor: 90+

## Güvenlik Notları

- Service Worker yalnızca HTTPS üzerinde çalışır (localhost hariç)
- Manifest dosyası public olarak erişilebilir olmalıdır
- İkonlar CDN veya public klasörde barındırılmalıdır

## Sorun Giderme

### Service Worker Kaydedilmiyor
- Tarayıcı konsolunda hata mesajlarını kontrol edin
- HTTPS kullanıyor olduğunuzdan emin olun
- Service Worker dosyasının doğru yolda olduğunu doğrulayın

### İkonlar Yüklenmiyorsa
- İkon dosyalarının `public/` klasöründe olduğunu kontrol edin
- Dosya adlarının `manifest.json` ile eşleştiğini doğrulayın
- Tarayıcı cache'ini temizleyin

### Offline Mod Çalışmıyor
- Service Worker'ın başarıyla kaydedildiğini doğrulayın
- Network sekmesinde offline modunu etkinleştirin
- Cache Storage'da verilerin saklandığını kontrol edin

## Referanslar

- [MDN - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev - PWA Checklist](https://web.dev/pwa-checklist/)
- [PWA Builder](https://www.pwabuilder.com/)
