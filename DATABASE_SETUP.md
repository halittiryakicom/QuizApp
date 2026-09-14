# 🗄️ MSSQL Veritabanı Kurulum Rehberi

## 📋 Gereksinimler

- **SQL Server** (2017 veya üzeri)
  - SQL Server Express (Ücretsiz)
  - SQL Server Developer Edition (Ücretsiz)
  - Azure SQL Database
- **Node.js** (v14 veya üzeri)
- **npm** veya **yarn**

---

## 🚀 Kurulum Adımları

### 1. SQL Server Kurulumu

#### Windows Yerel Kurulum

1. **SQL Server Express** indir:
   - https://www.microsoft.com/sql-server/sql-server-downloads
   - "Express" versiyonunu seç

2. Kurulum sırasında:
   - **Mixed Mode Authentication** seçin
   - `sa` kullanıcısı için güçlü bir şifre belirleyin
   - SQL Server Browser'ı etkinleştirin

3. **SQL Server Management Studio (SSMS)** indir (Opsiyonel):
   - https://docs.microsoft.com/sql/ssms/download-sql-server-management-studio-ssms

#### Docker ile Kurulum

```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrongPassword123!" \
   -p 1433:1433 --name sqlserver \
   -d mcr.microsoft.com/mssql/server:2022-latest
```

#### Azure SQL Database

1. Azure Portal'da SQL Database oluşturun
2. Bağlantı bilgilerini not edin
3. Firewall'da IP adresinizi ekleyin

---

### 2. Proje Bağımlılıklarını Yükle

```bash
npm install
```

Yeni eklenen paketler:
- `mssql` - Microsoft SQL Server client
- `dotenv` - Çevre değişkenleri yönetimi

---

### 3. Veritabanı Konfigürasyonu

#### `.env` Dosyasını Düzenle

`.env.example` dosyasını `.env` olarak kopyalayın:

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:

```env
# MSSQL Database Configuration
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=QuizAppDB
DB_USER=sa
DB_PASSWORD=YourStrongPassword123!
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
```

**Azure SQL Database için:**

```env
DB_SERVER=your-server.database.windows.net
DB_DATABASE=QuizAppDB
DB_USER=your-username
DB_PASSWORD=your-password
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false
```

---

### 4. Veritabanını Oluştur

#### Opsiyon A: SSMS ile Manuel Oluşturma

1. SQL Server Management Studio'yu açın
2. Sunucuya bağlanın
3. Yeni sorgu açın ve çalıştırın:

```sql
CREATE DATABASE QuizAppDB;
GO
```

#### Opsiyon B: Komut Satırından

```bash
# sqlcmd yüklü ise (SQL Server Tools)
sqlcmd -S localhost -U sa -P YourStrongPassword123! -Q "CREATE DATABASE QuizAppDB"
```

---

### 5. Tam Kurulum (Schema + Migration)

Tüm tabloları oluşturup JSON verilerini aktarın:

```bash
node database/migrate.js full
```

Bu komut:
- ✅ Tüm tabloları oluşturur
- ✅ View'ları ve stored procedure'ları ekler
- ✅ JSON dosyalarındaki kategorileri aktarır
- ✅ JSON dosyalarındaki soruları aktarır
- ✅ JSON dosyalarındaki testleri aktarır

---

## 🔧 Alternatif Kurulum Komutları

### Sadece Schema Oluştur

```bash
node database/migrate.js schema
```

### Sadece Veri Migration

```bash
node database/migrate.js migrate
```

---

## 📊 Veritabanı Yapısı

### Tablolar

1. **Users** - Kullanıcılar (öğrenci, öğretmen, admin)
2. **Categories** - Soru kategorileri
3. **Questions** - Sorular
4. **QuestionOptions** - Soru seçenekleri
5. **Tests** - Testler
6. **TestQuestions** - Test-Soru ilişkisi
7. **QuizSessions** - Quiz oturumları (odalar)
8. **QuizParticipants** - Katılımcılar
9. **QuizAnswers** - Verilen cevaplar
10. **QuestionStatistics** - Soru istatistikleri

### View'lar

- `vw_TestStatistics` - Test istatistikleri özeti
- `vw_UserPerformance` - Kullanıcı performans özeti

