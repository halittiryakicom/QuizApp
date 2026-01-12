class UI {
  constructor() {
    this.btn_start = document.querySelector(".btn_start");
    this.btn_start_button = document.querySelector(".btn_start button");
    this.quiz_box = document.querySelector(".quiz_box");
    this.score_box = document.querySelector(".score_box");
    this.option_list = document.querySelector(".option_list");
    this.question_text = document.querySelector(".question_text");
    this.question_index = document.querySelector(".question_index");
    this.time_text = document.querySelector(".time_text");
    this.time_second = document.querySelector(".time_second");
    this.time = 60; // Her soru için 10 saniye
    this.btn_next = document.querySelector(".btn_next");
    this.btn_prev = document.querySelector(".btn_prev");
    this.timer = null;
  }

  ready() {
    if (this.btn_start_button) {
      this.btn_start_button.disabled = false;
      this.btn_start_button.innerHTML = '<i class="fas fa-play me-2"></i>Quize Başla';
    }
  }

  showError(message) {
    if (this.btn_start_button) {
      this.btn_start_button.disabled = true;
      this.btn_start_button.innerHTML = `
                <i class="fas fa-exclamation-triangle me-2"></i>${message}
            `;
    }
  }

  showQuiz() {
    this.btn_start.style.display = "none";
    this.quiz_box.style.display = "block";
  }

  // soruGoster metodunu showQuestion olarak değiştirelim
  showQuestion(soru) {
    // Önceki timer'ı temizle
    if (this.timer) {
      clearInterval(this.timer);
    }

    // Zamanlayıcıyı başlat
    this.startTimer();

    let question = `<span>${quiz.questionIndex + 1}. ${soru.question}</span>`;
    let options = '';

    for (let i = 0; i < soru.options.length; i++) {
      // Kullanıcının önceki cevabını kontrol et
      const isSelected = quiz.userAnswers[quiz.questionIndex] === soru.options[i];
      options += `
                <div class="option ${isSelected ? 'selected' : ''}" 
                     onclick="optionSelected(this, '${soru.options[i]}')">
                    <span>${soru.options[i]}</span>
                </div>
            `;
    }

    this.question_text.innerHTML = question;
    this.option_list.innerHTML = options;

    // Son soruda butonu güncelle
    if (quiz.questionIndex === quiz.questions.length - 1) {
      this.btn_next.textContent = "Testi Bitir";
      this.btn_next.classList.remove('btn-primary');
      this.btn_next.classList.add('btn-success');
    } else {
      this.btn_next.textContent = "Sonraki Soru";
      this.btn_next.classList.remove('btn-success');
      this.btn_next.classList.add('btn-primary');
    }
  }

  updateNavigationButtons() {
    // İlk soruda önceki butonu gizle
    if (quiz.questionIndex === 0) {
      this.btn_prev.style.display = "none";
    } else {
      this.btn_prev.style.display = "block";
    }

    // Son soruda "Sonraki" yerine "Testi Bitir" göster
    if (quiz.questionIndex === quiz.questions.length - 1) {
      this.btn_next.innerHTML = 'Testi Bitir <i class="fas fa-check ms-2"></i>';
      this.btn_next.classList.remove('btn-primary');
      this.btn_next.classList.add('btn-success');
    } else {
      this.btn_next.innerHTML = 'Sonraki Soru <i class="fas fa-arrow-right ms-2"></i>';
      this.btn_next.classList.remove('btn-success');
      this.btn_next.classList.add('btn-primary');
    }
  }

  startTimer() {
    this.time = 60; // Süreyi sıfırla
    this.time_second.textContent = this.time;

    this.timer = setInterval(() => {
      this.time--;
      this.time_second.textContent = this.time;

      if (this.time < 0) {
        clearInterval(this.timer);
        // Süre bittiğinde otomatik olarak sonraki soruya geç
        this.autoNext();
      }
    }, 1000);
  }

  autoNext() {
    if (quiz.questions.length !== quiz.questionIndex + 1) {
      quiz.questionIndex++;
      this.showQuestion(quiz.getQuestion());
      this.showQuestionNumber(quiz.questionIndex + 1, quiz.questions.length);
    } else {
      clearInterval(this.timer);
      const results = quiz.calculateScore();
      this.showScore(results);
    }
  }

  resetTimer() {
    this.time = 60;
    this.time_second.textContent = this.time;
  }

  // soruSayisiniGoster metodunu showQuestionNumber olarak değiştirelim
  showQuestionNumber(soruSirasi, toplamSoru) {
    let tag = `<span class="badge bg-warning">${soruSirasi} / ${toplamSoru}</span>`;
    this.question_index.innerHTML = tag;
  }

  // skoruGoster metodunu showScore olarak değiştirelim
  showScore(results) {
    this.quiz_box.style.display = "none";
    this.score_box.style.display = "block";

    // Süreyi formatla
    const minutes = Math.floor(results.time / 60);
    const seconds = results.time % 60;
    const timeString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    // Başarı yüzdesini hesapla
    const percentage = Math.round((results.correct / results.total) * 100);

    // Sonuçları göster
    document.querySelector(".correct_count").textContent = results.correct;
    document.querySelector(".wrong_count").textContent = results.wrong;
    document.querySelector(".empty_count").textContent = results.empty;
    document.querySelector(".finish_time").textContent = timeString;
    document.querySelector(".score_point").textContent = percentage;
    document.querySelector(".success_rate").textContent = `${percentage}%`;

    // Başarı mesajı
    let message = '';
    if (percentage >= 80) message = 'Mükemmel! 🎉';
    else if (percentage >= 60) message = 'İyi! 👏';
    else if (percentage >= 40) message = 'Orta 🤔';
    else message = 'Daha çok çalışmalısın 📚';

    document.querySelector(".score_text").innerHTML = `
            <h4 class="mb-3">${message}</h4>
            <p>Toplam ${results.total} sorudan ${results.correct} doğru, 
               ${results.wrong} yanlış cevap verdiniz.</p>
        `;
  }

  calculateFinishTime() {
    const endTime = new Date();
    const timeDiff = (endTime - this.startTime) / 1000; // saniye cinsinden
    const minutes = Math.floor(timeDiff / 60);
    const seconds = Math.floor(timeDiff % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  startQuiz() {
    this.startTime = new Date(); // Quiz başlangıç zamanını kaydet
  }
}
