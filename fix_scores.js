const fs = require('fs');
const path = require('path');

const testsPath = path.join(__dirname, 'data', 'tests.json');
const tests = JSON.parse(fs.readFileSync(testsPath, 'utf8'));

console.log('Başlangıç: Test scorları düzeltiliyor...');

tests.forEach(test => {
    if (test.statistics && test.statistics.averageScore > 100) {
        console.log(`Düzeltiliyor: ${test.title} (Eski Skor: ${test.statistics.averageScore})`);

        // Max puanı hesapla (Soru sayısı * 1000)
        const maxScore = (test.questions.length || 1) * 1000;

        // Yeni yüzdeyi hesapla
        let newScore = (test.statistics.averageScore / maxScore) * 100;

        // Eğer hala 100'den büyükse (veri çok bozuksa) 0 yap
        if (newScore > 100) {
            newScore = 0;
        }

        test.statistics.averageScore = newScore;
        console.log(`  -> Yeni Skor: ${newScore.toFixed(2)}%`);
    } else if (test.statistics && (test.statistics.totalPlays === 0 || !test.statistics.averageScore)) {
        // Hiç oynanmamışsa veya skor yoksa 0 yap
        if (!test.statistics) test.statistics = {};
        test.statistics.averageScore = 0;
    }
});

fs.writeFileSync(testsPath, JSON.stringify(tests, null, 2));
console.log('Tamamlandı: Tüm scorlar yüzdeye çevrildi.');
