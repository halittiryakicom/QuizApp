/**
 * JSON -> SQLite migrasyonu.
 *
 * data/users.json, data/categories.json ve data/tests.json içindeki mevcut
 * kayıtları yeni SQLite veritabanına (data/quizapp.db) aktarır. Idempotent'tir:
 * zaten var olan id'ler `INSERT OR IGNORE` ile atlanır, tekrar çalıştırmak
 * güvenlidir.
 *
 * Kullanım:
 *   node database/migrate.js          -> şemayı oluştur + JSON verisini aktar
 *   node database/migrate.js schema   -> yalnızca şemayı oluştur
 *   node database/migrate.js migrate  -> yalnızca veri aktar (şema zaten var olmalı)
 */
const fs = require('fs');
const path = require('path');
const { getDb } = require('../config/database');
const { ensureSchema } = require('./db-helpers');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readJson(fileName, fallback) {
    const filePath = path.join(DATA_DIR, fileName);
    if (!fs.existsSync(filePath)) return fallback;
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
        console.warn(`⚠️  ${fileName} okunamadı/parse edilemedi, atlanıyor:`, err.message);
        return fallback;
    }
}

function migrateUsers(db) {
    const users = readJson('users.json', []);
    const insert = db.prepare(`
        INSERT OR IGNORE INTO users (id, fullName, username, password, role, token, createdAt, lastLogin)
        VALUES (@id, @fullName, @username, @password, @role, @token, @createdAt, @lastLogin)
    `);
    let count = 0;
    for (const u of users) {
        insert.run({
            id: u.id,
            fullName: u.fullName || '',
            username: u.username,
            password: u.password,
            role: u.role || 'teacher',
            token: u.token || null,
            createdAt: u.createdAt || new Date().toISOString(),
            lastLogin: u.lastLogin || null,
        });
        count++;
    }
    console.log(`✅ ${count} kullanıcı aktarıldı (data/users.json)`);
}

function migrateCategories(db) {
    const categories = readJson('categories.json', []);
    const insert = db.prepare(`
        INSERT OR IGNORE INTO categories (id, name, createdAt, updatedAt)
        VALUES (@id, @name, @createdAt, @updatedAt)
    `);
    let count = 0;
    for (const c of categories) {
        insert.run({
            id: c.id,
            name: c.name,
            createdAt: c.createdAt || new Date().toISOString(),
            updatedAt: c.updatedAt || null,
        });
        count++;
    }
    console.log(`✅ ${count} kategori aktarıldı (data/categories.json)`);
}

function migrateTests(db) {
    const tests = readJson('tests.json', []);
    const insert = db.prepare(`
        INSERT OR IGNORE INTO tests
            (id, title, description, category, timePerQuestion, questions, createdBy,
             playCount, totalPlays, totalStudents, averageScore, completionRate, createdAt, updatedAt)
        VALUES
            (@id, @title, @description, @category, @timePerQuestion, @questions, @createdBy,
             @playCount, @totalPlays, @totalStudents, @averageScore, @completionRate, @createdAt, @updatedAt)
    `);
    let count = 0;
    for (const t of tests) {
        const stats = t.statistics || {};
        insert.run({
            id: t.id,
            title: t.title,
            description: t.description || null,
            category: t.category || null,
            timePerQuestion: t.timePerQuestion || 30,
            questions: JSON.stringify(t.questions || []),
            createdBy: t.createdBy || null,
            playCount: t.playCount || 0,
            totalPlays: stats.totalPlays || 0,
            totalStudents: stats.totalStudents || 0,
            averageScore: stats.averageScore || 0,
            completionRate: stats.completionRate || 0,
            createdAt: t.createdAt || new Date().toISOString(),
            updatedAt: t.updatedAt || null,
        });
        count++;
    }
    console.log(`✅ ${count} test aktarıldı (data/tests.json)`);
}

function main() {
    const mode = process.argv[2] || 'full';
    const db = getDb();

    if (mode === 'schema' || mode === 'full') {
        ensureSchema();
        console.log('✅ Şema hazır (data/quizapp.db)');
    }

    if (mode === 'migrate' || mode === 'full') {
        const migrateAll = db.transaction(() => {
            migrateUsers(db);
            migrateCategories(db);
            migrateTests(db);
        });
        migrateAll();
    }

    console.log('🎉 Migrasyon tamamlandı.');
}

if (require.main === module) {
    main();
}

module.exports = { migrateUsers, migrateCategories, migrateTests };
