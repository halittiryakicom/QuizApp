# 🗄️ Veritabanı Kurulum Rehberi

Uygulama **SQLite** kullanıyor — ayrı bir veritabanı sunucusu kurmanıza gerek yok. Tüm veri tek bir dosyada tutulur: `data/quizapp.db`.

> **Not:** Bu proje eskiden MSSQL (SQL Server) hedefliyordu — `mssql` npm paketi, ayrı bir sunucu kurulumu, mixed-mode kimlik doğrulama vb. Küçük, tek-sunuculu bir quiz uygulaması için bu gereksiz bir altyapı yüküydü, üstelik `server.js` o katmana hiç bağlanmamıştı. SQLite'a geçildi: sıfır kurulum, tek dosya, `better-sqlite3` ile senkron ve hızlı.

---

## 🚀 Kurulum

### 1. Bağımlılıkları yükle

```bash
npm install
```

### 2. Şemayı oluştur + mevcut JSON verisini aktar

`data/users.json`, `data/categories.json` ve `data/tests.json` içindeki kayıtlar varsa otomatik aktarılır (idempotent — tekrar çalıştırmak güvenlidir):

```bash
npm run db:setup
```

Alternatif komutlar:

```bash
npm run db:schema    # yalnızca tabloları oluştur
npm run db:migrate   # yalnızca JSON -> SQLite veri aktarımı
npm run db:test      # bağlantıyı doğrula
```

### 3. Uygulamayı başlat

```bash
npm start
# veya geliştirme modu:
npm run dev
```

İlk istekte şema zaten yoksa otomatik oluşturulur (`database/db-helpers.js` içindeki `ensureSchema()`), yani `db:setup` adımını atlarsanız bile uygulama çalışır — sadece eski JSON verileriniz varsa onları elle aktarmanız gerekir (`npm run db:migrate`).

---

## 📊 Veritabanı Yapısı

`database/schema.sql` üç tablo tanımlar — server.js'in gerçekten kalıcı olarak sakladığı üç varlık:

| Tablo | İçerik |
|---|---|
| `users` | Öğretmen hesapları (id, fullName, username, password hash, role, token, createdAt, lastLogin) |
| `categories` | Test kategorileri (id, name, createdAt, updatedAt) |
| `tests` | Testler — sorular `questions` sütununda JSON metni olarak gömülü (eski `tests.json`'daki gibi) |

**Bilinçli olarak burada olmayan:** canlı quiz odaları / katılımcı durumu. Bunlar gerçek zamanlı, geçici oyun durumu olduğu için `server.js` içinde bellek içi (`Map`) olarak kalıyor — her socket olayını veritabanına yazmak gereksiz yazma yükü getirir. Bir test bittiğinde yalnızca özet istatistikler (`tests.totalPlays`, `totalStudents`, `averageScore`) kalıcı hale gelir.

---

## 🔍 Veritabanını İnceleme

SQLite CLI'niz varsa:

```bash
sqlite3 data/quizapp.db "SELECT username, role FROM users;"
sqlite3 data/quizapp.db "SELECT title, playCount, averageScore FROM tests;"
```

Ya da Node ile:

```bash
node -e "const {getDb}=require('./config/database'); console.log(getDb().prepare('SELECT * FROM tests').all());"
```

---

## ⚙️ Konfigürasyon

`.env` dosyasında (opsiyonel, `.env.example`'ı kopyalayın):

```env
PORT=3000
NODE_ENV=development
# DB_PATH=./data/quizapp.db   # varsayılan zaten bu
```

---

## 🔐 Güvenlik Notları

- `data/quizapp.db` gerçek kullanıcı şifre hash'leri içerir — `.gitignore`'da, asla commit edilmez.
- Eski `data/users.json` de aynı sebeple `.gitignore`'dadır; `data/tests.json`/`categories.json` içerik olarak hassas değildir ama artık kullanılmıyor (referans/yedek olarak kalabilir).
