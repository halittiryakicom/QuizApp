let questions = [];

document.addEventListener('DOMContentLoaded', function () {
    loadQuestions();

    const form = document.getElementById('questionForm');
    form.addEventListener('submit', handleSubmit);
});

async function loadQuestions() {
    try {
        const response = await fetch('/data/questions.json');
        questions = await response.json();
        displayQuestions(questions);
    } catch (error) {
        showMessage('Sorular yüklenirken hata oluştu', 'danger');
    }
}

function displayQuestions(questions) {
    const questionsList = document.getElementById('questionsList');
    if (!questionsList) return;

    const html = questions.map((q, index) => `
        <div class="col-md-6">
            <div class="card h-100 position-relative">
                <div class="question-number">${index + 1}</div>
                <div class="card-body">
                    <h5 class="card-title mb-3">${q.question}</h5>
                    <div class="options-list">
                        ${q.options.map((opt, i) => `
                            <p class="mb-2 ${i === q.correct ? 'text-success fw-bold' : ''}">
                                ${i === q.correct ? '<i class="fas fa-check-circle me-2"></i>' : '<i class="fas fa-circle me-2"></i>'}
                                ${opt}
                            </p>
                        `).join('')}
                    </div>
                </div>
                <div class="card-footer bg-light">
                    <button class="btn btn-warning btn-sm me-2" onclick="editQuestion(${index})">
                        <i class="fas fa-edit me-2"></i>Düzenle
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteQuestion(${index})">
                        <i class="fas fa-trash me-2"></i>Sil
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    questionsList.innerHTML = html;
}

async function handleSubmit(e) {
    e.preventDefault();

    const questionId = document.getElementById('questionId').value;
    const newQuestion = {
        question: document.getElementById('question').value,
        options: [
            document.getElementById('option1').value,
            document.getElementById('option2').value,
            document.getElementById('option3').value,
            document.getElementById('option4').value
        ],
        correct: parseInt(document.getElementById('correctAnswer').value)
    };

    try {
        if (questionId === '') {
            // Yeni soru ekleme
            questions.push(newQuestion);
        } else {
            // Mevcut soruyu güncelleme
            questions[parseInt(questionId)] = newQuestion;
        }

        // Soruları sunucuya kaydet
        const response = await fetch('/api/questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(questions)
        });

        if (response.ok) {
            showMessage(questionId === '' ? 'Soru başarıyla eklendi' : 'Soru başarıyla güncellendi');
            resetForm();
            loadQuestions();
        } else {
            throw new Error('Kayıt başarısız');
        }
    } catch (error) {
        showMessage('Soru kaydedilirken hata oluştu', 'danger');
    }
}

function editQuestion(index) {
    const question = questions[index];
    document.getElementById('questionId').value = index;
    document.getElementById('question').value = question.question;
    document.getElementById('option1').value = question.options[0];
    document.getElementById('option2').value = question.options[1];
    document.getElementById('option3').value = question.options[2];
    document.getElementById('option4').value = question.options[3];
    document.getElementById('correctAnswer').value = question.correct;
    document.getElementById('formTitle').textContent = 'Soru Düzenle';

    // Scroll to form
    document.querySelector('.card').scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
    document.getElementById('questionForm').reset();
    document.getElementById('questionId').value = '';
    document.getElementById('formTitle').textContent = 'Yeni Soru Ekle';
}

async function deleteQuestion(index) {
    if (!confirm('Bu soruyu silmek istediğinizden emin misiniz?')) return;

    try {
        questions.splice(index, 1);
        const response = await fetch('/api/questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(questions)
        });

        if (response.ok) {
            showMessage('Soru başarıyla silindi');
            loadQuestions();
        } else {
            throw new Error('Silme işlemi başarısız');
        }
    } catch (error) {
        showMessage('Soru silinirken hata oluştu', 'danger');
    }
}

function showMessage(message, type = 'success') {
    const messageArea = document.getElementById('messageArea');
    messageArea.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}