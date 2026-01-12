class Question {
    constructor(question, options, correct) {
        this.question = question;
        this.options = options;
        this.correct = correct;
    }

    checkAnswer(answer) {
        return this.correct === answer;
    }
}