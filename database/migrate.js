const fs = require('fs');
const path = require('path');
const { sql, getPool, testConnection } = require('../config/database');
const {
    createCategory,
    createQuestion,
    createTest
} = require('./db-helpers');

/**
 * JSON dosyalarından MSSQL'e veri aktarır
 */
async function migrateFromJSON() {
    console.log('\n🚀 JSON -> MSSQL Migration Başlatılıyor...\n');

    try {
        // Veritabanı bağlantısını test et
        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Veritabanı bağlantısı başarısız');
        }

        // JSON dosyalarını oku
        const categoriesData = await readJSONFile('data/categories.json');
        const questionsData = await readJSONFile('data/questions.json');
        const testsData = await readJSONFile('data/tests.json');

        console.log(`📊 Okundu: ${categoriesData.length} kategori, ${questionsData.length} soru, ${testsData.length} test\n`);

        // 1. Kategorileri migrate et
        console.log('📁 Kategoriler aktarılıyor...');
        const categoryMap = new Map(); // Eski ID -> Yeni ID mapping

        for (const cat of categoriesData) {
            try {
                const newCat = await createCategory(cat.name, cat.description || '', cat.icon || '📚');
                categoryMap.set(cat.id, newCat.id);
                console.log(`   ✅ ${cat.name} -> ID: ${newCat.id}`);
            } catch (error) {
                if (error.message.includes('UNIQUE')) {
                    console.log(`   ⚠️  ${cat.name} zaten var, atlanıyor...`);
                    // Mevcut kategoriyi bul
                    const pool = await getPool();
                    const result = await pool.request()
                        .input('name', sql.NVarChar(100), cat.name)
                        .query('SELECT id FROM Categories WHERE name = @name');
                    if (result.recordset[0]) {
                        categoryMap.set(cat.id, result.recordset[0].id);
                    }
                } else {
                    console.error(`   ❌ ${cat.name} hatası:`, error.message);
                }
            }
        }

        // 2. Soruları migrate et
        console.log('\n❓ Sorular aktarılıyor...');
        const questionMap = new Map(); // Eski ID -> Yeni ID mapping
        let questionCount = 0;

        for (const q of questionsData) {
            try {
                // Kategori mapping uygula
                const newCategoryId = categoryMap.get(q.category);
                if (!newCategoryId) {
                    console.log(`   ⚠️  Soru kategorisi (${q.category}) bulunamadı, atlanıyor...`);
                    continue;
                }

                // Seçenekleri hazırla
                const options = q.options?.map(opt => ({
                    text: opt,
                    isCorrect: opt === q.correctAnswer
                })) || [];

                const questionData = {
                    categoryId: newCategoryId,
                    question: q.question,
                    type: q.type || 'multiple',
                    difficulty: q.difficulty || 'medium',
                    imageUrl: q.image || null,
                    explanation: q.explanation || null,
                    createdBy: null,
                    options: options
                };

                const newQuestion = await createQuestion(questionData);
                questionMap.set(q.id, newQuestion.id);
                questionCount++;

                if (questionCount % 10 === 0) {
                    console.log(`   ⏳ ${questionCount} soru aktarıldı...`);
                }
            } catch (error) {
                console.error(`   ❌ Soru hatası:`, error.message);
            }
        }
        console.log(`   ✅ Toplam ${questionCount} soru aktarıldı`);

        // 3. Testleri migrate et
        console.log('\n📝 Testler aktarılıyor...');
        let testCount = 0;

        for (const test of testsData) {
            try {
                // Kategori mapping uygula
                const newCategoryId = categoryMap.get(test.category);

                // Soru mapping uygula
                const mappedQuestions = test.questions
                    ?.map(q => {
                        const newQuestionId = questionMap.get(q.id);
                        return newQuestionId ? { id: newQuestionId } : null;
                    })
                    .filter(q => q !== null) || [];

                if (mappedQuestions.length === 0) {
                    console.log(`   ⚠️  "${test.title}" testinin soruları bulunamadı, atlanıyor...`);
                    continue;
                }

                const testData = {
                    testId: test.id,
                    title: test.title,
                    description: test.description || '',
                    categoryId: newCategoryId || null,
                    timePerQuestion: test.timePerQuestion || 30,
                    createdBy: null,
                    questions: mappedQuestions
                };

                await createTest(testData);
                testCount++;
                console.log(`   ✅ ${test.title} -> ${mappedQuestions.length} soru`);
            } catch (error) {
                if (error.message.includes('UNIQUE')) {
                    console.log(`   ⚠️  "${test.title}" zaten var, atlanıyor...`);
                } else {
                    console.error(`   ❌ Test hatası (${test.title}):`, error.message);
                }
            }
        }
        console.log(`   ✅ Toplam ${testCount} test aktarıldı`);

        // Özet
        console.log('\n' + '='.repeat(50));
        console.log('✅ MIGRATION TAMAMLANDI!');
        console.log('='.repeat(50));
        console.log(`📁 Kategoriler: ${categoryMap.size}`);
        console.log(`❓ Sorular: ${questionMap.size}`);
        console.log(`📝 Testler: ${testCount}`);
        console.log('='.repeat(50) + '\n');

        return {
            success: true,
            categories: categoryMap.size,
            questions: questionMap.size,
            tests: testCount
        };

    } catch (error) {
        console.error('\n❌ Migration hatası:', error);
        throw error;
    }
}

