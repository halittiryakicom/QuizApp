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
        image: '',
        imageUrl: '',
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
                <i class="fas fa-clipboard-list fa-4x mb-3" style="opacity: 0.3;"></i>
                <p class="fs-5">Henüz soru eklenmedi</p>
                <p class="small">Yukarıdaki menüden soru türünü seçerek başlayın</p>
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
    card.className = 'question-card';
    card.dataset.questionId = question.id;

    const typeNames = {
        'multiple': 'Çoktan Seçmeli',
        'truefalse': 'Doğru/Yanlış',
        'fillblank': 'Boşluk Doldurma',
        'matching': 'Eşleştirme'
    };

    const typeIcons = {
        'multiple': 'fa-check-circle',
        'truefalse': 'fa-toggle-on',
        'fillblank': 'fa-keyboard',
        'matching': 'fa-exchange-alt'
    };

    card.innerHTML = `
        <div class="question-card-header">
            <div class="question-number">
                <i class="fas ${typeIcons[question.type] || 'fa-question-circle'}"></i>
                <span>Soru ${index + 1}</span>
                <span class="badge bg-white text-primary ms-2" style="font-size: 0.8rem;">${typeNames[question.type]}</span>
            </div>
            <div class="action-buttons">
                <button class="btn btn-sm btn-warning" onclick="editQuestion(${question.id})" style="border-radius: 8px; font-weight: 600;">
                    <i class="fas fa-edit"></i> Düzenle
                </button>
                <button class="btn-delete-question" onclick="deleteQuestion(${question.id})">
                    <i class="fas fa-trash-alt"></i> Sil
                </button>
            </div>
        </div>
        <div class="question-card-body">
            <div id="question-display-${question.id}">
                ${question.image || question.imageUrl ? `<div class="image-preview-container mb-3"><img src="${question.image || question.imageUrl}" class="img-fluid" alt="Soru görseli" onerror="this.style.display='none'"></div>` : ''}
                ${question.questionText ? `<p class="fs-5 mb-0"><strong>${question.questionText}</strong></p>` : '<p class="text-muted fst-italic">Soru metni girilmedi - Düzenle butonuna tıklayın</p>'}
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
        <div class="mb-4">
            <label class="modern-label">
                <i class="fas fa-align-left"></i>
                Soru Metni
                <span class="required-star">*</span>
            </label>
            <textarea class="form-control modern-textarea" id="qtext-${question.id}" rows="3" placeholder="Sorunuzu buraya yazın...">${question.questionText}</textarea>
        </div>
        <div class="mb-4">
            <label class="modern-label">
                <i class="fas fa-image"></i>
                Soru Görseli
                <span class="badge bg-secondary ms-2" style="font-size: 0.7rem;">Opsiyonel</span>
            </label>
            <div class="image-upload-area" id="uploadArea-${question.id}" 
                 ondragover="handleDragOverCreate(event, ${question.id})" 
                 ondragleave="handleDragLeaveCreate(event, ${question.id})" 
                 ondrop="handleDropCreate(event, ${question.id})"
                 onclick="document.getElementById('fileInput-${question.id}').click()">
                <div class="upload-icon">
                    <i class="fas fa-cloud-upload-alt"></i>
                </div>
                <div class="upload-text">Görseli Sürükle & Bırak</div>
                <div class="upload-subtext">veya tıklayarak dosya seç (Max: 500KB)</div>
                <input type="file" id="fileInput-${question.id}" accept="image/*" style="display: none;" onchange="handleFileSelectCreate(event, ${question.id})">
            </div>
            <div class="image-preview-container" id="imagePreview-${question.id}" style="display: none;">
                <img src="" class="img-fluid" alt="Soru görseli">
                <button type="button" class="remove-image-btn" onclick="removeImageCreate(${question.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;

    if (question.type === 'multiple') {
        const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
        const optionClasses = ['option-a', 'option-b', 'option-c', 'option-d', 'option-a', 'option-b'];
        const labelClasses = ['label-a', 'label-b', 'label-c', 'label-d', 'label-a', 'label-b'];

        html += `
            <div class="mb-3">
                <label class="modern-label">
                    <i class="fas fa-list-ul"></i>
                    Cevap Şıkları
                    <span class="required-star">*</span>
                </label>
            </div>
            <div class="option-group mb-3" id="options-${question.id}">
                ${question.options.map((opt, i) => `
                    <div class="option-card ${optionClasses[i % 4]}">
                        <div class="option-label ${labelClasses[i % 4]}">${optionLabels[i]}</div>
                        <div class="option-input-wrapper">
                            <input type="text" class="form-control" value="${opt}" id="opt-${question.id}-${i}" placeholder="${optionLabels[i]} şıkkını girin...">
                        </div>
                        ${question.options.length > 2 ? `
                        <button class="btn btn-sm btn-danger mt-2 w-100" onclick="removeOption(${question.id}, ${i})">
                            <i class="fas fa-times"></i> Sil
                        </button>` : ''}
                    </div>
                `).join('')}
            </div>
            <button class="btn btn-sm btn-outline-primary mb-4" onclick="addOption(${question.id})" style="border-radius: 8px;">
                <i class="fas fa-plus-circle"></i> Yeni Şık Ekle
            </button>
            <div class="correct-answer-section">
                <label class="modern-label mb-2">
                    <i class="fas fa-check-circle"></i>
                    Doğru Cevap
                    <span class="required-star">*</span>
                </label>
                <select class="form-select correct-answer-select" id="correct-${question.id}">
                    ${question.options.map((opt, i) => `
                        <option value="${i}" ${i === question.correctAnswer ? 'selected' : ''}>${optionLabels[i]}) ${i + 1}. Şık</option>
                    `).join('')}
                </select>
            </div>
        `;
    } else if (question.type === 'truefalse') {
        html += `
            <div class="correct-answer-section">
                <label class="modern-label mb-2">
                    <i class="fas fa-check-circle"></i>
                    Doğru Cevap
                    <span class="required-star">*</span>
                </label>
                <select class="form-select correct-answer-select" id="correct-${question.id}">
                    <option value="true" ${question.correctAnswer === true ? 'selected' : ''}>✓ Doğru</option>
                    <option value="false" ${question.correctAnswer === false ? 'selected' : ''}>✗ Yanlış</option>
                </select>
            </div>
        `;
    } else if (question.type === 'fillblank') {
        html += `
            <div class="mb-3">
                <label class="modern-label">
                    <i class="fas fa-spell-check"></i>
                    Kabul Edilecek Cevaplar
                    <span class="required-star">*</span>
                </label>
                <input type="text" class="form-control modern-input" id="answers-${question.id}" 
                       value="${question.correctAnswers.join(', ')}" 
                       placeholder="cevap1, cevap2, cevap3">
                <small class="text-muted mt-1 d-block">
                    <i class="fas fa-info-circle"></i> Birden fazla doğru cevap varsa virgülle ayırın
                </small>
            </div>
        `;
    }

    html += `
        <div class="section-divider"></div>
        <div class="d-flex gap-2 justify-content-end">
            <button class="btn btn-secondary" onclick="cancelEdit(${question.id})" style="border-radius: 8px; padding: 8px 20px;">
                <i class="fas fa-times"></i> İptal
            </button>
            <button class="btn btn-success" onclick="saveQuestion(${question.id})" style="border-radius: 8px; padding: 8px 20px; font-weight: 600;">
                <i class="fas fa-save"></i> Kaydet
            </button>
        </div>
    `;

    return html;
}

// Soru düzenle
function editQuestion(id) {
    document.getElementById(`question-display-${id}`).style.display = 'none';
    document.getElementById(`question-edit-${id}`).style.display = 'block';

    // Mevcut görseli göster
    const question = questions.find(q => q.id === id);
    if (question && (question.image || question.imageUrl)) {
        setTimeout(() => {
            showImagePreviewCreate(id, question.image || question.imageUrl);
            const uploadArea = document.getElementById(`uploadArea-${id}`);
            if (uploadArea) {
                uploadArea.style.display = 'none';
            }
        }, 100);
    }
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
    // Görsel verisi zaten processImageFileCreate fonksiyonunda question objesine kaydediliyor

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

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server hatası:', errorText);
            alert(`❌ Test kaydedilemedi! Sunucu hatası: ${response.status}\n\nGörseller çok büyük olabilir. Lütfen daha küçük görseller kullanın.`);
            return;
        }

        const result = await response.json();

        if (result.success) {
            alert('✅ Test başarıyla kaydedildi!');
            window.location.href = '/teacher';
        } else {
            alert('❌ Test kaydedilemedi: ' + (result.error || 'Bilinmeyen hata'));
        }
    } catch (error) {
        console.error('Test kaydetme hatası:', error);
        alert('❌ Hata oluştu: ' + error.message + '\n\nGörseller çok büyük olabilir. Lütfen daha küçük görseller kullanın.');
    }
}

// İlk yükleme
updateQuestionCount();

// ==================== DRAG & DROP GÖRSEL YÜKLEME ====================

// Drag & Drop event handlers
function handleDragOverCreate(event, questionId) {
    event.preventDefault();
    event.stopPropagation();
    const uploadArea = document.getElementById(`uploadArea-${questionId}`);
    if (uploadArea) {
        uploadArea.classList.add('drag-over');
    }
}

function handleDragLeaveCreate(event, questionId) {
    event.preventDefault();
    event.stopPropagation();
    const uploadArea = document.getElementById(`uploadArea-${questionId}`);
    if (uploadArea) {
        uploadArea.classList.remove('drag-over');
    }
}

function handleDropCreate(event, questionId) {
    event.preventDefault();
    event.stopPropagation();

    const uploadArea = document.getElementById(`uploadArea-${questionId}`);
    if (uploadArea) {
        uploadArea.classList.remove('drag-over');
    }

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processImageFileCreate(files[0], questionId);
    }
}

function handleFileSelectCreate(event, questionId) {
    const files = event.target.files;
    if (files.length > 0) {
        processImageFileCreate(files[0], questionId);
    }
}

// Görsel dosyasını işle ve base64'e çevir
function processImageFileCreate(file, questionId) {
    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
        alert('Lütfen sadece görsel dosyası yükleyin!');
        return;
    }

    // Dosya boyutu kontrolü (max 5MB orijinal boyut)
    if (file.size > 5 * 1024 * 1024) {
        alert('Görsel boyutu 5MB\'dan küçük olmalıdır!');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            // Görseli yeniden boyutlandır ve sıkıştır
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Maksimum boyut 800px
            const maxSize = 800;
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = (height / width) * maxSize;
                    width = maxSize;
                } else {
                    width = (width / height) * maxSize;
                    height = maxSize;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // JPEG formatında %80 kalite ile sıkıştır
            const base64Data = canvas.toDataURL('image/jpeg', 0.8);

            // Boyut kontrolü (sıkıştırılmış hali max 500KB olmalı)
            const sizeInKB = (base64Data.length * 3) / 4 / 1024;
            if (sizeInKB > 500) {
                alert('Görsel çok büyük! Lütfen daha küçük bir görsel seçin veya boyutunu küçültün.');
                return;
            }

            // Question objesini bul ve görseli kaydet
            const question = questions.find(q => q.id === questionId);
            if (question) {
                question.image = base64Data;
                question.imageUrl = base64Data;
            }

            // Önizlemeyi göster
            showImagePreviewCreate(questionId, base64Data);

            // Upload alanını gizle
            const uploadArea = document.getElementById(`uploadArea-${questionId}`);
            if (uploadArea) {
                uploadArea.style.display = 'none';
            }
        };

        img.onerror = function () {
            alert('Görsel yüklenirken bir hata oluştu!');
        };

        img.src = e.target.result;
    };

    reader.onerror = function () {
        alert('Dosya okunurken bir hata oluştu!');
    };

    reader.readAsDataURL(file);
}

// Görsel önizlemeyi göster
function showImagePreviewCreate(questionId, imageData) {
    const preview = document.getElementById(`imagePreview-${questionId}`);
    if (!preview) return;

    if (imageData && imageData.trim()) {
        const img = preview.querySelector('img');
        img.src = imageData;
        img.onload = () => {
            preview.style.display = 'block';
        };
        img.onerror = () => {
            preview.style.display = 'none';
        };
    } else {
        preview.style.display = 'none';
    }
}

// Görseli kaldır
function removeImageCreate(questionId) {
    // Question objesinden görseli sil
    const question = questions.find(q => q.id === questionId);
    if (question) {
        question.image = '';
        question.imageUrl = '';
    }

    // Önizlemeyi gizle
    const preview = document.getElementById(`imagePreview-${questionId}`);
    if (preview) {
        preview.style.display = 'none';
    }

    // Upload alanını göster
    const uploadArea = document.getElementById(`uploadArea-${questionId}`);
    if (uploadArea) {
        uploadArea.style.display = 'block';
    }

    // File input'u temizle
    const fileInput = document.getElementById(`fileInput-${questionId}`);
    if (fileInput) {
        fileInput.value = '';
    }
}

// ==================== KATEGORİ YÖNETİMİ ====================

let categoryManagementModal = null;
let allCategories = [];

// Kategorileri yükle ve select'i doldur
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        allCategories = await response.json();

        // Kategori select'ini güncelle
        updateCategorySelect();

        return allCategories;
    } catch (error) {
        console.error('Kategoriler yüklenirken hata:', error);
        return [];
    }
}

// Kategori select'ini güncelle
function updateCategorySelect() {
    const select = document.getElementById('testCategory');
    const currentValue = select ? select.value : '';

    if (select) {
        select.innerHTML = allCategories.map(cat =>
            `<option value="${cat.name}" ${cat.name === currentValue ? 'selected' : ''}>${cat.name}</option>`
        ).join('');

        // İlk kategoriyi seç
        if (!currentValue && allCategories.length > 0) {
            select.value = allCategories[0].name;
        }
    }
}

// Kategori yönetimi modalını aç
function openCategoryManagement() {
    if (!categoryManagementModal) {
        const modalElement = document.getElementById('categoryManagementModal');
        categoryManagementModal = new bootstrap.Modal(modalElement);
    }

    // Kategorileri yükle ve listele
    loadCategoriesInModal();
    categoryManagementModal.show();
}

// Modal'da kategorileri listele
async function loadCategoriesInModal() {
    const container = document.getElementById('categoriesList');
    container.innerHTML = `
        <div class="text-center py-4">
            <i class="fas fa-spinner fa-spin fa-2x text-primary"></i>
            <p class="mt-2">Kategoriler yükleniyor...</p>
        </div>
    `;

    try {
        const categories = await loadCategories();

        if (categories.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-folder-open fa-3x mb-3"></i>
                    <p>Henüz kategori eklenmedi</p>
                </div>
            `;
            return;
        }

        container.innerHTML = categories.map(cat => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <i class="fas fa-tag text-primary me-2"></i>
                    <span id="catName-${cat.id}">${cat.name}</span>
                </div>
                <div>
                    <button class="btn btn-sm btn-warning" onclick="editCategoryInline('${cat.id}', '${cat.name.replace(/'/g, "\\'")}')">
                        <i class="fas fa-edit"></i> Düzenle
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCategory('${cat.id}', '${cat.name.replace(/'/g, "\\'")}')">
                        <i class="fas fa-trash"></i> Sil
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i> Kategoriler yüklenirken hata oluştu!
            </div>
        `;
    }
}

// Yeni kategori ekle
async function addCategory() {
    const input = document.getElementById('newCategoryName');
    const name = input.value.trim();

    if (!name) {
        alert('Lütfen kategori adı girin!');
        return;
    }

    try {
        const response = await fetch('/api/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.error || 'Kategori eklenirken hata oluştu!');
            return;
        }

        input.value = '';
        alert('✅ Kategori başarıyla eklendi!');
        loadCategoriesInModal();

    } catch (error) {
        console.error('Kategori ekleme hatası:', error);
        alert('Kategori eklenirken hata oluştu!');
    }
}

// Kategori inline düzenle
function editCategoryInline(id, currentName) {
    const newName = prompt('Yeni kategori adı:', currentName);

    if (!newName || newName.trim() === '') {
        return;
    }

    if (newName.trim() === currentName) {
        return;
    }

    updateCategory(id, newName.trim());
}

// Kategori güncelle
async function updateCategory(id, name) {
    try {
        const response = await fetch(`/api/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.error || 'Kategori güncellenirken hata oluştu!');
            return;
        }

        alert('✅ Kategori başarıyla güncellendi!');
        loadCategoriesInModal();

    } catch (error) {
        console.error('Kategori güncelleme hatası:', error);
        alert('Kategori güncellenirken hata oluştu!');
    }
}

// Kategori sil
async function deleteCategory(id, name) {
    if (!confirm(`"${name}" kategorisini silmek istediğinizden emin misiniz?\n\nBu kategoriye ait testler varsa silinemez.`)) {
        return;
    }

    try {
        const response = await fetch(`/api/categories/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.error || 'Kategori silinirken hata oluştu!');
            return;
        }

        alert('✅ Kategori başarıyla silindi!');
        loadCategoriesInModal();

    } catch (error) {
        console.error('Kategori silme hatası:', error);
        alert('Kategori silinirken hata oluştu!');
    }
}

// Sayfa yüklendiğinde kategorileri yükle
loadCategories();
