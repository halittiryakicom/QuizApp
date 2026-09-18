-- ==========================================
-- QUIZ APP - SQLite VERİTABANI ŞEMASI
-- ==========================================
-- server.js'in şu an gerçekten kalıcı olarak sakladığı üç varlığı
-- birebir yansıtır: kullanıcılar (öğretmen hesapları), kategoriler ve
-- testler (sorular gömülü JSON olarak). Canlı quiz odaları / katılımcı
-- durumu bilinçli olarak burada yok — bunlar gerçek zamanlı, geçici
-- oyun durumu ve server.js'te bellek içi (in-memory) Map olarak kalmaya
-- devam ediyor; her socket olayını veritabanına yazmak gereksiz yazma
-- yükü ve karmaşıklık getirirdi.

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,          -- bcrypt hash
    role TEXT NOT NULL DEFAULT 'teacher',
    token TEXT,                      -- basit oturum token'ı (bkz. server.js authenticateTeacher)
    createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    lastLogin TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updatedAt TEXT
);

CREATE TABLE IF NOT EXISTS tests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,                   -- kategori adı (categories.name); serbest metin olarak kalır,
                                      -- tıpkı eski tests.json'daki gibi — testin kategorisi silinse
                                      -- bile test bozulmaz.
    timePerQuestion INTEGER NOT NULL DEFAULT 30,
    questions TEXT NOT NULL,         -- soru dizisi, JSON metni olarak (tip, seçenekler, doğru cevap, görsel...)
    createdBy TEXT,                  -- users.id (öğretmen), anonim ise NULL
    playCount INTEGER NOT NULL DEFAULT 0,
    totalPlays INTEGER NOT NULL DEFAULT 0,
    totalStudents INTEGER NOT NULL DEFAULT 0,
    averageScore REAL NOT NULL DEFAULT 0,
    completionRate REAL NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updatedAt TEXT,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tests_category ON tests(category);
CREATE INDEX IF NOT EXISTS idx_tests_createdBy ON tests(createdBy);