/**
 * JSON dosyasını okur
 */
async function readJSONFile(filePath) {
    try {
        const fullPath = path.join(__dirname, '..', filePath);
        const data = fs.readFileSync(fullPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.warn(`⚠️  ${filePath} okunamadı:`, error.message);
        return [];
    }
}

/**
 * Schema'yı çalıştırır (Tabloları oluşturur)
 */
async function runSchema() {
    console.log('\n🏗️  Database Schema Çalıştırılıyor...\n');

    try {
        const pool = await getPool();
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // SQL komutlarını ayır ve çalıştır
        const commands = schema.split('GO').filter(cmd => cmd.trim().length > 0);

        for (let i = 0; i < commands.length; i++) {
            const command = commands[i].trim();
            if (command.length > 0 && !command.startsWith('--')) {
                try {
                    await pool.request().query(command);
                    console.log(`   ✅ Komut ${i + 1}/${commands.length} tamamlandı`);
                } catch (error) {
                    // PRINT komutları hata verebilir, görmezden gel
                    if (!error.message.includes('PRINT')) {
                        console.warn(`   ⚠️  Komut ${i + 1} uyarısı:`, error.message);
                    }
                }
            }
        }

        console.log('\n✅ Database schema başarıyla oluşturuldu!\n');
        return true;
    } catch (error) {
        console.error('\n❌ Schema hatası:', error);
        throw error;
    }
}

/**
 * Tam kurulum: Schema + Migration
 */
async function fullSetup() {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 QUIZ APP - MSSQL TAM KURULUM');
    console.log('='.repeat(50) + '\n');

    try {
        // 1. Schema oluştur
        await runSchema();

        // 2. Verileri migrate et
        await migrateFromJSON();

        console.log('🎉 Kurulum başarıyla tamamlandı!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Kurulum başarısız:', error);
        process.exit(1);
    }
}

// Komut satırından çalıştırma
if (require.main === module) {
    const command = process.argv[2];

    switch (command) {
        case 'schema':
            runSchema().then(() => process.exit(0)).catch(() => process.exit(1));
            break;
        case 'migrate':
            migrateFromJSON().then(() => process.exit(0)).catch(() => process.exit(1));
            break;
        case 'full':
        default:
            fullSetup();
            break;
    }
}

module.exports = {
    migrateFromJSON,
    runSchema,
    fullSetup
};
