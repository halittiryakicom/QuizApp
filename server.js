const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const db = require('./database/db-helpers');

// JSON parser middleware - Görsel yükleme için limit artırıldı
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Static dosyaları serve et
// __dirname ile mutlak yol kullanılıyor — bare 'public'/'data' relatif yolları
// process.cwd()'ye göre çözülür, uygulama başka bir dizinden başlatıldığında
// (ör. bir process manager veya farklı bir çalışma dizininden `node server.js`)
// tüm CSS/JS/veri dosyaları 404 dönerdi.
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'data')));

// ==================== ODA VE TEST YÖNETİMİ ====================
const rooms = new Map(); // Tüm odaları saklayacak
const users = new Map(); // Kullanıcı bilgilerini saklayacak

// Davet kodu üretici
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Test ID üretici
function generateTestId() {
    return 'test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Not: Testler, kategoriler ve kullanıcılar artık database/db-helpers.js
// üzerinden SQLite'ta (data/quizapp.db) saklanıyor — bkz. `const db = ...`
// importu yukarıda. Eskiden burada data/*.json dosyalarını tamamen okuyup
// tekrar yazan loadTests/saveTests/loadCategories/saveCategories/
// loadUsers/saveUsers fonksiyonları vardı; aşağıdaki route'lar artık
// doğrudan db.* fonksiyonlarını çağırıyor.

// Kategori ID üretici
function generateCategoryId() {
    return 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Basit token üretici
function generateToken() {
    return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
}

// Token doğrulama middleware
function authenticateTeacher(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ error: 'Token gerekli' });
    }

    // Basit token kontrolü (production'da JWT kullanılmalı)
    const user = db.getUserByToken(token);

    if (!user) {
        return res.status(401).json({ error: 'Geçersiz token' });
    }

    req.user = user;
    next();
}

// ==================== HTTP ROTALAR ====================

// Öğrenci ana sayfası
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login sayfası
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Öğretmen paneli
app.get('/teacher', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'teacher.html'));
});

// Admin paneli
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ==================== AUTH API ====================

// Kayıt ol
app.post('/api/auth/register', async (req, res) => {
    const { fullName, username, password } = req.body;

    if (!fullName || !username || !password) {
        return res.json({ success: false, message: 'Tüm alanları doldurun' });
    }

    // Kullanıcı adı kontrolü
    if (db.getUserByUsername(username)) {
        return res.json({ success: false, message: 'Bu kullanıcı adı zaten kullanılıyor' });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    db.createUser({
        id: 'user_' + Date.now(),
        fullName,
        username,
        password: hashedPassword,
        role: 'teacher',
    });

    res.json({ success: true, message: 'Kayıt başarılı' });
});

// Giriş yap
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    const user = db.getUserByUsername(username);

    if (!user) {
        return res.json({ success: false, message: 'Kullanıcı adı veya şifre hatalı' });
    }

    // Şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.json({ success: false, message: 'Kullanıcı adı veya şifre hatalı' });
    }

    // Token üret ve kaydet
    const token = generateToken();
    db.setUserLoginToken(user.id, token);

    res.json({
        success: true,
        token: token,
        user: {
            id: user.id,
            fullName: user.fullName,
            username: user.username
        }
    });
});

// Şifre sıfırlama
app.post('/api/auth/reset-password', async (req, res) => {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
        return res.json({ success: false, message: 'Kullanıcı adı ve yeni şifre gerekli' });
    }

    if (!db.getUserByUsername(username)) {
        return res.json({ success: false, message: 'Kullanıcı bulunamadı' });
    }

    // Yeni şifreyi hashle; resetUserPassword aynı zamanda token'ı sıfırlar (güvenlik için)
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.resetUserPassword(username, hashedPassword);

    res.json({ success: true, message: 'Şifre başarıyla sıfırlandı' });
});

// Test oluşturma sayfası
app.get('/create-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'create-test.html'));
});

// ==================== TEST YÖNETİMİ API ====================

// Tüm testleri listele
app.get('/api/tests', (req, res) => {
    res.json(db.getAllTests());
});

