# 🎓 QUIZ APP - ODA TABANLI EŞ ZAMANLI SINAV SİSTEMİ

Modern, gerçek zamanlı online sınav ve quiz uygulaması. Öğretmenler oda oluşturabilir, öğrenciler davet kodu ile katılabilir ve hepsi aynı anda sınava girebilir!

## ✨ Özellikler

### 👨‍🏫 Öğretmen Paneli

- ✅ Oda oluşturma ve yönetme
- ✅ Kategori ve soru sayısı belirleme
- ✅ Davet kodu üretme
- ✅ Canlı katılımcı takibi
- ✅ Test başlatma kontrolü
- ✅ Gerçek zamanlı sonuç görüntüleme
- ✅ Performans analizi ve sıralama

### 🎓 Öğrenci Sistemi

- ✅ Davet kodu ile odaya katılım
- ✅ Bekleme ekranı
- ✅ Eş zamanlı test başlangıcı
- ✅ Zamanlayıcılı soru çözme
- ✅ Otomatik skor hesaplama
- ✅ Detaylı sonuç ekranı

### ⚡ Teknik Özellikler

- **Gerçek Zamanlı:** Socket.IO ile anında senkronizasyon
- **Eş Zamanlı:** Tüm öğrenciler aynı anda başlar
- **Güvenli:** Her oda için sabit soru seti
- **Responsive:** Mobil uyumlu tasarım
- **Modern:** Bootstrap 5 ve Font Awesome

## 🚀 Kurulum

### Gereksinimler

- Node.js (v14 veya üzeri)
- npm

### Adımlar

1. **Projeyi klonlayın**

```bash
git clone <repository-url>
cd quiz-app
```

2. **Bağımlılıkları yükleyin**

```bash
npm install
```

3. **Sunucuyu başlatın**

```bash
npm start
# veya
node server.js
```

4. **Tarayıcıda açın**

- Öğretmen Paneli: http://localhost:3000/teacher
- Öğrenci Sayfası: http://localhost:3000/
- Admin (Soru Yönetimi): http://localhost:3000/admin

## 📖 Kullanım Senaryosu

### 1. Öğretmen Oda Oluşturur

1. `/teacher` adresine gidin
2. Bilgileri doldurun:
   - Öğretmen Adı: "Ahmet Hoca"
   - Kategori: "C# Programlama"
   - Soru Sayısı: 10
   - Soru Başına Süre: 30 saniye
3. **"Oda Oluştur"** butonuna tıklayın
4. Davet kodu oluşturulur (Örn: **X7M2P**)

### 2. Öğrenciler Katılır

1. Öğrenciler `/` adresine girer
2. İsimlerini yazarlar
3. Öğretmenin verdiği kodu girerler: **X7M2P**
4. Bekleme ekranında öğretmenin testi başlatmasını beklerler

### 3. Test Başlar

1. Öğretmen katılan öğrencileri görür
2. **"Testi Başlat"** butonuna basar
3. TÜM öğrenciler aynı anda soruları görür
4. Zamanlayıcı otomatik başlar

### 4. Sonuçlar

- Her öğrenci testi bitirdiğinde kendi skorunu görür
- Öğretmen panelinde tüm sonuçlar anlık güncellenir
- Başarı sıralaması otomatik oluşturulur

## 📁 Proje Yapısı

```
quiz-app/
├── server.js                 # Socket.IO entegre backend
├── package.json              # Bağımlılıklar
├── data/
│   └── questions.json        # Soru bankası
└── public/
    ├── teacher.html          # Öğretmen paneli
    ├── index.html            # Öğrenci sayfası
    ├── admin.html            # Soru yönetimi
    ├── css/
    │   ├── teacher.css       # Öğretmen stilleri
    │   ├── admin.css         # Admin stilleri
    │   └── style.css         # Öğrenci stilleri
    └── js/
        ├── teacher.js        # Öğretmen panel mantığı
        ├── student.js        # Öğrenci mantığı
        ├── admin.js          # Soru yönetimi
        ├── quiz.js           # Quiz sınıfı
        ├── ui.js             # UI yardımcıları
        └── question.js       # Soru sınıfı
```

## 🎮 Ekran Görüntüleri

### Öğretmen Paneli

- Oda oluşturma formu
- Davet kodu gösterimi (gradient tasarım)
- Canlı katılımcı listesi
- Test başlatma butonu
- Gerçek zamanlı sonuç tablosu

### Öğrenci Ekranı

- Davet kodu giriş ekranı
- Bekleme ekranı
- Soru çözme ekranı (zamanlayıcılı)
- Sonuç ekranı (detaylı istatistikler)

## 🔧 Teknolojiler

- **Backend:** Node.js, Express.js
- **Gerçek Zamanlı İletişim:** Socket.IO
- **Frontend:** Vanilla JavaScript, Bootstrap 5
- **İkonlar:** Font Awesome 6
- **Veri Depolama:** JSON dosya (geliştirilebilir)

## 🌟 Öne Çıkan Özellikler

### Gerçek Zamanlı Senkronizasyon

Socket.IO sayesinde tüm işlemler anlık:

- Öğrenci katılımları
- Test başlatma
- Cevap gönderimi
- Sonuç güncelleme

### Eş Zamanlı Test Başlatma

Öğretmen "Başlat" dediğinde TÜM öğrenciler aynı anda:

- Aynı soruları
- Aynı sırayla
- Aynı sürede çözerler

### Otomatik Skor Hesaplama

Sunucu tarafında:

- Doğru/yanlış sayma
- Yüzde hesaplama
- Süre kaydı
- Sıralama

## 🔮 Gelecek Geliştirmeler

- [ ] Veritabanı entegrasyonu (MongoDB)
- [ ] Kullanıcı hesapları ve kimlik doğrulama
- [ ] Kategori bazlı filtreleme
- [ ] Oda geçmişi ve raporlama
- [ ] Excel/PDF export
- [ ] Detaylı soru analizi
- [ ] Grafik ve istatistikler
- [ ] Çoklu oda yönetimi
- [ ] Soru havuzu kategorilendirme
- [ ] Öğrenci performans takibi

## 📝 Lisans

MIT License

## 👨‍💻 Geliştirici

Quiz App - Oda Tabanlı Sınav Sistemi

---

**Not:** Bu sistem eğitim amaçlı geliştirilmiştir. Gerçek kullanım için ek güvenlik önlemleri ve veritabanı entegrasyonu önerilir.

## 🆘 Destek

Sorun bildirmek veya öneride bulunmak için:

- Issue açın
- Pull request gönderin

---

**Başarılı Sınavlar! 🎓✨**
