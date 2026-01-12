const socket = io();

// Elementler
const joinRoomSection = document.getElementById('joinRoomSection');
const waitingSection = document.getElementById('waitingSection');
const quizBox = document.querySelector('.quiz_box');
const scoreBox = document.querySelector('.score_box');

const joinRoomForm = document.getElementById('joinRoomForm');
const studentNameInput = document.getElementById('studentName');
const roomCodeInput = document.getElementById('roomCode');

// Bekleme ekranı elementleri
const waitingRoomCode = document.getElementById('waitingRoomCode');
const waitingTeacherName = document.getElementById('waitingTeacherName');
const waitingQuestionCount = document.getElementById('waitingQuestionCount');

// Global değişkenler
let currentRoomCode = null;
let currentStudentName = null;
let currentQuestion = null;
let currentQuestionIndex = 0;
let totalQuestions = 0;
let questionStartTime = null;
let timerInterval = null;
let userAnswer = null;

// ==================== ODA KATILIMI ====================
joinRoomForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const studentName = studentNameInput.value.trim();
    const roomCode = roomCodeInput.value.trim().toUpperCase();

    if (!studentName || !roomCode) {
        alert('Lütfen tüm alanları doldurun!');
        return;
    }

    currentStudentName = studentName;
    currentRoomCode = roomCode;

    // Socket ile odaya katıl
    socket.emit('student-join-room', {
        roomCode: roomCode,
        studentName: studentName
    });
});

// ==================== SOCKET OLAYLARI ====================

// Öğrenci başarıyla odaya katıldı
socket.on('student-joined', (data) => {
    if (data.success) {
        // Bekleme ekranına geç
        joinRoomSection.style.display = 'none';
        waitingSection.style.display = 'block';

        // Bilgileri göster
        waitingRoomCode.textContent = data.room.code;
        waitingTeacherName.textContent = data.room.teacherName;
        waitingQuestionCount.textContent = data.room.questionCount;
    }
});

// Katılım hatası
socket.on('join-error', (data) => {
    alert('Hata: ' + data.error);
});

// Test başladı - ÖNEMLİ!
socket.on('quiz-started', (data) => {
    console.log('Test başladı!', data);

    // Quiz bilgilerini kaydet
    currentQuestion = data.question;
    currentQuestionIndex = data.questionIndex;
    totalQuestions = data.totalQuestions;

    // Bekleme ekranını gizle, quiz ekranını göster
    waitingSection.style.display = 'none';
    quizBox.style.display = 'block';

    // İlk soruyu göster
    showQuestion(currentQuestion, data.questionIndex);

    // Zamanlayıcıyı başlat
    startTimer(data.timePerQuestion);
});

// Sonraki soru hazır
socket.on('next-question-ready', (data) => {
    currentQuestion = data.question;
    currentQuestionIndex = data.questionIndex;

    // Soruyu göster
    showQuestion(currentQuestion, data.questionIndex);

    // Zamanlayıcıyı yeniden başlat
    if (timerInterval) clearInterval(timerInterval);
    startTimer(data.timePerQuestion);
});

// Liderlik tablosu göster
socket.on('show-leaderboard', (data) => {
    if (timerInterval) clearInterval(timerInterval);
    showLeaderboard(data.leaderboard, data.currentQuestion, data.totalQuestions);
});

// Quiz bitti
socket.on('quiz-finished', (data) => {
    quizBox.style.display = 'none';
    showFinalLeaderboard(data.leaderboard);
    function showQuestion() {
        const question = quiz.getQuestion();
        ui.showQuestion(question);
        ui.showQuestionNumber(quiz.questionIndex + 1, quiz.questions.length);

        questionStartTime = Date.now();

        // Seçenek tıklama olaylarını ekle
        const options = document.querySelectorAll('.option');
        options.forEach(option => {
            option.addEventListener('click', optionSelected);
        });
    }

    function optionSelected(e) {
        const selectedOption = e.target;
        const answer = selectedOption.textContent;

        // Cevabı kaydet
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
        userAnswers[quiz.questionIndex] = {
            answer: answer,
            timeSpent: timeSpent
        };

        // Socket ile sunucuya gönder
        socket.emit('submit-answer', {
            roomCode: currentRoomCode,
            questionIndex: quiz.questionIndex,
            answer: answer,
            timeSpent: timeSpent
        });

        // Seçili yapı
        clearSelection();
        selectedOption.classList.add('selected');
    }

    function clearSelection() {
        const options = document.querySelectorAll('.option');
        options.forEach(option => {
            option.classList.remove('selected');
        });
    }

    // Sonraki soru
    document.querySelector('.btn_next').addEventListener('click', () => {
        quiz.questionIndex++;

        if (quiz.questionIndex < quiz.questions.length) {
            showQuestion();
            clearSelection();
        } else {
            // Test bitti
            finishQuiz();
        }
    });

    // ==================== TEST BİTİRME ====================
    function finishQuiz() {
        // Sonuçları sunucuya gönder
        socket.emit('finish-quiz', {
            roomCode: currentRoomCode,
            answers: userAnswers
        });
    }

    // Sonuç geldi
    socket.on('quiz-result', (data) => {
        // Quiz ekranını gizle
        quizBox.style.display = 'none';

        // Sonuç ekranını göster
        showResult(data);
    });

    function showResult(result) {
        scoreBox.style.display = 'block';

        document.querySelector('.score_text').innerHTML =
            `Testiniz tamamlandı, <strong>${currentStudentName}</strong>!`;

        document.querySelector('.correct_count').textContent = result.correct;
        document.querySelector('.wrong_count').textContent = result.wrong;
        document.querySelector('.empty_count').textContent = result.empty;
        document.querySelector('.finish_time').textContent = result.totalTime + ' saniye';
        document.querySelector('.score_point').textContent = result.score;
        document.querySelector('.success_rate').textContent = result.score + '%';
    }

    // Tekrar başlat butonu
    document.querySelector('.btn_replay').addEventListener('click', () => {
        location.reload();
    });

    // Testi bitir butonu
    document.querySelector('.btn_quit').addEventListener('click', () => {
        location.reload();
    });

    // ==================== ZAMANLAYICI ====================
    let timerInterval = null;

    function startTimer(timePerQuestion) {
        let timeLeft = timePerQuestion;
        const timerElement = document.querySelector('.time_second');
        const timeLine = document.querySelector('.time_line');

        timerInterval = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;

            // Progress bar
            const progress = ((timePerQuestion - timeLeft) / timePerQuestion) * 100;
            timeLine.style.width = progress + '%';

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                // Otomatik sonraki soru
                document.querySelector('.btn_next').click();
            }
        }, 1000);
    }

    // Bağlantı hatası
    socket.on('connect_error', (error) => {
        console.error('Bağlantı hatası:', error);
        alert('Sunucuya bağlanırken hata oluştu!');
    });
});