// Giriş kontrolü
const teacherToken = localStorage.getItem('teacherToken');
const teacherName = localStorage.getItem('teacherName');

if (!teacherToken) {
    alert('⚠️ Test oluşturmak için önce giriş yapmalısınız!');
    window.location.href = '/login';
}

// Header'da kullanıcı adını göster
if (document.getElementById('headerUserName')) {
    document.getElementById('headerUserName').textContent = teacherName || 'Kullanıcı';
}

// Çıkış fonksiyonu
function logout() {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        localStorage.removeItem('teacherToken');
        localStorage.removeItem('teacherName');
        localStorage.removeItem('teacherUsername');
        window.location.href = '/login';
    }
}

let questions = [];

// Soru sayısını güncelle
function updateQuestionCount() {
    document.getElementById('questionCount').textContent = questions.length;
}

// Soru ekle
function addQuestion(type) {
    const questionObj = {
        id: Date.now(),
        type: type,
        questionText: '',
        options: type === 'multiple' ? ['Seçenek 1', 'Seçenek 2'] : [],
        correctAnswer: type === 'multiple' ? 0 : (type === 'truefalse' ? true : null),
        correctAnswers: [],
        pairs: []
    };

    questions.push(questionObj);
    renderQuestions();
    updateQuestionCount();
    editQuestion(questionObj.id);

    return false;
}

