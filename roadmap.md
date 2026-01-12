# 📘 Quiz App - Development Roadmap

## 🎯 Proje Özeti

Öğrenciler ve öğretmenler için kategori bazlı soru çözme, admin panelinden soru yönetimi ve detaylı istatistik takibi sunan interaktif Quiz uygulaması.

---

## 👥 Kullanıcı Tipleri

### 🎓 Öğrenci (User)

- ✅ Soru çözme
- ✅ Kategori seçme
- ✅ Puan görüntüleme
- ✅ Soru raporu görüntüleme (doğru/yanlış analizi)
- 📊 İstatistik takibi

### 👨‍💼 Admin

- ➕ Soru ekleme
- ✏️ Soru düzenleme
- 🗑️ Soru silme
- 📁 Kategori yönetimi
- 📊 Kullanıcı istatistikleri görüntüleme

---

## 🗓️ Development Phases

### **Phase 1: Temel Altyapı ve Veritabanı Tasarımı** ⏱️ 1 Hafta

#### 1.1 Veritabanı Yapısı

- [ ] **Questions Collection**

  - `id`: String (unique)
  - `question`: String (soru metni)
  - `options`: Array[4] (şıklar)
  - `correctAnswer`: String (doğru cevap)
  - `category`: String (kategori)
  - `difficulty`: String (Kolay/Orta/Zor)
  - `explanation`: String (opsiyonel açıklama)
  - `isActive`: Boolean (aktif/pasif)
  - `createdAt`: Date
  - `updatedAt`: Date

- [ ] **Categories Collection**

  - `id`: String
  - `name`: String
  - `description`: String
  - `icon`: String (emoji veya icon class)
  - `isActive`: Boolean
  - `questionCount`: Number

- [ ] **Users Collection**

  - `id`: String
  - `username`: String
  - `email`: String
  - `password`: String (hashed)
  - `role`: String (user/admin)
  - `createdAt`: Date
  - `stats`: Object (özet istatistikler)

- [ ] **Quiz History Collection**

  - `id`: String
  - `userId`: String
  - `quizDate`: Date
  - `category`: String
  - `questions`: Array (çözülen sorular)
  - `userAnswers`: Array (kullanıcı cevapları)
  - `correctCount`: Number
  - `wrongCount`: Number
  - `totalTime`: Number (saniye)
  - `score`: Number (yüzdelik)

- [ ] **Question Statistics Collection**
  - `questionId`: String
  - `userId`: String
  - `attemptCount`: Number
  - `correctCount`: Number
  - `wrongCount`: Number
  - `lastAttempt`: Date

#### 1.2 Backend Geliştirme

- [ ] Node.js + Express.js kurulumu
- [ ] MongoDB/PostgreSQL bağlantısı
- [ ] Authentication middleware (JWT)
- [ ] RESTful API endpoints tasarımı

---

### **Phase 2: Kimlik Doğrulama Sistemi** ⏱️ 3-4 Gün

#### 2.1 Kullanıcı Yönetimi

- [ ] **Kayıt Sistemi**

  - Email/username ile kayıt
  - Şifre validasyonu
  - Email doğrulama (opsiyonel)

- [ ] **Giriş Sistemi**

  - Email/username + password
  - JWT token oluşturma
  - "Beni Hatırla" özelliği
  - Google OAuth entegrasyonu (opsiyonel)

- [ ] **Rol Yönetimi**
  - User/Admin rolleri
  - Route protection middleware
  - Admin paneli erişim kontrolü

