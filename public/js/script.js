let questions = [];
let quiz;
const ui = new UI();

// JSON dosyasından soruları çek
fetch('/data/questions.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Sorular yüklenemedi');
        }
        return response.json();
    })
    .then(data => {
        // JSON'dan gelen soruları Question objelerine dönüştür
        const questions = data.map(q => new Question(q.question, q.options, q.correct));
        quiz = new Quiz(questions);
        ui.ready(); // Buton durumunu güncelle
    })
    .catch(error => {
        console.error('Sorular yüklenirken hata:', error);
        ui.showError('Sorular yüklenirken hata oluştu');
    });

// Başlat butonuna tıklandığında
document.querySelector(".btn_start").addEventListener("click", function () {
    if (quiz) {
        quiz.start(); // Süreyi başlat
        ui.showQuiz();
        ui.showQuestion(quiz.getQuestion());
        ui.showQuestionNumber(quiz.questionIndex + 1, quiz.questions.length);
    }
});

// Önceki soru butonuna tıklandığında
document.querySelector(".btn_prev").addEventListener("click", function () {
    if (quiz.questionIndex > 0) {
        quiz.questionIndex -= 1;
        ui.showQuestion(quiz.getQuestion());
        ui.showQuestionNumber(quiz.questionIndex + 1, quiz.questions.length);
    }
});

// Sonraki soru butonuna tıklandığında
document.querySelector(".btn_next").addEventListener("click", function () {
    if (!quiz) return; // Quiz henüz yüklenmemişse çık

    if (quiz.questions.length !== quiz.questionIndex + 1) {
        quiz.questionIndex++;
        ui.showQuestion(quiz.getQuestion());
        ui.showQuestionNumber(quiz.questionIndex + 1, quiz.questions.length);
    } else {
        clearInterval(ui.timer); // Timer'ı durdur
        const results = quiz.calculateScore();
        ui.showScore(results);
    }
});

function optionSelected(option, answer) {
    // Seçeneklerin tümünden selected sınıfını kaldır
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
    });

    // Seçili seçeneğe selected sınıfını ekle
    option.classList.add('selected');

    // Cevabı kaydet
    quiz.saveAnswer(answer);
}

// Testi bitir butonuna tıklandığında
document.querySelector(".btn_quit").addEventListener("click", function () {
    window.location.reload();
});

// Tekrar başlat butonuna tıklandığında
document.querySelector(".btn_replay").addEventListener("click", function () {
    // Score box'ı gizle
    ui.score_box.style.display = "none";
    // Quiz'i sıfırla
    quiz.questionIndex = 0;
    quiz.correctAnswers = 0;
    quiz.wrongAnswers = 0;
    quiz.userAnswers = new Array(quiz.questions.length).fill(null);
    quiz.startTime = new Date();
    // Quiz'i göster
    ui.showQuiz();
    ui.showQuestion(quiz.getQuestion());
    ui.showQuestionNumber(quiz.questionIndex + 1, quiz.questions.length);
});