### Stored Procedures

- `sp_UpdateTestStatistics` - Test istatistiklerini günceller
- `sp_UpdateQuestionStatistics` - Soru istatistiklerini günceller

---

## 🧪 Veritabanı Bağlantısını Test Et

```bash
node -e "require('./config/database').testConnection()"
```

Beklenen çıktı:
```
✅ MSSQL veritabanı bağlantı havuzu oluşturuldu
✅ MSSQL Bağlantı Testi Başarılı
📊 SQL Server Version: Microsoft SQL Server 2022...
```

---

## 🏃 Uygulamayı Başlat

```bash
npm start
```

veya geliştirme modu için:

```bash
npm run dev
```

---

## 📝 Örnek Veri Ekleme

Schema içinde bazı örnek veriler otomatik eklenir:
- Admin kullanıcısı (username: admin, email: admin@quizapp.com)
- 8 kategori (Genel Kültür, Bilim, Tarih, vb.)

Migration çalıştığında mevcut JSON dosyalarındaki tüm veriler aktarılır.

---

## 🔍 Veritabanını İnceleme

### SSMS ile

1. Object Explorer'da `QuizAppDB` veritabanını genişlet
2. Tables altında tabloları görüntüle
3. Sağ tık -> "Select Top 1000 Rows"

### Sorgu ile

```sql
-- Kategori sayısı
SELECT COUNT(*) as TotalCategories FROM Categories;

-- Soru sayısı
SELECT COUNT(*) as TotalQuestions FROM Questions;

-- Test sayısı
SELECT COUNT(*) as TotalTests FROM Tests;

-- Test istatistikleri
SELECT * FROM vw_TestStatistics;

-- Kullanıcı performansı
SELECT * FROM vw_UserPerformance;
```

---

## 🔐 Güvenlik Notları

1. **Şifreleri güvenli tutun**
   - `.env` dosyası `.gitignore`'a eklenmiştir
   - Production'da güçlü şifreler kullanın

2. **Firewall ayarları**
   - SQL Server sadece gerekli IP'lere açık olmalı
   - Azure'da IP whitelist kullanın

3. **SSL/TLS**
   - Production'da `DB_ENCRYPT=true` kullanın
   - Yerel geliştirmede `DB_TRUST_SERVER_CERTIFICATE=true` olabilir

---

## 🐛 Sorun Giderme

### Bağlantı Hatası: "Login failed"

- SQL Server Mixed Mode Authentication etkin mi?
- `sa` kullanıcısı aktif mi?
- Şifre doğru mu?

```sql
-- SQL Server'da çalıştır
ALTER LOGIN sa ENABLE;
GO
ALTER LOGIN sa WITH PASSWORD = 'YourNewPassword123!';
GO
```

### Bağlantı Hatası: "Server not found"

- SQL Server Browser servisi çalışıyor mu?
- TCP/IP protokolü etkin mi?
- Port 1433 açık mı?

```bash
# Windows Services'de kontrol et
services.msc
# SQL Server Browser servisini başlat
```

### Migration Hatası: "Database does not exist"

Önce veritabanını oluşturun:

```bash
node -e "require('mssql').connect(require('./config/database').config).then(pool => pool.request().query('CREATE DATABASE QuizAppDB')).then(() => console.log('Veritabanı oluşturuldu')).catch(console.error)"
```

---

## 📚 Kaynaklar

- [MSSQL Node.js Driver](https://github.com/tediousjs/node-mssql)
- [SQL Server Express Download](https://www.microsoft.com/sql-server/sql-server-downloads)
- [Azure SQL Database](https://azure.microsoft.com/services/sql-database/)
- [SQL Server Configuration Manager](https://docs.microsoft.com/sql/relational-databases/sql-server-configuration-manager)

---

## ✅ Sonraki Adımlar

1. ✅ Veritabanı kurulumu tamamlandı
2. 🔄 `server.js`'i MSSQL kullanacak şekilde güncelleyin
3. 🧪 API endpoint'lerini test edin
4. 🌐 Uygulamayı başlatın

**Migration başarılı olduysa artık JSON dosyaları yerine MSSQL kullanılıyor! 🎉**
