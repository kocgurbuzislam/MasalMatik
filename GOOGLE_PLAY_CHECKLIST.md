# Google Play Store Yayınlama Checklist

## ✅ Yapılandırma Dosyaları
- [x] `app.config.cjs` - Version, versionCode, SDK ayarları eklendi
- [x] `eas.json` - EAS Build konfigürasyonu oluşturuldu
- [x] Android permissions (INTERNET) eklendi

## 📋 Yapılması Gerekenler

### 1. Privacy Policy (ZORUNLU)
Google Play Store'da uygulama yayınlamak için **mutlaka bir Privacy Policy URL'si** gereklidir.

**Seçenekler:**
- GitHub Pages üzerinde bir privacy policy sayfası oluşturun
- Kendi websitenizde bir sayfa oluşturun
- Privacy policy generator kullanın (ör: https://www.privacypolicygenerator.info/)

**Privacy Policy içermesi gerekenler:**
- Uygulamanın hangi verileri topladığı (bu uygulama kullanıcı verisi toplamıyor)
- Google Gemini API kullanımı
- İnternet bağlantısı gereksinimi
- Çocuklar için uygulama olduğu (COPPA uyumluluğu)

**Örnek Privacy Policy URL ekleme:**
`app.config.cjs` dosyasına şunu ekleyin:
```javascript
android: {
  // ... mevcut ayarlar
  privacyPolicy: 'https://yourdomain.com/privacy-policy', // Privacy Policy URL'nizi buraya ekleyin
}
```

### 2. App Icons ve Assets
- [ ] `assets/icon.png` - 1024x1024 PNG (mevcut)
- [ ] `assets/adaptive-icon.png` - 1024x1024 PNG (önerilen, Android için)
- [ ] `assets/splash.png` - Splash screen (mevcut)

### 3. Google Play Console Hazırlığı

#### A. Google Play Developer Hesabı
- [ ] Google Play Developer hesabı oluşturun ($25 tek seferlik ücret)
- [ ] Developer hesabı bilgilerini doldurun

#### B. Store Listing Bilgileri
- [ ] **Uygulama Adı**: MasalMatik
- [ ] **Kısa Açıklama** (80 karakter max): "Yapay zeka ile çocuklar için sihirli hikayeler oluşturun"
- [ ] **Uzun Açıklama** (4000 karakter max): Detaylı açıklama yazın
- [ ] **Ekran Görüntüleri**: En az 2, en fazla 8 (farklı cihaz boyutları için)
- [ ] **Feature Graphic**: 1024x500 PNG (Google Play Store'da görünen banner)
- [ ] **App Icon**: 512x512 PNG (Google Play Console'da görünen)
- [ ] **Kategori**: Eğitim veya Çocuklar
- [ ] **İçerik Derecelendirmesi**: Çocuklar için içerik (COPPA uyumlu)

#### C. Fiyatlandırma ve Dağıtım
- [ ] Ücretsiz mi, ücretli mi? (Muhtemelen ücretsiz)
- [ ] Hangi ülkelerde yayınlanacak?
- [ ] Çocuklar için uygulama olarak işaretleme (Family Program)

### 4. Build ve Upload

#### Build Komutları:
```bash
# EAS Build kurulumu (ilk kez)
npm install -g eas-cli
eas login

# Production build oluştur
eas build --platform android --profile production

# Build tamamlandıktan sonra
eas submit --platform android
```

#### Alternatif (Local Build):
```bash
# Expo CLI ile local build (kendi bilgisayarınızda)
npx expo build:android -t app-bundle
```

### 5. Test ve Yayınlama
- [ ] Internal testing ile test edin
- [ ] Closed testing ile test edin
- [ ] Open testing (isteğe bağlı)
- [ ] Production'a yayınlayın

### 6. Önemli Notlar

#### Version Management
Her yeni yayın için `app.config.cjs` dosyasında:
- `version`: "1.0.1" (kullanıcıya gösterilen versiyon)
- `android.versionCode`: 2 (artırılmalı, her build için +1)

#### App Signing
Google Play Console otomatik app signing yapabilir veya kendi key'inizi kullanabilirsiniz.

#### COPPA Compliance (Çocuk Uygulamaları)
Bu uygulama çocuklar için olduğu için:
- [ ] Google Play Family Program'a katılın
- [ ] Privacy Policy'de çocuk verileri hakkında bilgi verin
- [ ] Reklam politikalarına dikkat edin (reklam yoksa sorun yok)

### 7. Gerekli Dosyalar Özeti
- ✅ `app.config.cjs` - Güncellendi
- ✅ `eas.json` - Oluşturuldu
- ⚠️ Privacy Policy URL - **EKLENMELİ**
- ⚠️ Feature Graphic - **OLUŞTURULMALI**
- ⚠️ Ekran görüntüleri - **HAZIRLANMALI**

## 🚀 Hızlı Başlangıç

1. Privacy Policy URL'sini hazırlayın ve `app.config.cjs`'e ekleyin
2. Feature graphic ve ekran görüntülerini hazırlayın
3. Google Play Developer hesabı oluşturun
4. `eas build --platform android --profile production` ile build alın
5. Google Play Console'a upload edin ve store listing'i doldurun
6. Test edin ve yayınlayın!

## 📞 Yardım
- EAS Build dokümantasyonu: https://docs.expo.dev/build/introduction/
- Google Play Console: https://play.google.com/console
- Expo dokümantasyonu: https://docs.expo.dev/

