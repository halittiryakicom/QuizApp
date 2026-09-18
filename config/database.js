const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
require('dotenv').config();

// SQLite veritabanı konfigürasyonu.
//
// Daha önce burada bir MSSQL bağlantı havuzu vardı (bkz. DATABASE_SETUP.md,
// database/schema.sql). Küçük, tek-sunuculu bir quiz uygulaması için ayrı bir
// SQL Server kurulumu gerektirmesi gereksiz bir altyapı yüküydü — server.js
// de zaten hiç bağlanmıyordu. Sıfır kurulum gerektiren SQLite'a geçildi;
// tüm veri tek bir dosyada (data/quizapp.db) tutuluyor.
const DB_PATH = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(__dirname, '..', 'data', 'quizapp.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let db;

/**
 * Tekil (singleton) veritabanı bağlantısını döner; ilk çağrıda açar.
 */
const getDb = () => {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
    }
    return db;
};

/**
 * Veritabanı bağlantısını kapatır (testler / graceful shutdown için).
 */
const closeDb = () => {
    if (db) {
        db.close();
        db = null;
    }
};

module.exports = {
    getDb,
    closeDb,
    DB_PATH,
};
