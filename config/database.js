const sql = require('mssql');
require('dotenv').config();

// MSSQL Veritabanı Konfigürasyonu
const config = {
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT) || 1433,
    database: process.env.DB_DATABASE || 'QuizAppDB',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let poolPromise;

/**
 * Veritabanı bağlantı havuzunu oluşturur ve döner
 */
const getPool = async () => {
    if (!poolPromise) {
        try {
            poolPromise = sql.connect(config);
            console.log('✅ MSSQL veritabanı bağlantı havuzu oluşturuldu');
        } catch (error) {
            console.error('❌ MSSQL bağlantı hatası:', error.message);
            poolPromise = null;
            throw error;
        }
    }
    return poolPromise;
};

/**
 * Veritabanı bağlantısını kapatır
 */
const closePool = async () => {
    if (poolPromise) {
        try {
            await (await poolPromise).close();
            poolPromise = null;
            console.log('👋 MSSQL bağlantı havuzu kapatıldı');
        } catch (error) {
            console.error('❌ Bağlantı kapatma hatası:', error.message);
        }
    }
};

/**
 * Veritabanı bağlantısını test eder
 */
const testConnection = async () => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT @@VERSION as version');
        console.log('✅ MSSQL Bağlantı Testi Başarılı');
        console.log('📊 SQL Server Version:', result.recordset[0].version.split('\n')[0]);
        return true;
    } catch (error) {
        console.error('❌ MSSQL Bağlantı Testi Başarısız:', error.message);
        return false;
    }
};

module.exports = {
    sql,
    config,
    getPool,
    closePool,
    testConnection
};
