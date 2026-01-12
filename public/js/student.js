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

    socket.emit('student-join-room', {
        roomCode: roomCode,
        studentName: studentName
    });
});

// ==================== SOCKET OLAYLARI ====================

socket.on('student-joined', (data) => {
    if (data.success) {
        joinRoomSection.style.display = 'none';
        waitingSection.style.display = 'block';

        waitingRoomCode.textContent = data.room.code;
        waitingTeacherName.textContent = data.room.teacherName;
        waitingQuestionCount.textContent = data.room.questionCount;
    }
});

socket.on('join-error', (data) => {
    alert('Hata: ' + data.error);
});

// Test başladı
socket.on('quiz-started', (data) => {
    console.log('Test başladı!', data);

    currentQuestion = data.question;
    currentQuestionIndex = data.questionIndex;
    totalQuestions = data.totalQuestions;

    waitingSection.style.display = 'none';
    quizBox.style.display = 'block';

    // DOM'un render olması için kısa bir gecikme
    setTimeout(() => {
        showQuestion(currentQuestion, data.questionIndex);
        startTimer(data.timePerQuestion);
    }, 10);
});

// Sonraki soru hazır
socket.on('next-question-ready', (data) => {
    console.log('Sonraki soru geldi:', data);
    currentQuestion = data.question;
    currentQuestionIndex = data.questionIndex;
    totalQuestions = data.totalQuestions;

    // Quiz box'ı göster, diğerlerini gizle
    waitingSection.style.display = 'none';
    quizBox.style.display = 'block';
    scoreBox.style.display = 'none';

    // DOM'un render olması için kısa bir gecikme
    setTimeout(() => {
        showQuestion(currentQuestion, data.questionIndex);
    }, 10);

    if (timerInterval) clearInterval(timerInterval);
    startTimer(data.timePerQuestion);
});

// Liderlik tablosu göster
socket.on('show-leaderboard', (data) => {
    console.log('Liderlik tablosu gösteriliyor:', data);
    if (timerInterval) clearInterval(timerInterval);
    showLeaderboard(data.leaderboard, data.currentQuestion, data.totalQuestions);
});

// Soru süresi bitti - otomatik liderlik tablosu
socket.on('question-time-up', (data) => {
    console.log('Soru süresi bitti:', data);
    if (timerInterval) clearInterval(timerInterval);
    showLeaderboard(data.leaderboard, data.currentQuestion, data.totalQuestions);
});

// Quiz bitti
socket.on('quiz-finished', (data) => {
    quizBox.style.display = 'none';
    showFinalLeaderboard(data.leaderboard, data.questionsData, data.myAnswers);
});

// ==================== SORU GÖSTERME ====================

function showQuestion(question, questionIndex) {
    // QuizBox içindeki elementleri ara
    let questionText = quizBox.querySelector('.question_text');
    let optionList = quizBox.querySelector('.option_list');
    const questionIndexEl = quizBox.querySelector('.question_index');

    // Elementler yoksa (liderlik tablosundan sonra), quiz body'yi yeniden oluştur
    if (!questionText || !optionList) {
        console.log('Quiz elementleri yeniden oluşturuluyor...');
        const quizBody = quizBox.querySelector('.card-body');
        if (quizBody) {
            quizBody.innerHTML = `
                <div class="question_text mb-4">
                    <!-- Soru metni buraya gelecek -->
                </div>
                <div class="option_list">
                    <!-- Seçenekler buraya gelecek -->
                </div>
            `;
            questionText = quizBox.querySelector('.question_text');
            optionList = quizBox.querySelector('.option_list');
        }
    }

    // Hala bulunamadıysa hata ver
    if (!questionText || !optionList) {
        console.error('Quiz box elementleri oluşturulamadı!');
        return;
    }

    userAnswer = null;
    questionStartTime = Date.now();

    if (questionIndexEl) {
        questionIndexEl.textContent = `Soru ${questionIndex + 1} / ${totalQuestions}`;
    }

    if (question.type === 'multiple') {
        questionText.innerHTML = `<h5>${question.questionText}</h5>`;

        let optionsHTML = '';
        question.options.forEach((option, index) => {
            optionsHTML += `
                <div class="option" onclick="selectOption(this, '${option.replace(/'/g, "&apos;")}')">
                    <span>${option}</span>
                </div>
            `;
        });
        optionList.innerHTML = optionsHTML;

    } else if (question.type === 'truefalse') {
        questionText.innerHTML = `<h5>${question.questionText}</h5>`;
        optionList.innerHTML = `
            <div class="option" onclick="selectTrueFalse(this, true)">
                <span><i class="fas fa-check text-success"></i> Doğru</span>
            </div>
            <div class="option" onclick="selectTrueFalse(this, false)">
                <span><i class="fas fa-times text-danger"></i> Yanlış</span>
            </div>
        `;

    } else if (question.type === 'fillblank') {
        questionText.innerHTML = `<h5>${question.questionText}</h5>`;
        optionList.innerHTML = `
            <div class="p-3">
                <input type="text" class="form-control form-control-lg" id="fillBlankAnswer" 
                       placeholder="Cevabınızı yazın...">
                <button class="btn btn-success btn-lg mt-3 w-100" onclick="submitFillBlank()">
                    <i class="fas fa-paper-plane"></i> Cevabı Gönder
                </button>
            </div>
        `;
        setTimeout(() => document.getElementById('fillBlankAnswer').focus(), 100);
    }
}