// Belirli bir testi getir
app.get('/api/tests/:id', (req, res) => {
    const test = db.getTestById(req.params.id);
    if (test) {
        res.json(test);
    } else {
        res.status(404).json({ error: 'Test bulunamadı' });
    }
});

// Yeni test oluştur
app.post('/api/tests', (req, res) => {
    const { title, description, category, timePerQuestion, questions } = req.body;

    const newTest = db.createTest({
        id: generateTestId(),
        title,
        description,
        category,
        timePerQuestion: timePerQuestion || 30,
        questions,
    });

    res.json({
        success: true,
        test: newTest
    });
});

// Test güncelle
app.put('/api/tests/:id', (req, res) => {
    const updated = db.updateTest(req.params.id, req.body);

    if (!updated) {
        return res.status(404).json({ error: 'Test bulunamadı' });
    }

    res.json({ success: true, test: updated });
});

// Test sil
app.delete('/api/tests/:id', (req, res) => {
    if (!db.deleteTest(req.params.id)) {
        return res.status(404).json({ error: 'Test bulunamadı' });
    }

    res.json({ success: true });
});

// ==================== KATEGORİ API ====================

// Tüm kategorileri getir
app.get('/api/categories', (req, res) => {
    res.json(db.getAllCategories());
});

// Yeni kategori ekle
app.post('/api/categories', (req, res) => {
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Kategori adı gerekli' });
    }

    const trimmedName = name.trim();

    // Aynı isimde kategori var mı kontrol et
    if (db.categoryNameExists(trimmedName)) {
        return res.status(400).json({ error: 'Bu kategori zaten mevcut' });
    }

    const newCategory = db.createCategory({ id: generateCategoryId(), name: trimmedName });

    res.json({ success: true, category: newCategory });
});

// Kategori güncelle
app.put('/api/categories/:id', (req, res) => {
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Kategori adı gerekli' });
    }

    const trimmedName = name.trim();

    if (!db.getCategoryById(req.params.id)) {
        return res.status(404).json({ error: 'Kategori bulunamadı' });
    }

    // Aynı isimde başka kategori var mı kontrol et (kendisi hariç)
    if (db.categoryNameExists(trimmedName, req.params.id)) {
        return res.status(400).json({ error: 'Bu kategori adı zaten kullanılıyor' });
    }

    const updated = db.updateCategoryName(req.params.id, trimmedName);
    res.json({ success: true, category: updated });
});

// Kategori sil
app.delete('/api/categories/:id', (req, res) => {
    const categoryToDelete = db.getCategoryById(req.params.id);

    if (!categoryToDelete) {
        return res.status(404).json({ error: 'Kategori bulunamadı' });
    }

    // Bu kategoriye ait test var mı kontrol et
    const testsInCategoryCount = db.countTestsByCategory(categoryToDelete.name);

    if (testsInCategoryCount > 0) {
        return res.status(400).json({
            error: `Bu kategoriye ait ${testsInCategoryCount} test var. Önce testleri silin veya başka kategoriye taşıyın.`
        });
    }

    db.deleteCategory(req.params.id);

    res.json({ success: true });
});

// ==================== TEST İSTATİSTİKLERİ ====================

// Test istatistiklerini güncelle (hesaplama mantığı artık database/db-helpers.js
// içindeki recordTestSessionStatistics()'te — burada sadece çağırıyoruz).
function updateTestStatistics(testId, roomResults) {
    db.recordTestSessionStatistics(testId, roomResults);
}

// ==================== ODA YÖNETİMİ API ====================

// Test ile oda oluşturma (YENİ)
app.post('/api/create-room-from-test', (req, res) => {
    const { teacherName, testId } = req.body;

    const test = db.getTestById(testId);

    if (!test) {
        return res.status(404).json({ error: 'Test bulunamadı' });
    }

    const roomCode = generateRoomCode();

    const room = {
        code: roomCode,
        teacherName: teacherName,
        testId: testId,
        testTitle: test.title,
        category: test.category,
        questionCount: test.questions.length,
        timePerQuestion: test.timePerQuestion,
        questions: test.questions,
        status: 'WAITING',
        students: [],
        results: [],
        currentQuestionIndex: 0,
        createdAt: new Date()
    };

    rooms.set(roomCode, room);

    res.json({
        success: true,
        roomCode: roomCode,
        room: room
    });
});

