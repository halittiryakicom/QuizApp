# 🎓 Quiz App - İnteraktif Quiz Uygulaması

Modern, gerçek zamanlı ve kullanıcı dostu bir quiz uygulaması. Öğretmenler test oluşturabilir, öğrenciler davet kodu ile aynı anda sınava girebilir ve sonuçlarını anlık olarak takip edebilir.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)

---

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Teknolojiler](#-teknolojiler)
- [Kurulum](#-kurulum)
- [Kullanım](#-kullanım)
- [Proje Yapısı](#-proje-yapısı)
- [API Endpoints](#-api-endpoints)
- [Socket.IO Olayları](#-socketio-olayları)
- [Veritabanı](#-veritabanı)
- [Yol Haritası](#-yol-haritası)
- [Lisans](#-lisans)
- [İletişim](#-iletişim-ve-linkler)

---

## ✨ Özellikler

### 🎯 Genel Özellikler

- ✅ **Gerçek Zamanlı İletişim**: Socket.IO ile canlı sınav deneyimi
- ✅ **Kullanıcı Yönetimi**: Öğretmen kaydı ve girişi (bcrypt ile şifreli)
- ✅ **Oda Sistemi**: 5 haneli davet kodu ile öğrenci katılımı, tüm öğrenciler aynı anda başlar
- ✅ **Responsive Tasarım**: Mobil, tablet ve masaüstü uyumlu arayüz
- ✅ **Otomatik Puanlama**: Anlık puan hesaplama ve sıralama

### 👨‍🏫 Öğretmen Özellikleri

- 📝 **Test Oluşturma**: `/create-test` sayfasında 4 soru tipi desteği
  - Çoktan Seçmeli (`multiple`)
  - Doğru/Yanlış (`truefalse`)
  - Boşluk Doldurma (`fillblank`) — birden fazla kabul edilen cevap tanımlanabilir, büyük/küçük harf duyarsız
  - Eşleştirme (`matching`) — geliştirme aşamasında
- 🎨 **Özelleştirilebilir Testler**: Başlık, kategori, açıklama, soru başına süre
- 🚪 **Oda Açma**: Kayıtlı bir testten tek tıkla oda açıp davet kodu üretme
- 📊 **Öğretmen Kontrolünde İlerleme**: Her sorudan sonra "Sonraki Soru" ile devam edilir — öğrenciler cevaplasa bile süre öğretmenin elinde
- 🏆 **Liderlik Tablosu Kontrolü**: Her soru arası 5 saniye ilk 10, madalyalı (🥇🥈🥉) liderlik tablosu
- 📈 **Test İstatistikleri**: Kaç kez oynatıldı, kaç öğrenci çözdü, ortalama başarı
- 🔐 **Güvenli Giriş**: Token tabanlı kimlik doğrulama

### 👨‍🎓 Öğrenci Özellikleri

- 🚀 **Kolay Katılım**: Ana sayfadan isim + 5 haneli oda koduyla hızlı bağlanma
- ⏱️ **Zamanlayıcı**: Her soru için görsel geri sayım
- 🎯 **Çeşitli Soru Tipleri**: Farklı formatlarda soruları yanıtlama
- 🏅 **Anlık Sonuçlar**: Her sorudan sonra kendi sırasını gösteren liderlik tablosu, quiz bitiminde detaylı performans
- 💡 **Kullanıcı Dostu Arayüz**: Sade ve anlaşılır tasarım

### 🔧 Admin Özellikleri

- 👥 **Kullanıcı Yönetimi**: Öğretmen hesaplarını yönetme, şifre sıfırlama
- 📋 **Test Yönetimi**: Tüm testleri görüntüleme, silme
- 📊 **Genel İstatistikler**: Toplam test/oynatma/öğrenci sayısı ve genel ortalama başarı

---

## 🛠️ Teknolojiler

### Backend

- **Node.js**: v14.x veya üzeri
- **Express.js**: Web framework
- **Socket.IO**: Gerçek zamanlı çift yönlü iletişim
- **bcrypt**: Şifre hashleme ve güvenlik
- **better-sqlite3**: Kalıcı veri (kullanıcılar, kategoriler, testler) — bkz. [Veritabanı](#-veritabanı)

### Frontend

- **HTML5 / CSS3**: Semantic markup, modern styling
- **Bootstrap 5**: Responsive UI framework
- **Font Awesome**: İkon seti
- **Vanilla JavaScript**: Client-side logic
- **Socket.IO Client**: Gerçek zamanlı bağlantı

---

## 📦 Kurulum

### Gereksinimler

- Node.js (v14.x veya üzeri)
- npm veya yarn

### Adım Adım Kurulum

1. **Projeyi klonlayın**

```bash
git clone <repository-url>
cd QuizApp
```

2. **Bağımlılıkları yükleyin**

```bash
npm install
```

3. **Uygulamayı başlatın**

Geliştirme modu (nodemon ile):

```bash
npm run dev
```

Veya production modu:

```bash
npm start
```

4. **Tarayıcıda açın**

- Öğrenci sayfası: http://localhost:3000/
- Öğretmen paneli: http://localhost:3000/teacher
- Admin paneli: http://localhost:3000/admin

---

## 🎮 Kullanım

### Öğretmen İşlemleri

#### 1. Kayıt Olma ve Giriş

- `/login` adresine gidin
- "Kayıt Ol" sekmesinden hesap oluşturun
- Giriş yapın

#### 2. Test Oluşturma

- `/create-test` sayfasına gidin
- Test bilgilerini doldurun: başlık, açıklama, kategori, soru başına süre
- Soru Ekle menüsünden soru tipi seçip soruları ekleyin ve kaydedin

#### 3. Oda Açma ve Quiz Başlatma

- `/teacher` paneline gidin, bir test seçin
- "Oda Aç" ile 5 haneli davet kodu üretin ve öğrencilerle paylaşın
- Öğrenciler katıldıkça listeyi görün, "Testi Başlat"a basın
- TÜM öğrenciler aynı anda ilk soruyu görür
- Her cevaplama turundan sonra "Sonraki Soru"ya basarak ilerleyin — arada 5 saniyelik liderlik tablosu otomatik gösterilir

### Öğrenci İşlemleri

#### 1. Odaya Katılma

- Ana sayfaya (`/`) gidin, adınızı ve öğretmenin verdiği 5 haneli kodu girin
- "Odaya Katıl"a tıklayıp bekleme ekranında öğretmeni bekleyin

#### 2. Quiz'e Katılma

- Sorular geldiğinde cevabınızı işaretleyin, zamanlayıcıya dikkat edin
- Her sorudan sonra kendi sıranızı liderlik tablosunda görün
- Quiz bitiminde detaylı sonucunuzu görün

---

## 📁 Proje Yapısı

```
QuizApp/
│
├── 📂 data/
│   ├── quizapp.db                # SQLite veritabanı — kullanıcılar, kategoriler, testler (.gitignore'da)
│   ├── questions.json             # Eski soru bankası (kullanılmıyor, referans olarak duruyor)
│   ├── tests.json                 # Eski test deposu (SQLite'a taşındı, artık okunmuyor)
│   └── categories.json            # Eski kategori deposu (SQLite'a taşındı, artık okunmuyor)
│
├── 📂 database/                  # SQLite şema + migration
│   ├── schema.sql                # users / categories / tests tabloları
│   ├── migrate.js                # JSON -> SQLite migrasyon script'i (idempotent)
│   └── db-helpers.js             # Veri erişim katmanı (server.js bunu kullanır)
│
├── 📂 config/
│   └── database.js               # SQLite bağlantısı (better-sqlite3, tek dosya)
│
├── 📂 public/                    # Frontend dosyaları
│   ├── 📂 css/                   # admin.css, style.css, teacher.css
│   ├── 📂 js/                    # admin.js, create-test.js, login.js, student.js, teacher.js, quiz.js, ui.js
│   ├── admin.html                # Admin paneli
│   ├── create-test.html          # Test oluşturma sayfası
│   ├── index.html                # Öğrenci ana sayfası
│   ├── login.html                # Giriş/Kayıt sayfası
│   └── teacher.html              # Öğretmen paneli
│
├── server.js                     # Express ve Socket.IO server (şu an JSON veri katmanını kullanıyor)
├── package.json                  # Proje bağımlılıkları
├── DATABASE_SETUP.md             # SQLite kurulum rehberi
└── readme.md                     # Bu dosya
```

---

## 🔌 API Endpoints

### Auth Endpoints

#### POST `/api/auth/register`

Yeni öğretmen kaydı

**Request Body:**

```json
{
  "fullName": "Ahmet Yılmaz",
  "username": "ahmet",
  "password": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Kayıt başarılı"
}
```

#### POST `/api/auth/login`

Öğretmen girişi

**Request Body:**

```json
{
  "username": "ahmet",
  "password": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "token": "token_1234567890_abcdef...",
  "user": {
    "id": "user_1234567890",
    "fullName": "Ahmet Yılmaz",
    "username": "ahmet"
  }
}
```

#### POST `/api/auth/reset-password`

Şifre sıfırlama (Admin)

**Request Body:**

```json
{
  "username": "ahmet",
  "newPassword": "yeni123"
}
```

### Test Endpoints

#### GET `/api/tests`

Tüm testleri listele

**Headers:** `Authorization: token_xxx`

**Response:**

```json
[
  {
    "id": "test_1234567890_abc",
    "title": "Matematik Quiz",
    "description": "Temel matematik soruları",
    "category": "Matematik",
    "timePerQuestion": 30,
    "questions": [...],
    "createdBy": "user_xxx",
    "createdAt": "2026-01-12T..."
  }
]
```

#### POST `/api/tests`

Yeni test oluştur

**Headers:** `Authorization: token_xxx`

**Request Body:**

```json
{
  "title": "Matematik Quiz",
  "description": "Temel matematik soruları",
  "category": "Matematik",
  "timePerQuestion": 30,
  "questions": [
    {
      "type": "multiple",
      "question": "2 + 2 = ?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": "4"
    }
  ]
}
```

#### DELETE `/api/tests/:id`

Test sil

**Headers:** `Authorization: token_xxx`

### Admin Endpoints

#### GET `/api/admin/users`

Tüm kullanıcıları listele

**Response:**

```json
[
  {
    "id": "user_xxx",
    "fullName": "Ahmet Yılmaz",
    "username": "ahmet",
    "role": "teacher",
    "createdAt": "..."
  }
]
```

---

## 🔌 Socket.IO Olayları

### Öğrenci Olayları

| Olay                   | Yön              | Açıklama              | Veri                                       |
| ---------------------- | ---------------- | ---------------------- | ------------------------------------------- |
| `join-room`            | Client → Server  | Odaya katılma isteği  | `{ roomCode, studentName }`                |
| `student-joined`       | Server → Client  | Katılım başarılı      | `{ roomId, studentId, students }`          |
| `join-error`           | Server → Client  | Katılım hatası        | `{ message }`                              |
| `submit-answer`        | Client → Server  | Cevap gönderme        | `{ roomId, studentId, answer, timeTaken }` |
| `quiz-started`         | Server → Client  | Quiz başladı          | `{ totalQuestions, currentQuestion }`      |
| `next-question-ready`  | Server → Client  | Yeni soru hazır       | `{ question, timeLimit }`                  |
| `question-time-up`     | Server → Client  | Süre doldu            | `{ correctAnswer }`                        |
| `show-leaderboard`     | Server → Client  | Liderlik tablosu      | `{ leaderboard }`                          |
| `quiz-ended`           | Server → Client  | Quiz bitti            | `{ finalResults }`                         |

### Öğretmen Olayları

| Olay                     | Yön              | Açıklama                     | Veri                    |
| ------------------------ | ---------------- | ------------------------------ | ------------------------ |
| `create-room`            | Client → Server  | Oda oluştur                   | `{ testId, teacherId }` |
| `room-created`           | Server → Client  | Oda oluşturuldu               | `{ roomCode, roomId }`  |
| `start-quiz`             | Client → Server  | Quizi başlat                  | `{ roomId }`             |
| `next-question`          | Client → Server  | Sonraki soru                  | `{ roomId }`             |
| `show-leaderboard`       | Client → Server  | Liderlik tablosu göster       | `{ roomId }`             |
| `end-quiz`               | Client → Server  | Quizi bitir                   | `{ roomId }`             |
| `student-list-updated`   | Server → Client  | Öğrenci listesi güncellendi   | `{ students }`           |
| `all-students-answered`  | Server → Client  | Tüm öğrenciler cevapladı      | `{ stats }`              |

---

## 🗄️ Veritabanı

Uygulama **SQLite** (`better-sqlite3`) kullanıyor — sıfır kurulum, tek dosya (`data/quizapp.db`). Kullanıcılar, kategoriler ve testler kalıcı olarak burada tutulur; `server.js`'teki tüm ilgili route'lar `database/db-helpers.js` üzerinden bu katmana yazıp okur (eskiden her istekte `data/*.json` dosyasının tamamını okuyup tekrar yazan `fs.readFileSync`/`writeFileSync` çağrıları vardı).

Canlı quiz odaları ve katılımcı durumu **bilinçli olarak** veritabanında değil — bunlar gerçek zamanlı, geçici oyun durumu olduğu için `server.js` içinde bellek içi (`Map`) olarak kalmaya devam ediyor. Bir oturum bittiğinde yalnızca özet istatistikler (`tests.totalPlays`, `totalStudents`, `averageScore`) kalıcı hale gelir.

- `database/schema.sql` — `users`, `categories`, `tests` tabloları
- `database/db-helpers.js` — veri erişim katmanı
- `database/migrate.js` — eski `data/*.json` dosyalarındaki kayıtları SQLite'a aktarır (idempotent, `npm run db:setup`)
- `config/database.js` — bağlantı (tek satır: `new Database('data/quizapp.db')`)

Kurulum adımları için **[DATABASE_SETUP.md](DATABASE_SETUP.md)** dosyasına bakın.

> Daha önce burada MSSQL hedeflenmişti (ayrı sunucu kurulumu, `mssql` paketi) ama `server.js` o katmana hiç bağlanmamıştı. Küçük, tek-sunuculu bir quiz uygulaması için gereksiz bir altyapı yüküydü; SQLite'a geçilerek migrasyon gerçekten tamamlandı.

---

## 🗺️ Yol Haritası

- [ ] Eşleştirme (`matching`) soru tipi implementasyonu
- [ ] Resimli soru desteği
- [ ] Excel'den toplu soru yükleme
- [ ] Detaylı analytics ve raporlama
- [ ] JWT authentication (şu an özel token üretimi kullanılıyor)
- [ ] Email bildirimleri
- [ ] Öğrenci hesapları ve geçmiş
- [ ] Özel tema desteği

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 🔗 İletişim ve Linkler

- 🌐 **Web Sitesi**: [https://www.halittiryaki.com/](https://www.halittiryaki.com/)
- 🐦 **X (Twitter)**: [@halittiryakicom](https://x.com/halittiryakicom)
- 📸 **Instagram**: [@halittiryakicom](https://instagram.com/halittiryakicom)
- 💼 **LinkedIn**: [in/halittiryaki](https://linkedin.com/in/halittiryaki)

---

<div align="center">

**⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın!**

Made with ❤️ by [Halit Tiryaki](https://www.halittiryaki.com)

</div>
