/**
 * SQLite veri erişim katmanı.
 *
 * server.js'te daha önce her okuma/yazma `fs.readFileSync` /
 * `fs.writeFileSync` ile data/*.json dosyalarının TAMAMINI diskten
 * okuyup tekrar yazıyordu. Bu katman aynı davranışı (aynı alan adları,
 * aynı dönüş şekilleri) korur ama artık gerçek SQL sorguları + SQLite'ın
 * kendi eşzamanlılık kontrolü üzerinden çalışır.
 *
 * better-sqlite3 senkron çalışır — server.js'teki route'lar zaten senkron
 * fs çağrıları kullanıyordu, o yüzden async/await eklemeye gerek yok.
 */
const { getDb } = require('../config/database');
const fs = require('fs');
const path = require('path');

let schemaEnsured = false;
function ensureSchema() {
    if (schemaEnsured) return;
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    getDb().exec(schemaSql);
    schemaEnsured = true;
}

// ==================== KULLANICILAR ====================

function getAllUsers() {
    ensureSchema();
    return getDb().prepare('SELECT * FROM users ORDER BY createdAt ASC').all();
}

function getUserByUsername(username) {
    ensureSchema();
    return getDb().prepare('SELECT * FROM users WHERE username = ?').get(username);
}

function getUserByToken(token) {
    ensureSchema();
    if (!token) return undefined;
    return getDb().prepare('SELECT * FROM users WHERE token = ?').get(token);
}

function createUser({ id, fullName, username, password, role = 'teacher' }) {
    ensureSchema();
    getDb()
        .prepare(
            `INSERT INTO users (id, fullName, username, password, role, createdAt)
             VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
        )
        .run(id, fullName, username, password, role);
    return getUserByUsername(username);
}

function setUserLoginToken(userId, token) {
    ensureSchema();
    getDb()
        .prepare(
            `UPDATE users SET token = ?, lastLogin = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`
        )
        .run(token, userId);
}

function resetUserPassword(username, hashedPassword) {
    ensureSchema();
    const info = getDb()
        .prepare('UPDATE users SET password = ?, token = NULL WHERE username = ?')
        .run(hashedPassword, username);
    return info.changes > 0;
}

// ==================== KATEGORİLER ====================

function getAllCategories() {
    ensureSchema();
    return getDb().prepare('SELECT * FROM categories ORDER BY createdAt ASC').all();
}

function getCategoryById(id) {
    ensureSchema();
    return getDb().prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

function categoryNameExists(name, excludeId = null) {
    ensureSchema();
    const row = excludeId
        ? getDb()
              .prepare('SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?')
              .get(name, excludeId)
        : getDb().prepare('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)').get(name);
    return !!row;
}

function createCategory({ id, name }) {
    ensureSchema();
    getDb()
        .prepare(
            `INSERT INTO categories (id, name, createdAt) VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
        )
        .run(id, name);
    return getCategoryById(id);
}

function updateCategoryName(id, name) {
    ensureSchema();
    getDb()
        .prepare(
            `UPDATE categories SET name = ?, updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`
        )
        .run(name, id);
    return getCategoryById(id);
}

function deleteCategory(id) {
    ensureSchema();
    const info = getDb().prepare('DELETE FROM categories WHERE id = ?').run(id);
    return info.changes > 0;
}

// ==================== TESTLER ====================
// `questions` sütunu JSON metni olarak saklanır; satırı okuyan her
// fonksiyon onu geri diziye çevirir ki server.js'teki route'lar hiçbir
// fark görmesin (tıpkı eski tests.json'dan JSON.parse etmek gibi).

function rowToTest(row) {
    if (!row) return row;
    // public/admin.html okurken `test.statistics?.totalStudents` gibi iç içe
    // bir şekil bekliyor (eski tests.json'daki gibi) — düz sütunları geri
    // aynı şekle sarıyoruz ki frontend'de hiçbir değişiklik gerekmesin.
    return {
        ...row,
        questions: JSON.parse(row.questions),
        statistics: {
            totalPlays: row.totalPlays,
            totalStudents: row.totalStudents,
            averageScore: row.averageScore,
            completionRate: row.completionRate,
        },
    };
}