// Oda oluşturma API (ESKİ - geriye dönük uyumluluk)
app.post('/api/create-room', (req, res) => {
    const { teacherName, category, questionCount, timePerQuestion } = req.body;

    const roomCode = generateRoomCode();
    const questions = generateQuestionSet(category, questionCount);

    const room = {
        code: roomCode,
        teacherName: teacherName,
        category: category,
        questionCount: questionCount,
        timePerQuestion: timePerQuestion,
        questions: questions,
        status: 'WAITING', // WAITING, ACTIVE, FINISHED
        students: [],
        results: [],
        createdAt: new Date()
    };

    rooms.set(roomCode, room);

    res.json({
        success: true,
        roomCode: roomCode,
        room: room
    });
});

// Oda bilgisi getir
app.get('/api/room/:code', (req, res) => {
    const room = rooms.get(req.params.code);
    if (!room) {
        return res.status(404).json({ error: 'Oda bulunamadı' });
    }

    // Öğrencilere soruları göndermeyiz
    const publicRoom = {
        code: room.code,
        teacherName: room.teacherName,
        questionCount: room.questionCount,
        timePerQuestion: room.timePerQuestion,
        status: room.status,
        studentCount: room.students.length
    };

    res.json(publicRoom);
});

// Soru ekleme API endpoint'i (eski)
app.post('/api/questions', (req, res) => {
    const questionsPath = path.join(__dirname, 'data', 'questions.json');

    try {
        fs.writeFileSync(questionsPath, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Soru kaydetme hatası:', error);
        res.status(500).json({ error: 'Sorular kaydedilirken hata oluştu' });
    }
});

// ==================== SOCKET.IO BAĞLANTILARI ====================

io.on('connection', (socket) => {
    console.log('Yeni bağlantı:', socket.id);

    // Öğretmen odaya bağlanıyor
    socket.on('teacher-join-room', (data) => {
        const { roomCode } = data;
        const room = rooms.get(roomCode);

        if (room) {
            socket.join(roomCode);
            socket.emit('teacher-joined', {
                success: true,
                room: room
            });
            console.log(`Öğretmen oda ${roomCode} kodlu odaya bağlandı`);
        } else {
            socket.emit('teacher-joined', {
                success: false,
                error: 'Oda bulunamadı'
            });
        }
    });

    // Öğrenci odaya katılıyor
    socket.on('student-join-room', (data) => {
        const { roomCode, studentName } = data;
        const room = rooms.get(roomCode);

        if (!room) {
            socket.emit('join-error', { error: 'Oda bulunamadı' });
            return;
        }

        if (room.status !== 'WAITING') {
            socket.emit('join-error', { error: 'Test zaten başladı veya bitti' });
            return;
        }

        const student = {
            id: socket.id,
            name: studentName,
            joinedAt: new Date()
        };

        room.students.push(student);
        users.set(socket.id, { roomCode, studentName, role: 'student' });

        socket.join(roomCode);

        // Öğrenciye onay gönder
        socket.emit('student-joined', {
            success: true,
            room: {
                code: room.code,
                teacherName: room.teacherName,
                questionCount: room.questionCount,
                timePerQuestion: room.timePerQuestion,
                status: room.status
            }
        });

        // Öğretmene güncelleme gönder
        io.to(roomCode).emit('student-list-updated', {
            students: room.students
        });

        console.log(`${studentName} odaya katıldı: ${roomCode}`);
    });

    // Öğretmen testi başlatıyor
    socket.on('start-quiz', (data) => {
        const { roomCode } = data;
        const room = rooms.get(roomCode);

        if (!room) return;

        room.status = 'ACTIVE';
        room.startedAt = new Date();
        room.currentQuestionIndex = 0;

        // İlk soruyu gönder
        io.to(roomCode).emit('quiz-started', {
            question: room.questions[0],
            questionIndex: 0,
            totalQuestions: room.questions.length,
            timePerQuestion: room.timePerQuestion
        });

        // İlk soru için timer başlat
        startQuestionTimer(room, roomCode);

        console.log(`Test başlatıldı: ${roomCode}`);
    });

    // Öğretmen sonraki soruya geçiyor
    socket.on('next-question', (data) => {
        const { roomCode } = data;
        const room = rooms.get(roomCode);

        if (!room) return;

        // Timer'ı temizle
        if (room.questionTimer) clearTimeout(room.questionTimer);

        // Önce liderlik tablosunu göster
        const leaderboard = calculateLeaderboard(room);
        io.to(roomCode).emit('show-leaderboard', {
            leaderboard: leaderboard,
            currentQuestion: room.currentQuestionIndex + 1,
            totalQuestions: room.questions.length
        });

        // 3 saniye sonra sonraki soruya geç
        setTimeout(() => {
            moveToNextQuestion(room, roomCode);
        }, 3000);
    });

    // Öğrenci cevap gönderiyor
    socket.on('submit-answer', (data) => {
        const { roomCode, questionIndex, answer, timeSpent, isCorrect } = data;
        const room = rooms.get(roomCode);
        const user = users.get(socket.id);

        if (!room || !user) return;

        // Öğrencinin cevabını kaydet
        let studentResult = room.results.find(r => r.studentId === socket.id);
        if (!studentResult) {
            studentResult = {
                studentId: socket.id,
                studentName: user.studentName,
                answers: [],
                score: 0,
                correctCount: 0
            };
            room.results.push(studentResult);
        }

        studentResult.answers[questionIndex] = {
            answer: answer,
            timeSpent: timeSpent,
            isCorrect: isCorrect
        };

        if (isCorrect) {
            studentResult.correctCount = (studentResult.correctCount || 0) + 1;

            // Zaman bazlı puanlama: Hızlı cevap daha fazla puan
            // Maksimum 1000 puan, minimum 500 puan
            const maxTime = room.timePerQuestion;
            const remainingTime = maxTime - timeSpent;
            const timeBonus = (remainingTime / maxTime) * 500; // 0-500 arası bonus
            const points = Math.round(500 + timeBonus); // 500-1000 arası

            studentResult.score = (studentResult.score || 0) + points;
        }

        // Öğretmene bildir
        io.to(roomCode).emit('student-answered', {
            studentName: user.studentName,
            questionIndex: questionIndex
        });

        // Tüm öğrenciler cevap verdiyse otomatik geçiş
        const answeredStudents = room.results.filter(r =>
            r.answers[questionIndex] !== undefined
        ).length;

        if (answeredStudents === room.students.length) {
            // Timer'ı temizle
            if (room.questionTimer) clearTimeout(room.questionTimer);

            // Liderlik tablosunu göster
            const leaderboard = calculateLeaderboard(room);
            io.to(roomCode).emit('show-leaderboard', {
                leaderboard: leaderboard,
                currentQuestion: room.currentQuestionIndex + 1,
                totalQuestions: room.questions.length
            });

            // 5 saniye sonra sonraki soruya geç
            setTimeout(() => {
                moveToNextQuestion(room, roomCode);
            }, 5000);
        }
    });

    // Öğrenci testi bitirdi
    socket.on('finish-quiz', (data) => {
        const { roomCode, answers } = data;
        const room = rooms.get(roomCode);
        const user = users.get(socket.id);

        if (!room || !user) return;

        // Skorunu hesapla
        let correct = 0;
        let wrong = 0;
        let totalTime = 0;

        answers.forEach((ans, index) => {
            if (ans && ans.answer !== null) {
                const correctAnswer = room.questions[index].options[room.questions[index].correct];
                if (ans.answer === correctAnswer) {
                    correct++;
                } else {
                    wrong++;
                }
                totalTime += ans.timeSpent || 0;
            }
        });

        const empty = room.questionCount - (correct + wrong);
        const score = (correct / room.questionCount) * 100;

        // Sonucu kaydet
        let studentResult = room.results.find(r => r.studentId === socket.id);
        if (studentResult) {
            studentResult.correct = correct;
            studentResult.wrong = wrong;
            studentResult.empty = empty;
            studentResult.score = score;
            studentResult.totalTime = totalTime;
            studentResult.finishedAt = new Date();
        }

        // Öğrenciye sonuçlarını gönder
        socket.emit('quiz-result', {
            correct: correct,
            wrong: wrong,
            empty: empty,
            score: score.toFixed(2),
            totalTime: totalTime
        });

        // Öğretmene güncelleme gönder
        io.to(roomCode).emit('results-updated', {
            results: room.results
        });

        console.log(`${user.studentName} testi bitirdi. Skor: ${score.toFixed(2)}%`);
    });

    // Liderlik tablosu hesaplama fonksiyonu
    function calculateLeaderboard(room) {
        return room.results
            .map(r => ({
                studentName: r.studentName,
                score: r.score || 0,
                correctCount: r.correctCount || 0
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // İlk 10 kişi
    }

    // Soru timer'i başlatma fonksiyonu
    function startQuestionTimer(room, roomCode) {
        console.log('Timer başlatılıyor, süre:', room.timePerQuestion, 'saniye');
        if (room.questionTimer) clearTimeout(room.questionTimer);

        room.questionTimer = setTimeout(() => {
            console.log('Soru süresi bitti, liderlik gösteriliyor');
            // Süre bitti - liderlik tablosu göster
            const leaderboard = calculateLeaderboard(room);
            io.to(roomCode).emit('question-time-up', {
                leaderboard: leaderboard,
                currentQuestion: room.currentQuestionIndex + 1,
                totalQuestions: room.questions.length
            });

            // 5 saniye sonra otomatik sonraki soruya geç
            setTimeout(() => {
                console.log('5 saniye bitti, sonraki soruya geçiliyor');
                moveToNextQuestion(room, roomCode);
            }, 5000);
        }, room.timePerQuestion * 1000);
    }

    // Sonraki soruya geçiş fonksiyonu
    function moveToNextQuestion(room, roomCode) {
        console.log('moveToNextQuestion çağrıldı, currentIndex:', room.currentQuestionIndex);
        room.currentQuestionIndex++;

        if (room.currentQuestionIndex < room.questions.length) {
            console.log('Sonraki soru gönderiliyor:', room.currentQuestionIndex);
            // Sonraki soruyu gönder
            io.to(roomCode).emit('next-question-ready', {
                question: room.questions[room.currentQuestionIndex],
                questionIndex: room.currentQuestionIndex,
                totalQuestions: room.questions.length,
                timePerQuestion: room.timePerQuestion
            });

            // Yeni soru için timer başlat
            startQuestionTimer(room, roomCode);
        } else {
            console.log('Test bitti, final sıralama gönderiliyor');
            // Test bitti
            room.status = 'FINISHED';
            const finalLeaderboard = calculateLeaderboard(room);

            // Her öğrenciye kendi cevaplarını ve soru detaylarını gönder
            room.students.forEach(student => {
                const studentResult = room.results.find(r => r.studentId === student.id);
                const myAnswers = studentResult ? studentResult.answers : [];

                io.to(student.id).emit('quiz-finished', {
                    leaderboard: finalLeaderboard,
                    questionsData: room.questions,
                    myAnswers: myAnswers
                });
            });

            // Öğretmene final sıralamasını gönder
            io.to(roomCode).emit('quiz-finished', {
                leaderboard: finalLeaderboard
            });

            // Test istatistiklerini güncelle
            if (room.testId) {
                updateTestStatistics(room.testId, room.results);
            }
        }
    }

    // Bağlantı kesildiğinde
    socket.on('disconnect', () => {
        const user = users.get(socket.id);
        if (user && user.role === 'student') {
            const room = rooms.get(user.roomCode);
            if (room) {
                room.students = room.students.filter(s => s.id !== socket.id);
                io.to(user.roomCode).emit('student-list-updated', {
                    students: room.students
                });
            }
        }
        users.delete(socket.id);
        console.log('Bağlantı kesildi:', socket.id);
    });
});

const PORT = 3000;
const HOST = '0.0.0.0'; // Tüm network interface'lerinde dinle
server.listen(PORT, HOST, () => {
    console.log(`Server http://localhost:${PORT} adresinde çalışıyor`);
    console.log(`Ağ erişimi için: http://<BILGISAYAR-IP>:${PORT}`);
    console.log(`Öğretmen paneli: http://localhost:${PORT}/teacher`);
    console.log(`Admin paneli: http://localhost:${PORT}/admin`);
});