function selectOption(element, answer) {
    // Cevap zaten gönderildiyse işlem yapma
    if (document.querySelector('.answer-submitted')) return;

    document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    userAnswer = answer;

    // Gönder butonunu göster
    showSubmitButton();
}

function selectTrueFalse(element, answer) {
    // Cevap zaten gönderildiyse işlem yapma
    if (document.querySelector('.answer-submitted')) return;

    document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    userAnswer = answer;

    // Gönder butonunu göster
    showSubmitButton();
}

function submitFillBlank() {
    const input = document.getElementById('fillBlankAnswer');
    userAnswer = input.value.trim();
    if (userAnswer) {
        submitAnswer();
    }
}

function showSubmitButton() {
    // Gönder butonu zaten varsa çık
    if (document.getElementById('submitAnswerBtn')) return;

    const optionList = document.querySelector('.option_list');
    const submitBtn = document.createElement('button');
    submitBtn.id = 'submitAnswerBtn';
    submitBtn.className = 'btn btn-success btn-lg w-100 mt-3';
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Cevabı Gönder';
    submitBtn.onclick = submitAnswer;
    optionList.appendChild(submitBtn);
}

function confirmAnswer() {
    submitAnswer();
}

function submitAnswer() {
    if (userAnswer === null || userAnswer === '') return;

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    let isCorrect = false;

    if (currentQuestion.type === 'multiple') {
        isCorrect = userAnswer === currentQuestion.options[currentQuestion.correctAnswer];
    } else if (currentQuestion.type === 'truefalse') {
        isCorrect = userAnswer === currentQuestion.correctAnswer;
    } else if (currentQuestion.type === 'fillblank') {
        isCorrect = currentQuestion.correctAnswers.some(ans =>
            ans.toLowerCase() === userAnswer.toLowerCase()
        );
    }

    socket.emit('submit-answer', {
        roomCode: currentRoomCode,
        questionIndex: currentQuestionIndex,
        answer: userAnswer,
        timeSpent: timeSpent,
        isCorrect: isCorrect
    });

    // Cevap gönderildi mesajı
    const optionList = document.querySelector('.option_list');
    optionList.innerHTML = `
        <div class="alert alert-success text-center answer-submitted">
            <i class="fas fa-check-circle fa-3x mb-3"></i>
            <h5>✓ Cevabınız Alındı!</h5>
            <p class="mb-0">Cevabınız başarıyla kaydedildi.</p>
            <p class="text-muted small">Öğretmenin sonraki soruya geçmesini bekleyin...</p>
        </div>
    `;
}

// ==================== LİDERLİK TABLOSU ====================

function showLeaderboard(leaderboard, currentQ, totalQ) {
    const quizBody = quizBox.querySelector('.card-body');

    let leaderHTML = `
        <div class="leaderboard-display text-center">
            <h3 class="mb-4">
                <i class="fas fa-trophy text-warning"></i> Liderlik Tablosu
            </h3>
            <p class="text-muted mb-4">Soru ${currentQ} / ${totalQ}</p>
            <div class="list-group mb-4">
    `;

    leaderboard.forEach((student, index) => {
        const isMe = student.studentName === currentStudentName;
        const bgClass = isMe ? 'bg-light border-primary' : '';
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;

        leaderHTML += `
            <div class="list-group-item d-flex justify-content-between align-items-center ${bgClass}">
                <div>
                    <span class="fs-5 me-2">${medal}</span>
                    <strong>${student.studentName}</strong>
                    ${isMe ? '<span class="badge bg-info ms-2">SEN</span>' : ''}
                    <small class="text-muted ms-2">(${student.correctCount} doğru)</small>
                </div>
                <span class="badge bg-primary rounded-pill fs-6">${student.score} puan</span>
            </div>
        `;
    });

    leaderHTML += `
            </div>
            <div class="alert alert-info">
                <i class="fas fa-hourglass-half"></i> Sonraki soru için bekleyin...
            </div>
        </div>
    `;

    quizBody.innerHTML = leaderHTML;
}

