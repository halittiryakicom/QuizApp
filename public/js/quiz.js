class Quiz {
  constructor(questions) {
    this.questions = questions;
    this.questionIndex = 0;
    this.correctAnswers = 0;
    this.wrongAnswers = 0;
    this.userAnswers = new Array(questions.length).fill(null);
    this.startTime = new Date();
  }

  getQuestion() {
    return this.questions[this.questionIndex];
  }

  saveAnswer(answer) {
    this.userAnswers[this.questionIndex] = answer;
  }

  calculateScore() {
    this.correctAnswers = 0;
    this.wrongAnswers = 0;

    this.questions.forEach((question, index) => {
      const userAnswer = this.userAnswers[index];
      if (userAnswer !== null) {
        const correctAnswer = question.options[question.correct];
        if (userAnswer === correctAnswer) {
          this.correctAnswers++;
        } else {
          this.wrongAnswers++;
        }
      }
    });

    this.endTime = new Date();
    return {
      total: this.questions.length,
      correct: this.correctAnswers,
      wrong: this.wrongAnswers,
      empty: this.questions.length - (this.correctAnswers + this.wrongAnswers),
      time: Math.floor((this.endTime - this.startTime) / 1000)
    };
  }

  start() {
    this.startTime = new Date();
  }

  isFinish() {
    return this.questions.length === this.questionIndex;
  }
}