function getAllTests() {
    ensureSchema();
    return getDb().prepare('SELECT * FROM tests ORDER BY createdAt DESC').all().map(rowToTest);
}

function getTestById(id) {
    ensureSchema();
    return rowToTest(getDb().prepare('SELECT * FROM tests WHERE id = ?').get(id));
}

function createTest({ id, title, description, category, timePerQuestion, questions, createdBy = null }) {
    ensureSchema();
    getDb()
        .prepare(
            `INSERT INTO tests (id, title, description, category, timePerQuestion, questions, createdBy, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
        )
        .run(id, title, description || null, category || null, timePerQuestion || 30, JSON.stringify(questions || []), createdBy);
    return getTestById(id);
}

/**
 * Kısmi güncelleme yapar — verilmeyen alanlar dokunulmadan kalır
 * (eski `{ ...oldTest, ...req.body }` davranışıyla aynı).
 */
function updateTest(id, patch) {
    ensureSchema();
    const existing = getTestById(id);
    if (!existing) return null;

    const merged = { ...existing, ...patch };
    getDb()
        .prepare(
            `UPDATE tests SET title = ?, description = ?, category = ?, timePerQuestion = ?, questions = ?,
                updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
             WHERE id = ?`
        )
        .run(
            merged.title,
            merged.description || null,
            merged.category || null,
            merged.timePerQuestion || 30,
            JSON.stringify(merged.questions || []),
            id
        );
    return getTestById(id);
}

function deleteTest(id) {
    ensureSchema();
    const info = getDb().prepare('DELETE FROM tests WHERE id = ?').run(id);
    return info.changes > 0;
}

function countTestsByCategory(categoryName) {
    ensureSchema();
    const row = getDb()
        .prepare('SELECT COUNT(*) AS n FROM tests WHERE category = ?')
        .get(categoryName);
    return row.n;
}

/**
 * Quiz oturumu bittiğinde test istatistiklerini günceller — server.js'teki
 * updateTestStatistics() ile birebir aynı hesaplama, sadece SQL UPDATE'e
 * yazıyor.
 */
function recordTestSessionStatistics(testId, roomResults) {
    ensureSchema();
    const test = getTestById(testId);
    if (!test) return;

    const previousTotalPlays = test.totalPlays || 0;
    const previousAverageScore = test.averageScore || 0;

    const newPlayCount = (test.playCount || 0) + 1;
    const newTotalPlays = previousTotalPlays + 1;
    const newTotalStudents = (test.totalStudents || 0) + roomResults.length;

    let newAverageScore = previousAverageScore;
    if (roomResults.length > 0) {
        let totalPercentage = 0;
        roomResults.forEach((result) => {
            let studentScore = result.score || 0;
            if (studentScore > 100) {
                const maxScore = test.questions.length * 1000;
                studentScore = (studentScore / maxScore) * 100;
            }
            totalPercentage += studentScore;
        });
        const currentSessionAverage = totalPercentage / roomResults.length;

        newAverageScore =
            previousTotalPlays === 0
                ? currentSessionAverage
                : ((previousAverageScore * previousTotalPlays) + currentSessionAverage) / newTotalPlays;
    }

    getDb()
        .prepare(
            `UPDATE tests SET playCount = ?, totalPlays = ?, totalStudents = ?, averageScore = ?,
                updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
             WHERE id = ?`
        )
        .run(newPlayCount, newTotalPlays, newTotalStudents, newAverageScore, testId);
}

module.exports = {
    ensureSchema,
    // users
    getAllUsers,
    getUserByUsername,
    getUserByToken,
    createUser,
    setUserLoginToken,
    resetUserPassword,
    // categories
    getAllCategories,
    getCategoryById,
    categoryNameExists,
    createCategory,
    updateCategoryName,
    deleteCategory,
    // tests
    getAllTests,
    getTestById,
    createTest,
    updateTest,
    deleteTest,
    countTestsByCategory,
    recordTestSessionStatistics,
};