// Soruları render et
function renderQuestions() {
    const container = document.getElementById('questionsContainer');

    if (questions.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-clipboard-list fa-4x mb-3"></i>
                <p>Henüz soru eklenmedi. Yukarıdaki menüden soru ekleyin.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    questions.forEach((q, index) => {
        const card = createQuestionCard(q, index);
        container.appendChild(card);
    });
}

// Soru kartı oluştur
function createQuestionCard(question, index) {
    const card = document.createElement('div');
    card.className = 'card question-card mb-3';
    card.dataset.questionId = question.id;

    const typeNames = {
        'multiple': 'Çoktan Seçmeli',
        'truefalse': 'Doğru/Yanlış',
        'fillblank': 'Boşluk Doldurma',
        'matching': 'Eşleştirme'
    };

    card.innerHTML = `
        <div class="card-header bg-light">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <span class="badge bg-primary me-2">#${index + 1}</span>
                    <span class="badge bg-info">${typeNames[question.type]}</span>
                </div>
                <div>
                    <button class="btn btn-sm btn-warning" onclick="editQuestion(${question.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteQuestion(${question.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="card-body">
            <div id="question-display-${question.id}">
                ${question.questionText ? `<p><strong>${question.questionText}</strong></p>` : '<p class="text-muted">Soru metni girilmedi - Düzenle butonuna tıklayın</p>'}
            </div>
            <div id="question-edit-${question.id}" style="display: none;">
                ${renderQuestionEditor(question)}
            </div>
        </div>
    `;

    return card;
}

// Soru düzenleyici
function renderQuestionEditor(question) {
    let html = `
        <div class="mb-3">
            <label class="form-label">Soru Metni</label>
            <textarea class="form-control" id="qtext-${question.id}" rows="2">${question.questionText}</textarea>
        </div>
    `;

    if (question.type === 'multiple') {
        html += `
            <div class="mb-3">
                <label class="form-label">Seçenekler</label>
                <div id="options-${question.id}">
                    ${question.options.map((opt, i) => `
                        <div class="input-group mb-2">
                            <input type="text" class="form-control" value="${opt}" id="opt-${question.id}-${i}">
                            <button class="btn btn-outline-danger" onclick="removeOption(${question.id}, ${i})">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-sm btn-outline-primary" onclick="addOption(${question.id})">
                    <i class="fas fa-plus"></i> Seçenek Ekle
                </button>
            </div>
            <div class="mb-3">
                <label class="form-label">Doğru Cevap</label>
                <select class="form-select" id="correct-${question.id}">
                    ${question.options.map((opt, i) => `
                        <option value="${i}" ${i === question.correctAnswer ? 'selected' : ''}>${i + 1}. Seçenek</option>
                    `).join('')}
                </select>
            </div>
        `;
    } else if (question.type === 'truefalse') {
        html += `
            <div class="mb-3">
                <label class="form-label">Doğru Cevap</label>
                <select class="form-select" id="correct-${question.id}">
                    <option value="true" ${question.correctAnswer === true ? 'selected' : ''}>Doğru</option>
                    <option value="false" ${question.correctAnswer === false ? 'selected' : ''}>Yanlış</option>
                </select>
            </div>
        `;
    } else if (question.type === 'fillblank') {
        html += `
            <div class="mb-3">
                <label class="form-label">Kabul Edilecek Cevaplar (virgülle ayırın)</label>
                <input type="text" class="form-control" id="answers-${question.id}" 
                       value="${question.correctAnswers.join(', ')}" 
                       placeholder="cevap1, cevap2, cevap3">
                <small class="text-muted">Birden fazla doğru cevap varsa virgülle ayırın</small>
            </div>
        `;
    }

    html += `
        <div class="d-flex gap-2">
            <button class="btn btn-success" onclick="saveQuestion(${question.id})">
                <i class="fas fa-save"></i> Kaydet
            </button>
            <button class="btn btn-secondary" onclick="cancelEdit(${question.id})">
                İptal
            </button>
        </div>
    `;

    return html;
}

// Soru düzenle
function editQuestion(id) {
    document.getElementById(`question-display-${id}`).style.display = 'none';
    document.getElementById(`question-edit-${id}`).style.display = 'block';
}

// Düzenlemeyi iptal et
function cancelEdit(id) {
    document.getElementById(`question-display-${id}`).style.display = 'block';
    document.getElementById(`question-edit-${id}`).style.display = 'none';
}

// Soruyu kaydet
function saveQuestion(id) {
    const question = questions.find(q => q.id === id);
    if (!question) return;

    question.questionText = document.getElementById(`qtext-${id}`).value;

    if (question.type === 'multiple') {
        // Seçenekleri güncelle
        question.options = question.options.map((opt, i) => {
            const input = document.getElementById(`opt-${id}-${i}`);
            return input ? input.value : opt;
        });
        question.correctAnswer = parseInt(document.getElementById(`correct-${id}`).value);
    } else if (question.type === 'truefalse') {
        question.correctAnswer = document.getElementById(`correct-${id}`).value === 'true';
    } else if (question.type === 'fillblank') {
        const answersText = document.getElementById(`answers-${id}`).value;
        question.correctAnswers = answersText.split(',').map(a => a.trim()).filter(a => a);
    }

    renderQuestions();
}

// Seçenek ekle
function addOption(questionId) {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    question.options.push('Yeni seçenek');
    renderQuestions();
    editQuestion(questionId);
}

// Seçenek sil
function removeOption(questionId, index) {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    if (question.options.length <= 2) {
        alert('En az 2 seçenek olmalıdır!');
        return;
    }

    question.options.splice(index, 1);
    if (question.correctAnswer >= index && question.correctAnswer > 0) {
        question.correctAnswer--;
    }
    renderQuestions();
    editQuestion(questionId);
}

// Soru sil
function deleteQuestion(id) {
    if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;

    questions = questions.filter(q => q.id !== id);
    renderQuestions();
    updateQuestionCount();
}

// Testi kaydet
async function saveTest() {
    const title = document.getElementById('testTitle').value.trim();
    const description = document.getElementById('testDescription').value.trim();
    const category = document.getElementById('testCategory').value;
    const timePerQuestion = parseInt(document.getElementById('timePerQuestion').value);

    if (!title) {
        alert('Lütfen test başlığı girin!');
        document.getElementById('testTitle').focus();
        return;
    }

    if (questions.length === 0) {
        alert('Lütfen en az bir soru ekleyin!');
        return;
    }

    // Soruları kontrol et
    for (let q of questions) {
        if (!q.questionText) {
            alert('Tüm soruların metnini doldurmalısınız!');
            return;
        }

        if (q.type === 'multiple' && (q.options.length < 2 || q.correctAnswer === null)) {
            alert('Çoktan seçmeli sorularda en az 2 seçenek ve doğru cevap olmalı!');
            return;
        }

        if (q.type === 'fillblank' && q.correctAnswers.length === 0) {
            alert('Boşluk doldurma sorularında en az bir kabul edilen cevap olmalı!');
            return;
        }
    }

    const testData = {
        title,
        description,
        category,
        timePerQuestion,
        questions
    };

    try {
        const response = await fetch('/api/tests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ Test başarıyla kaydedildi!');
            window.location.href = '/teacher';
        } else {
            alert('❌ Test kaydedilemedi!');
        }
    } catch (error) {
        alert('Hata oluştu: ' + error.message);
    }
}

// İlk yükleme
updateQuestionCount();