#### 2.2 API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/google (opsiyonel)
```

---

### **Phase 3: Ana Quiz Modülü Geliştirme** ⏱️ 1.5 Hafta

#### 3.1 Quiz Başlatma Akışı

- [ ] **Ana Ekran (Landing Page)**

  - Quiz Başlat butonu
  - Kategori Seç butonu
  - İstatistiklerim butonu
  - Ayarlar butonu

- [ ] **Kategori Seçim Ekranı**

  - Kategorileri listeleme (grid/list view)
  - Her kategoride kaç soru olduğunu gösterme
  - "Rastgele Kategori" seçeneği

- [ ] **Quiz Yapılandırma**
  - Seçilen kategoriden rastgele 10 soru çekme
  - Soruları karıştırma (shuffle)
  - Quiz oturumu oluşturma

#### 3.2 Quiz Ekranı

- [ ] **Soru Gösterimi**

  - Soru metni
  - 4 seçenek (A, B, C, D)
  - Soru sayacı (1/10)
  - Zamanlayıcı (soru başına 30 saniye - opsiyonel)
  - Progress bar

- [ ] **Cevaplama Mekanizması**

  - Seçenek tıklama
  - Doğru/yanlış animasyonu
  - Doğru cevap vurgulama
  - 2 saniye bekleyip sonraki soruya geçiş
  - Cevapları localStorage'a kaydetme

- [ ] **Navigasyon**
  - Sonraki soru butonu
  - Önceki soruya dönme YOK
  - Quiz'den çıkma onayı

#### 3.3 Quiz Sonuç Ekranı

- [ ] **Sonuç Özeti**

  - Doğru sayısı
  - Yanlış sayısı
  - Boş sayısı
  - Yüzdelik başarı
  - Toplam süre
  - Başarı mesajı (Mükemmel/İyi/Orta/Çalış)

- [ ] **Eylem Butonları**
  - Tekrar Oyna
  - Çözüm Analizi
  - Ana Menü
  - Paylaş (opsiyonel)

#### 3.4 API Endpoints

```
GET    /api/categories
GET    /api/quiz/start?category=:id
POST   /api/quiz/submit
GET    /api/quiz/result/:quizId
```

---

### **Phase 4: Çözüm Analizi ve İstatistikler** ⏱️ 1 Hafta

#### 4.1 Çözüm Analizi Ekranı

- [ ] **Soru Detay Kartları**

  - Her soru için ayrı kart
  - Soru metni
  - Kullanıcının verdiği cevap (kırmızı/yeşil)
  - Doğru cevap (yeşil vurgu)
  - Soru açıklaması (varsa)
  - İkon (✓ / ✗)

- [ ] **Filtreleme**
  - Sadece yanlışları göster
  - Sadece doğruları göster
  - Tümünü göster

#### 4.2 İstatistikler Sayfası

- [ ] **Genel İstatistikler**

  - Toplam çözülen quiz sayısı
  - Toplam doğru/yanlış oranı
  - Ortalama başarı yüzdesi
  - Toplam harcanan süre

- [ ] **Kategori Bazlı İstatistikler**

  - Her kategoriden kaç quiz çözüldü
  - Kategori başına başarı oranı
  - En başarılı kategori
  - En zayıf kategori

- [ ] **Soru Bazlı İstatistikler** (ÖNEMLİ)

  - En çok yanlış yapılan 10 soru
  - Tekrar eden sorular listesi
  - Her soru için:
    - Kaç kez görüldü
    - Kaç kez doğru yapıldı
    - Kaç kez yanlış yapıldı
    - Son çözülme tarihi

- [ ] **Görselleştirme**
  - Chart.js ile grafikler
  - Kategori dağılımı (pie chart)
  - Zaman içinde ilerleme (line chart)
  - Başarı trendi (bar chart)

#### 4.3 API Endpoints

```
GET    /api/stats/overview
GET    /api/stats/categories
GET    /api/stats/questions
GET    /api/stats/history?limit=20
GET    /api/quiz/:quizId/analysis
```

---

### **Phase 5: Admin Paneli Geliştirme** ⏱️ 1.5 Hafta

#### 5.1 Admin Giriş ve Güvenlik

- [ ] **Admin Login**

  - Özel `/admin` route
  - Admin kullanıcı adı + şifre
  - 2FA (Two Factor Authentication) - opsiyonel
  - Session yönetimi

- [ ] **Güvenlik**
  - Admin middleware
  - CSRF protection
  - Rate limiting
  - Activity logging

#### 5.2 Soru Yönetim Paneli

- [ ] **Soru Listesi**

  - Tablo görünümü (DataTable)
  - Sütunlar:
    - ID
    - Soru (kısaltılmış)
    - Kategori
    - Zorluk
    - Durum (Aktif/Pasif)
    - Oluşturma tarihi
    - İşlemler (Düzenle/Sil)
  - Filtreleme (kategori, zorluk, durum)
  - Arama (soru metninde)
  - Sayfalama (pagination)
  - Toplu işlemler (seçilileri sil/aktif yap)

- [ ] **Soru Ekleme Formu**

  - Soru metni (textarea, max 500 karakter)
  - 4 seçenek (input fields)
  - Doğru cevap seçimi (radio button)
  - Kategori seçimi (dropdown)
  - Zorluk seviyesi (dropdown: Kolay/Orta/Zor)
  - Soru açıklaması (textarea, opsiyonel)
  - Resim ekleme (opsiyonel)
  - Önizleme butonu
  - Kaydet butonu

- [ ] **Soru Düzenleme**

  - Mevcut soruyu getirme
  - Aynı form yapısı
  - Güncelleme onayı
  - Değişiklik geçmişi (opsiyonel)

- [ ] **Soru Silme**
  - Soft delete (isActive = false)
  - Hard delete (kalıcı silme)
  - Onay modalı
  - Geri alma özelliği (opsiyonel)

#### 5.3 Kategori Yönetimi

- [ ] **Kategori Listesi**

  - Kategori adı
  - Açıklama
  - Soru sayısı
  - Durum (Aktif/Pasif)
  - İşlemler

- [ ] **Kategori CRUD**
  - Yeni kategori ekleme
  - Kategori düzenleme
  - Kategori silme (içindeki soruları kontrol et)
  - Kategori ikonu seçimi

#### 5.4 İstatistik ve Raporlama

- [ ] **Dashboard**

  - Toplam soru sayısı
  - Aktif/Pasif soru oranı
  - Toplam kullanıcı sayısı
  - Günlük/Haftalık aktif kullanıcı
  - En popüler kategoriler

- [ ] **Kullanıcı İstatistikleri**

  - Kullanıcı listesi
  - Her kullanıcının başarı oranı
  - En aktif kullanıcılar
  - Son aktiviteler

- [ ] **Soru Performans Analizi**
  - En çok yanlış yapılan sorular
  - En kolay/zor sorular
  - Hiç çözülmeyen sorular

#### 5.5 API Endpoints

```
# Soru Yönetimi
GET    /api/admin/questions?page=1&limit=20
POST   /api/admin/questions
GET    /api/admin/questions/:id
PUT    /api/admin/questions/:id
DELETE /api/admin/questions/:id
PATCH  /api/admin/questions/:id/toggle-status

