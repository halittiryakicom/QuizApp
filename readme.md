# 🎓 Quiz App - İnteraktif Quiz Uygulaması

Modern, gerçek zamanlı ve kullanıcı dostu bir quiz uygulaması. Öğretmenler test oluşturabilir, öğrenciler canlı olarak testlere katılabilir ve sonuçları anlık olarak takip edebilir.

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
- [Ekran Görüntüleri](#-ekran-görüntüleri)
- [Katkıda Bulunma](#-katkıda-bulunma)
- [Lisans](#-lisans)
- [İletişim](#-iletişim-ve-linkler)

---

## ✨ Özellikler

### 🎯 Genel Özellikler

- ✅ **Gerçek Zamanlı İletişim**: Socket.IO ile canlı sınav deneyimi
- ✅ **Kullanıcı Yönetimi**: Öğretmen kaydı ve giriş sistemi (bcrypt ile şifreli)
- ✅ **Oda Sistemi**: Benzersiz oda kodları ile öğrenci katılımı
- ✅ **Responsive Tasarım**: Mobil, tablet ve desktop uyumlu arayüz
- ✅ **Otomatik Puanlama**: Anlık puan hesaplama ve sıralama

### 👨‍🏫 Öğretmen Özellikleri

- 📝 **Test Oluşturma**: 4 farklı soru tipi desteği
  - Çoktan Seçmeli
  - Doğru/Yanlış
  - Boşluk Doldurma
  - Eşleştirme (yakında)
- 🎨 **Özelleştirilebilir Testler**: Soru başına süre ayarlama
- 📊 **Canlı İzleme**: Öğrenci katılımını ve cevapları gerçek zamanlı görüntüleme
- 🏆 **Liderlik Tablosu Kontrolü**: Sıralamayı istediğiniz zaman gösterme
- 📈 **Detaylı Raporlar**: Test sonuçları ve öğrenci performans analizi
- 🔐 **Güvenli Giriş**: Token tabanlı kimlik doğrulama

### 👨‍🎓 Öğrenci Özellikleri

- 🚀 **Kolay Katılım**: 5 haneli oda kodu ile hızlı bağlanma
- ⏱️ **Zamanlayıcı**: Her soru için görsel geri sayım
- 🎯 **Çeşitli Soru Tipleri**: Farklı formatlarda soruları yanıtlama
- 🏅 **Anlık Sonuçlar**: Quiz bitiminde detaylı performans görüntüleme
- 📊 **Liderlik Tablosu**: Sıralamada yerinizi görme
- 💡 **Kullanıcı Dostu Arayüz**: Sade ve anlaşılır tasarım

### 🔧 Admin Özellikleri

- 👥 **Kullanıcı Yönetimi**: Öğretmen hesaplarını yönetme
- 🔑 **Şifre Sıfırlama**: Admin panelinden şifre değiştirme
- 📋 **Test Yönetimi**: Tüm testleri görüntüleme ve düzenleme

---

## 🛠️ Teknolojiler

### Backend

- **Node.js**: v14.x veya üzeri
- **Express.js**: Web framework
- **Socket.IO**: Gerçek zamanlı çift yönlü iletişim
- **bcrypt**: Şifre hashleme ve güvenlik
- **File System (fs)**: JSON dosya tabanlı veri saklama

### Frontend

- **HTML5**: Semantic markup
- **CSS3**: Modern styling
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

```
http://localhost:3000
```

---

## 🎮 Kullanım

### Öğretmen İşlemleri

#### 1. Kayıt Olma ve Giriş

- `/login` adresine gidin
- "Kayıt Ol" sekmesinden hesap oluşturun
- Giriş yapın

#### 2. Test Oluşturma

- `/create-test` sayfasına gidin
- Test bilgilerini doldurun:
  - Başlık
  - Açıklama
  - Kategori
  - Soru başına süre (saniye)
- Soru ekle menüsünden soru tipi seçin
- Soruları ekleyin ve kaydedin

#### 3. Oda Açma ve Quiz Başlatma

- `/teacher` paneline gidin
- Bir test seçin
- "Oda Aç" butonuna tıklayın
- 5 haneli oda kodunu öğrencilerle paylaşın
- Öğrenciler katıldıkça listeyi görün
- "Quizi Başlat" butonuna tıklayın
- Soruları ilerletin ve liderlik tablosunu gösterin

### Öğrenci İşlemleri

#### 1. Odaya Katılma

- Ana sayfaya (`/`) gidin
- Adınızı girin
- Öğretmenin verdiği 5 haneli kodu girin
- "Odaya Katıl" butonuna tıklayın

#### 2. Quiz'e Katılma

- Öğretmen quizi başlatana kadar bekleyin
- Sorular geldiğinde cevaplarınızı işaretleyin
- Zamanlayıcıya dikkat edin
- Quiz bitiminde sonuçlarınızı görün

---

## 📁 Proje Yapısı

```
QuizApp/
│
├── 📂 data/                      # JSON veri dosyaları
│   ├── questions.json            # Sorular (eski sistem)
│   ├── tests.json                # Oluşturulan testler
│   └── users.json                # Kullanıcı bilgileri
│
├── 📂 public/                    # Frontend dosyaları
│   ├── 📂 css/                   # Stil dosyaları
│   │   ├── admin.css
│   │   ├── style.css
│   │   └── teacher.css
│   │
│   ├── 📂 js/                    # JavaScript dosyaları
│   │   ├── admin.js              # Admin paneli logic
│   │   ├── create-test.js        # Test oluşturma logic
│   │   ├── login.js              # Giriş/Kayıt logic
│   │   ├── student.js            # Öğrenci logic
│   │   ├── teacher.js            # Öğretmen paneli logic
│   │   ├── quiz.js               # Quiz engine
│   │   └── ui.js                 # UI yardımcıları
│   │
│   ├── admin.html                # Admin paneli
│   ├── create-test.js            # Test oluşturma sayfası
│   ├── index.html                # Öğrenci ana sayfası
│   ├── login.html                # Giriş/Kayıt sayfası
│   └── teacher.html              # Öğretmen paneli
│
├── server.js                     # Express ve Socket.IO server
├── package.json                  # Proje bağımlılıkları
└── README.md                     # Proje dokümantasyonu
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

**Headers:**

```
Authorization: token_xxx
```

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

**Headers:**

```
Authorization: token_xxx
```

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

**Headers:**

```
Authorization: token_xxx
```

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

| Olay                  | Yön             | Açıklama             | Veri                                       |
| --------------------- | --------------- | -------------------- | ------------------------------------------ |
| `join-room`           | Client → Server | Odaya katılma isteği | `{ roomCode, studentName }`                |
| `student-joined`      | Server → Client | Katılım başarılı     | `{ roomId, studentId, students }`          |
| `join-error`          | Server → Client | Katılım hatası       | `{ message }`                              |
| `submit-answer`       | Client → Server | Cevap gönderme       | `{ roomId, studentId, answer, timeTaken }` |
| `quiz-started`        | Server → Client | Quiz başladı         | `{ totalQuestions, currentQuestion }`      |
| `next-question-ready` | Server → Client | Yeni soru hazır      | `{ question, timeLimit }`                  |
| `question-time-up`    | Server → Client | Süre doldu           | `{ correctAnswer }`                        |
| `show-leaderboard`    | Server → Client | Liderlik tablosu     | `{ leaderboard }`                          |
| `quiz-ended`          | Server → Client | Quiz bitti           | `{ finalResults }`                         |

### Öğretmen Olayları

| Olay                    | Yön             | Açıklama                    | Veri                    |
| ----------------------- | --------------- | --------------------------- | ----------------------- |
| `create-room`           | Client → Server | Oda oluştur                 | `{ testId, teacherId }` |
| `room-created`          | Server → Client | Oda oluşturuldu             | `{ roomCode, roomId }`  |
| `start-quiz`            | Client → Server | Quizi başlat                | `{ roomId }`            |
| `next-question`         | Client → Server | Sonraki soru                | `{ roomId }`            |
| `show-leaderboard`      | Client → Server | Liderlik tablosu göster     | `{ roomId }`            |
| `end-quiz`              | Client → Server | Quizi bitir                 | `{ roomId }`            |
| `student-list-updated`  | Server → Client | Öğrenci listesi güncellendi | `{ students }`          |
| `all-students-answered` | Server → Client | Tüm öğrenciler cevapladı    | `{ stats }`             |

---

## 📸 Ekran Görüntüleri

### Öğrenci Arayüzü

- Oda katılım ekranı
- Quiz ekranı
- Liderlik tablosu

### Öğretmen Paneli

- Test listesi
- Oda yönetimi
- Canlı izleme ekranı

### Test Oluşturma

- Soru ekleme arayüzü
- Farklı soru tipleri

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen aşağıdaki adımları izleyin:

1. Bu repository'yi fork edin
2. Feature branch'i oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

### Geliştirme Yol Haritası

- [ ] Eşleştirme soru tipi implementasyonu
- [ ] Resimli soru desteği
- [ ] Excel'den toplu soru yükleme
- [ ] Detaylı analytics ve raporlama
- [ ] MongoDB entegrasyonu
- [ ] JWT authentication
- [ ] Email bildirimleri
- [ ] Öğrenci hesapları ve geçmiş
- [ ] Özel tema desteği

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 🔗 İletişim ve Linkler

Aşağıdaki kanallar üzerinden bana ulaşabilirsiniz:

- 🌐 **Web Sitesi**: [https://www.halittiryaki.com/](https://www.halittiryaki.com/)
- 🐦 **X (Twitter)**: [@halittiryakicom](https://x.com/halittiryakicom)
- 📸 **Instagram**: [@halittiryakicom](https://instagram.com/halittiryakicom)
- 💼 **LinkedIn**: [in/halittiryaki](https://linkedin.com/in/halittiryaki)

---

<div align="center">

**⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın!**

Made with ❤️ by [Halit Tiryaki](https://www.halittiryaki.com)

</div>
