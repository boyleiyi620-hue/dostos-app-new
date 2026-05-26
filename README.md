# 🌈 Konuşuyorum - PWA

Çocuklar için sevimli AAC (Alternatif ve Destekleyici İletişim) uygulamasının PWA (Progressive Web App) sürümü. Offline çalışır, ana ekrana eklenebilir.

## 📁 Dosya Yapısı

```
konusuyorum-pwa/
├── index.html          # Ana uygulama (PWA meta etiketleri + SW kaydı eklendi)
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker (offline destek)
├── icons/              # Tüm PWA ikonları
│   ├── icon-72.png ... icon-512.png
│   ├── icon-maskable-192.png / 512.png
│   ├── apple-touch-icon.png
│   └── favicon-64.png
└── README.md
```

## 🚀 Yerel Test

PWA'lar **HTTPS veya localhost** üzerinden çalışır. `file://` ile açarsanız Service Worker devre dışı kalır.

### Yöntem 1 - Python ile (en kolay)

```bash
cd konusuyorum-pwa
python3 -m http.server 8000
```

Sonra tarayıcıda aç: <http://localhost:8000>

### Yöntem 2 - Node.js ile

```bash
npx serve konusuyorum-pwa
```

## 📱 Yükleme

- **Android/Chrome:** Adres çubuğundaki ⊕ ikonuna veya menüden "Uygulamayı yükle" tıklayın.
- **iOS/Safari:** Paylaş düğmesi → "Ana Ekrana Ekle".
- **Masaüstü Chrome/Edge:** Adres çubuğundaki yükleme ikonuna tıklayın.

İsterseniz uygulamadan kendi yükleme butonunuzu da çağırabilirsiniz:

```js
window.installKonusuyorum();
```

## ☁️ Yayınlama (HTTPS şart)

Aşağıdaki servislerden birine yükleyin — hepsi ücretsiz ve HTTPS sağlar:

- **GitHub Pages** — repo Settings → Pages
- **Netlify** — `konusuyorum-pwa/` klasörünü sürükle-bırak: <https://app.netlify.com/drop>
- **Vercel** — `vercel` CLI veya web arayüzü
- **Cloudflare Pages** — Git veya doğrudan yükleme

## ✅ PWA Doğrulama

1. Chrome DevTools → **Application** sekmesi
2. **Manifest** ve **Service Workers** bölümlerinin yeşil olduğunu kontrol edin
3. **Lighthouse** → PWA kategorisinde test çalıştırın

## 🔄 Önbellek Güncelleme

`sw.js` dosyasındaki `CACHE_VERSION` değerini değiştirin (ör. `v1.0.0` → `v1.0.1`). Service Worker yeni sürümü algılar ve eski önbelleği siler.

## 🎨 İkon Hakkında

İkonlar Python (Pillow) ile programatik olarak üretildi (`generate_icons.py`). Kendi tasarımınızı kullanmak isterseniz `icons/` klasöründeki dosyaları aynı isim ve boyutlarda değiştirin.

## 📝 Eklenenler (orijinal HTML'e ek olarak)

`index.html` dosyasına şunlar eklendi:

- `<link rel="manifest">`
- Apple iOS PWA meta etiketleri
- Microsoft Tile meta etiketleri
- Favicon bağlantıları
- Service Worker kayıt scripti
- `beforeinstallprompt` yakalayıcısı + `window.installKonusuyorum()` yardımcı fonksiyonu

Uygulamanın orijinal işlevselliğine **hiç dokunulmadı**.