function showFinalLeaderboard(leaderboard, questionsData, myAnswers) {
    const myRank = leaderboard.findIndex(s => s.studentName === currentStudentName) + 1;
    const myData = leaderboard.find(s => s.studentName === currentStudentName);

    let wrongQuestionsHTML = '';
    if (questionsData && myAnswers) {
        const wrongQuestions = questionsData.filter((q, index) => {
            const myAnswer = myAnswers[index];
            if (!myAnswer || !myAnswer.answer) return true; // Boş cevap

            if (q.type === 'multiple') {
                return myAnswer.answer !== q.options[q.correctAnswer];
            } else if (q.type === 'truefalse') {
                return myAnswer.answer !== q.correctAnswer;
            } else if (q.type === 'fillblank') {
                return !q.correctAnswers.some(ans =>
                    ans.toLowerCase() === String(myAnswer.answer).toLowerCase()
                );
            }
            return false;
        });

        if (wrongQuestions.length > 0) {
            wrongQuestionsHTML = `
                <div class="mt-4">
                    <h5 class="text-danger"><i class="fas fa-times-circle"></i> Yanlış Yaptığın Sorular (${wrongQuestions.length})</h5>
                    <div class="accordion" id="wrongQuestionsAccordion">
                        ${wrongQuestions.map((q, idx) => {
                const questionIndex = questionsData.findIndex(quest => quest.id === q.id);
                const myAnswer = myAnswers[questionIndex];

                let correctAnswerText = '';
                if (q.type === 'multiple') {
                    correctAnswerText = q.options[q.correctAnswer];
                } else if (q.type === 'truefalse') {
                    correctAnswerText = q.correctAnswer ? 'Doğru' : 'Yanlış';
                } else if (q.type === 'fillblank') {
                    correctAnswerText = q.correctAnswers.join(' veya ');
                }

                const myAnswerText = myAnswer && myAnswer.answer ? String(myAnswer.answer) : 'Boş';

                return `
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button ${idx > 0 ? 'collapsed' : ''}" type="button" 
                                                data-bs-toggle="collapse" data-bs-target="#wrongQ${idx}">
                                            Soru ${questionIndex + 1}: ${q.questionText.substring(0, 50)}...
                                        </button>
                                    </h2>
                                    <div id="wrongQ${idx}" class="accordion-collapse collapse ${idx === 0 ? 'show' : ''}" 
                                         data-bs-parent="#wrongQuestionsAccordion">
                                        <div class="accordion-body">
                                            <p><strong>Soru:</strong> ${q.questionText}</p>
                                            <p class="text-danger"><strong>Senin Cevabın:</strong> ${myAnswerText}</p>
                                            <p class="text-success"><strong>Doğru Cevap:</strong> ${correctAnswerText}</p>
                                        </div>
                                    </div>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
        }
    }

    scoreBox.querySelector('.card-body').innerHTML = `
        <div class="text-center">
            <div class="icon mb-4">
                ${myRank === 1 ? '<i class="fas fa-crown fa-4x text-warning"></i>' :
            myRank <= 3 ? '<i class="fas fa-medal fa-4x text-primary"></i>' :
                '<i class="fas fa-star fa-4x text-info"></i>'}
            </div>
            <h2 class="mb-4">🎉 Test Tamamlandı!</h2>
            <div class="alert alert-${myRank <= 3 ? 'success' : 'info'} p-4">
                <h3>Sıralaman: ${myRank}. sıra</h3>
                <p class="mb-1 fs-5">Toplam Puan: <strong>${myData ? myData.score : 0}</strong></p>
                <p class="mb-0">Doğru Sayısı: <strong>${myData ? myData.correctCount : 0}</strong> / ${totalQuestions}</p>
            </div>
            
            ${wrongQuestionsHTML}
            
            <h5 class="mt-4 mb-3"><i class="fas fa-trophy"></i> Final Sıralaması</h5>
            <div class="list-group text-start" style="max-height: 400px; overflow-y: auto;">
                ${leaderboard.slice(0, 10).map((s, i) => `
                    <div class="list-group-item d-flex justify-content-between ${s.studentName === currentStudentName ? 'bg-light border-primary' : ''}">
                        <div>
                            <span class="fw-bold">${i + 1}.</span> ${s.studentName}
                            ${s.studentName === currentStudentName ? '<span class="badge bg-info ms-2">SEN</span>' : ''}
                        </div>
                        <span class="badge bg-primary rounded-pill">${s.score} puan</span>
                    </div>
                `).join('')}
            </div>
            
            <button class="btn btn-primary btn-lg mt-4 px-5" onclick="location.reload()">
                <i class="fas fa-redo"></i> Ana Sayfaya Dön
            </button>
        </div>
    `;
    scoreBox.style.display = 'block';
}

// ==================== ZAMANLAYICI ====================

function startTimer(timePerQuestion) {
    let timeLeft = timePerQuestion;
    const timerElement = document.querySelector('.time_second');
    const timeLine = document.querySelector('.time_line');

    timerElement.textContent = timeLeft;

    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;

        const progress = ((timePerQuestion - timeLeft) / timePerQuestion) * 100;
        timeLine.style.width = progress + '%';

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            // Süre doldu - cevap verilmediyse boş gönder
            if (userAnswer === null) {
                submitAnswer();
            }
        }
    }, 1000);
}

// Bağlantı hatası
socket.on('connect_error', (error) => {
    console.error('Bağlantı hatası:', error);
    alert('Sunucuya bağlanırken hata oluştu!');
});