# Kategori Yönetimi
GET    /api/admin/categories
POST   /api/admin/categories
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id

# İstatistikler
GET    /api/admin/stats/dashboard
GET    /api/admin/stats/users
GET    /api/admin/stats/questions
```

---

### **Phase 6: Gelişmiş Özellikler (Opsiyonel)** ⏱️ 2 Hafta

#### 6.1 Günlük Quiz

- [ ] Her gün yeni bir quiz seti
- [ ] Günlük streak takibi
- [ ] Haftalık liderlik tablosu
- [ ] Bildirim sistemi (yeni günlük quiz hazır!)

#### 6.2 Zaman Bazlı Yarışma Modu

- [ ] Süre ile puan artışı
- [ ] Combo sistemi (art arda doğru cevaplar)
- [ ] Power-up'lar (ipucu, 50-50, süre uzatma)
- [ ] Real-time leaderboard

#### 6.3 Online Leaderboard

- [ ] Global sıralama
- [ ] Haftalık/Aylık sıralama
- [ ] Kategori bazlı sıralama
- [ ] Arkadaşlar arası sıralama

#### 6.4 Sınıf Sistemi

- [ ] **Öğretmen Modülü**
  - Sınıf oluşturma
  - Öğrenci davet etme
  - Özel quiz oluşturma
  - Sınıf istatistikleri
- [ ] **Öğrenci Takip**
  - Her öğrencinin performansı
  - Zayıf olduğu konular
  - İlerleme raporu
  - Ödev atama

#### 6.5 Sertifika Sistemi

- [ ] Başarı rozetleri
- [ ] PDF sertifika oluşturma
- [ ] Sosyal medya paylaşımı
- [ ] Sertifika galerisi

#### 6.6 Gelişmiş Özellikler

- [ ] Dark mode
- [ ] Çoklu dil desteği (i18n)
- [ ] Sesli soru okuma (Text-to-Speech)
- [ ] Favorilere soru ekleme
- [ ] Not alma sistemi
- [ ] Flashcard modu

---

## 🛠️ Teknoloji Stack Önerileri

### Frontend

- **Framework**: React.js / Vue.js
- **UI Library**: Bootstrap 5 / Tailwind CSS / Material-UI
- **State Management**: Redux / Vuex / Context API
- **Charts**: Chart.js / Recharts
- **Animations**: Framer Motion / GSAP

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB / PostgreSQL
- **ORM**: Mongoose / Sequelize
- **Authentication**: JWT + bcrypt
- **Validation**: Joi / express-validator

### DevOps

- **Hosting**: Vercel (Frontend) + Heroku/Railway (Backend)
- **Database**: MongoDB Atlas / Supabase
- **Storage**: Cloudinary (resimler için)
- **CI/CD**: GitHub Actions

---

## 📊 Öncelik Sıralaması

### 🔴 Yüksek Öncelikli (MVP)

1. ✅ Temel kimlik doğrulama (kayıt/giriş)
2. ✅ Quiz başlatma ve soru çözme
3. ✅ Sonuç ekranı
4. ✅ Admin paneli - soru CRUD
5. ✅ Kategori sistemi

### 🟡 Orta Öncelikli

1. ✅ Çözüm analizi
2. ✅ Temel istatistikler
3. ✅ Soru bazlı geçmiş
4. ✅ Admin dashboard

### 🟢 Düşük Öncelikli (Nice to Have)

1. ⭐ Günlük quiz
2. ⭐ Leaderboard
3. ⭐ Sınıf sistemi
4. ⭐ Sertifika sistemi
5. ⭐ Sosyal özellikler

---

## 🧪 Test Planı

### Unit Tests

- [ ] Authentication fonksiyonları
- [ ] Quiz mantığı (scoring, shuffle)
- [ ] Soru validasyonu

### Integration Tests

- [ ] API endpoints
- [ ] Database işlemleri
- [ ] Admin paneli işlemleri

### E2E Tests

- [ ] Kullanıcı kayıt/giriş akışı
- [ ] Quiz tamamlama akışı
- [ ] Admin soru ekleme akışı

---

## 📅 Tahmini Geliştirme Süresi

| Phase                | Süre      | Bitiş     |
| -------------------- | --------- | --------- |
| Phase 1 - Altyapı    | 1 hafta   | Hafta 1   |
| Phase 2 - Auth       | 3-4 gün   | Hafta 2   |
| Phase 3 - Quiz       | 1.5 hafta | Hafta 3.5 |
| Phase 4 - İstatistik | 1 hafta   | Hafta 4.5 |
| Phase 5 - Admin      | 1.5 hafta | Hafta 6   |
| Phase 6 - Opsiyonel  | 2 hafta   | Hafta 8   |

**Toplam MVP Süresi**: ~6 hafta
**Tam Özellikli Versiyon**: ~8 hafta

---

## 🚀 Deployment Checklist

- [ ] Environment variables yapılandırması
- [ ] Production database kurulumu
- [ ] CORS ayarları
- [ ] Rate limiting
- [ ] Error logging (Sentry)
- [ ] Analytics (Google Analytics)
- [ ] Performance monitoring
- [ ] Backup stratejisi
- [ ] SSL sertifikası
- [ ] Domain bağlama

---

## 📝 Dokümantasyon Gereksinimleri

- [ ] API dokümantasyonu (Swagger/Postman)
- [ ] Kullanıcı kılavuzu
- [ ] Admin paneli kılavuzu
- [ ] Kurulum dokümantasyonu
- [ ] Katkıda bulunma rehberi (CONTRIBUTING.md)
- [ ] Lisans dosyası

---

## 🎯 Başarı Kriterleri

### Teknik

- ✅ Sayfa yükleme süresi < 2 saniye
- ✅ API response time < 500ms
- ✅ Mobil uyumlu (responsive)
- ✅ %0 kritik bug
- ✅ Test coverage > %70

### Kullanıcı Deneyimi

- ✅ Sezgisel arayüz
- ✅ Sorunsuz quiz akışı
- ✅ Anlaşılır istatistikler
- ✅ Hızlı sayfa geçişleri

### İş Hedefleri

- ✅ İlk ay 100+ kullanıcı
- ✅ Ortalama quiz tamamlama oranı > %60
- ✅ Günlük aktif kullanıcı oranı > %20

---

## 📞 Destek ve İletişim

- **Developer**: [İsim]
- **Email**: [Email]
- **GitHub**: [Repo Link]
- **Documentation**: [Docs Link]

---

**Son Güncelleme**: 3 Aralık 2025
**Versiyon**: 1.0.0
