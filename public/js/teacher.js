const socket = io();

// Giriş kontrolü
const teacherToken = localStorage.getItem('teacherToken');
const teacherName = localStorage.getItem('teacherName');

if (!teacherToken) {
    window.location.href = '/login';
}

let currentRoom = null;
let roomCode = null;
let selectedTest = null;

// Form elementleri
const testSelectionSection = document.getElementById('testSelectionSection');
const createRoomSection = document.getElementById('createRoomSection');
const roomManageSection = document.getElementById('roomManageSection');
const teacherNameInput = document.getElementById('teacherName');
const testList = document.getElementById('testList');

// Oda bilgileri elementleri
const roomCodeDisplay = document.getElementById('roomCodeDisplay');
const totalQuestions = document.getElementById('totalQuestions');
const totalTime = document.getElementById('totalTime');
const studentCount = document.getElementById('studentCount');
const roomStatus = document.getElementById('roomStatus');
const statusIcon = document.getElementById('statusIcon');
const startQuizBtn = document.getElementById('startQuizBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');

// Liste elementleri
const studentList = document.getElementById('studentList');
const resultsList = document.getElementById('resultsList');

// ==================== TESTLERİ YÜKLE ====================
async function loadTests() {
    try {
        const response = await fetch('/api/tests');
        const tests = await response.json();

        allTests = tests; // Global değişkene kaydet

        if (tests.length === 0) {
            testList.innerHTML = `
                <div class="col-12 text-center py-4">
                    <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Henüz test oluşturulmamış</p>
                    <a href="/create-test" class="btn btn-primary">
                        <i class="fas fa-plus"></i> İlk Testi Oluştur
                    </a>
                </div>
            `;
            return;
        }

        displayTests(tests);
    } catch (error) {
        console.error('Testler yüklenirken hata:', error);
        testList.innerHTML = `
            <div class="col-12 text-center py-4 text-danger">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <p>Testler yüklenirken hata oluştu!</p>
            </div>
        `;
    }
}

// Test kartı oluştur
function createTestCard(test) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';

    // Test objesini escape et
    const testDataEscaped = JSON.stringify(test)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '&quot;');

    col.innerHTML = `
        <div class="card h-100 shadow-sm test-card" style="cursor: pointer; transition: all 0.3s;"
             onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 20px rgba(0,0,0,0.2)';"
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 5px rgba(0,0,0,0.1)';">
            <div class="card-body">
                <h5 class="card-title text-primary">
                    <i class="fas fa-clipboard-check"></i> ${test.title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                </h5>
                <p class="card-text text-muted small">${(test.description || 'Açıklama yok').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                <div class="mb-2">
                    <span class="badge bg-info">${test.category}</span>
                    <span class="badge bg-secondary">${test.questions.length} Soru</span>
                    <span class="badge bg-warning text-dark">${test.timePerQuestion}s/soru</span>
                </div>
                <div class="small text-muted">
                    <i class="fas fa-play-circle"></i> ${test.playCount || 0} kez oynatıldı
                </div>
            </div>
            <div class="card-footer bg-transparent">
                <div class="d-grid gap-2">
                    <button class="btn btn-primary btn-sm" data-test-id="${test.id}" onclick="selectTestById('${test.id}')">
                        <i class="fas fa-check-circle"></i> Bu Testi Seç
                    </button>
                    <div class="btn-group">
                        <button class="btn btn-outline-warning btn-sm" onclick="event.stopPropagation(); editTest('${test.id}')">
                            <i class="fas fa-edit"></i> Düzenle
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="event.stopPropagation(); deleteTest('${test.id}', '${test.title.replace(/'/g, "\\'")}')">
                            <i class="fas fa-trash"></i> Sil
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    return col;
}

// Test ID'ye göre seç
function selectTestById(testId) {
    const test = allTests.find(t => t.id === testId);
    if (test) {
        selectTest(test);
    }
}

// Test seç ve oda oluştur
async function selectTest(test) {
    const teacherName = teacherNameInput.value.trim();

    if (!teacherName) {
        alert('Lütfen öğretmen adınızı girin!');
        teacherNameInput.focus();
        return;
    }

    selectedTest = test;

    try {
        const response = await fetch('/api/create-room-from-test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                teacherName,
                testId: test.id
            })
        });

        const data = await response.json();

        if (data.success) {
            currentRoom = data.room;
            roomCode = data.roomCode;

            // Oda yönetim ekranına geç
            showRoomManagement();

            // Socket ile odaya katıl
            socket.emit('teacher-join-room', { roomCode });
        }
    } catch (error) {
        alert('Oda oluşturulurken hata oluştu: ' + error.message);
    }
}

// Sayfa yüklendiğinde testleri yükle
if (document.getElementById('welcomeName')) {
    document.getElementById('welcomeName').textContent = teacherName;
}
if (document.getElementById('headerUserName')) {
    document.getElementById('headerUserName').textContent = teacherName;
}
document.getElementById('teacherName').value = teacherName;
loadTests();

// Çıkış fonksiyonu
function logout() {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        localStorage.removeItem('teacherToken');
        localStorage.removeItem('teacherName');
        localStorage.removeItem('teacherUsername');
        window.location.href = '/login';
    }
}

// Arama ve filtreleme
let allTests = [];

document.getElementById('testSearch').addEventListener('input', filterTests);
document.getElementById('categoryFilter').addEventListener('change', filterTests);

function filterTests() {
    const searchTerm = document.getElementById('testSearch').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;

    const filtered = allTests.filter(test => {
        const matchesSearch = test.title.toLowerCase().includes(searchTerm) ||
            (test.description && test.description.toLowerCase().includes(searchTerm));
        const matchesCategory = !category || test.category === category;

        return matchesSearch && matchesCategory;
    });

    displayTests(filtered);
}

function displayTests(tests) {
    if (tests.length === 0) {
        testList.innerHTML = `
            <div class="col-12 text-center py-4">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <p class="text-muted">Aradığınız kriterlere uygun test bulunamadı</p>
            </div>
        `;
        return;
    }

    testList.innerHTML = '';
    tests.forEach(test => {
        const testCard = createTestCard(test);
        testList.appendChild(testCard);
    });
}

// ==================== ODA YÖNETİMİ GÖSTER ====================
function showRoomManagement() {
    testSelectionSection.style.display = 'none';
    createRoomSection.style.display = 'none';
    roomManageSection.style.display = 'block';

    // Oda bilgilerini göster
    roomCodeDisplay.textContent = roomCode;
    totalQuestions.textContent = currentRoom.questionCount;
    totalTime.textContent = Math.ceil((currentRoom.questionCount * currentRoom.timePerQuestion) / 60);

    updateRoomStatus('WAITING');
}

// ==================== ODA DURUMU GÜNCELLE ====================
function updateRoomStatus(status) {
    statusIcon.className = 'fas fa-circle';

    switch (status) {
        case 'WAITING':
            roomStatus.textContent = 'Bekliyor';
            statusIcon.classList.add('waiting', 'text-warning');
            break;
        case 'ACTIVE':
            roomStatus.textContent = 'Aktif';
            statusIcon.classList.add('active', 'text-success');
            startQuizBtn.disabled = true;
            startQuizBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Test Devam Ediyor';
            break;
        case 'FINISHED':
            roomStatus.textContent = 'Bitti';
            statusIcon.classList.add('finished', 'text-danger');
            break;
    }
}

// ==================== ÖĞRENCİ LİSTESİ GÜNCELLE ====================
function updateStudentList(students) {
    studentCount.textContent = students.length;

    if (students.length === 0) {
        studentList.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-users fa-3x mb-3"></i>
                <p>Henüz kimse katılmadı</p>
            </div>
        `;
        startQuizBtn.disabled = true;
        return;
    }

    studentList.innerHTML = '';
    students.forEach((student, index) => {
        const joinTime = new Date(student.joinedAt).toLocaleTimeString('tr-TR');
        const item = document.createElement('div');
        item.className = 'list-group-item student-item';
        item.innerHTML = `
            <div>
                <i class="fas fa-user-circle text-primary me-2"></i>
                <span class="student-name">${student.name}</span>
            </div>
            <div class="student-time">${joinTime}</div>
        `;
        studentList.appendChild(item);
    });

    // En az 1 öğrenci varsa başlat butonunu aktif et
    startQuizBtn.disabled = false;
}

// ==================== SONUÇLARI GÜNCELLE ====================
function updateResults(results) {
    if (!results || results.length === 0) {
        resultsList.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-hourglass-half fa-3x mb-3"></i>
                <p>Henüz sonuç yok</p>
            </div>
        `;
        return;
    }

    // Sonuçları skora göre sırala
    const sortedResults = [...results].sort((a, b) => (b.score || 0) - (a.score || 0));

    resultsList.innerHTML = '';
    sortedResults.forEach((result, index) => {
        if (!result.score && result.score !== 0) return; // Henüz bitmemiş

        const scoreClass = result.score >= 70 ? '' : result.score >= 50 ? 'mid-score' : 'low-score';
        const medal = index === 0 ? '<i class="fas fa-trophy text-warning"></i>' : '';

        const item = document.createElement('div');
        item.className = `result-item ${scoreClass}`;
        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${medal} ${result.studentName}</strong>
                    <div class="small text-muted">
                        <i class="fas fa-check text-success"></i> ${result.correct} 
                        <i class="fas fa-times text-danger ms-2"></i> ${result.wrong}
                        <i class="fas fa-minus text-warning ms-2"></i> ${result.empty}
                    </div>
                </div>
                <div class="text-end">
                    <div class="h5 mb-0">${result.score.toFixed(0)}%</div>
                    <small class="text-muted">${result.totalTime}s</small>
                </div>
            </div>
        `;
        resultsList.appendChild(item);
    });
}

// ==================== TEST BAŞLAT ====================
startQuizBtn.addEventListener('click', () => {
    if (confirm('Testi başlatmak istediğinize emin misiniz?\nTüm öğrenciler aynı anda teste başlayacak!')) {
        socket.emit('start-quiz', { roomCode });
        updateRoomStatus('ACTIVE');
        startQuizBtn.style.display = 'none';
        nextQuestionBtn.style.display = 'inline-block';
    }
});

// ==================== SONRAKİ SORU ====================
nextQuestionBtn.addEventListener('click', () => {
    socket.emit('next-question', { roomCode });

    // Butonu devre dışı bırak
    nextQuestionBtn.disabled = true;
    nextQuestionBtn.classList.remove('btn-success');
    nextQuestionBtn.classList.add('btn-primary');
    nextQuestionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Geçiliyor...';
});

// ==================== SOCKET OLAYLARI ====================

// Öğretmen odaya katıldı
socket.on('teacher-joined', (data) => {
    if (data.success) {
        console.log('Öğretmen odaya bağlandı');
        updateStudentList(data.room.students || []);
        updateResults(data.room.results || []);
    } else {
        alert('Odaya bağlanırken hata: ' + data.error);
    }
});

// Öğrenci listesi güncellendi
socket.on('student-list-updated', (data) => {
    updateStudentList(data.students);
});

// Test başladı
socket.on('quiz-started', () => {
    updateRoomStatus('ACTIVE');
    resultsList.innerHTML = `
        <div class="text-center text-info py-4">
            <i class="fas fa-spinner fa-spin fa-3x mb-3"></i>
            <p>Öğrenciler test çözüyor...</p>
        </div>
    `;
});

// Sonuçlar güncellendi
socket.on('results-updated', (data) => {
    updateResults(data.results);
});

// Sonraki soru hazır
socket.on('next-question-ready', (data) => {
    // Sonraki soru butonunu sıfırla
    nextQuestionBtn.disabled = false;
    nextQuestionBtn.classList.remove('btn-success');
    nextQuestionBtn.classList.add('btn-primary');
    nextQuestionBtn.innerHTML = '<i class="fas fa-forward"></i> Sonraki Soru';

    // Yeni soru bilgisini göster
    resultsList.innerHTML = `
        <div class="text-center text-info py-4">
            <i class="fas fa-question-circle fa-3x mb-3"></i>
            <h5>Soru ${data.questionIndex + 1} / ${data.totalQuestions}</h5>
            <p>Öğrenciler cevaplıyor...</p>
        </div>
    `;
});

// Liderlik tablosu göster
socket.on('show-leaderboard', (data) => {
    // Liderlik tablosunu göster
    if (data.leaderboard && data.leaderboard.length > 0) {
        const leaderboardHTML = `
            <div class="text-center mb-3">
                <h5><i class="fas fa-trophy text-warning"></i> Liderlik Tablosu</h5>
                <p class="text-muted">Soru ${data.currentQuestion} / ${data.totalQuestions}</p>
            </div>
        `;

        resultsList.innerHTML = leaderboardHTML;

        data.leaderboard.forEach((student, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            const scoreClass = student.score >= 700 ? 'high-score' : student.score >= 500 ? 'mid-score' : 'low-score';

            const item = document.createElement('div');
            item.className = `result-item ${scoreClass}`;
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="fs-5 me-2">${medal}</span>
                        <strong>${student.studentName}</strong>
                        <small class="text-muted ms-2">(${student.correctCount} doğru)</small>
                    </div>
                    <div class="text-end">
                        <div class="h5 mb-0">${student.score} puan</div>
                    </div>
                </div>
            `;
            resultsList.appendChild(item);
        });
    }

    // Sonraki soru için bekleme mesajı ekle
    const waitingDiv = document.createElement('div');
    waitingDiv.className = 'alert alert-info mt-3 text-center';
    waitingDiv.innerHTML = '<i class="fas fa-hourglass-half"></i> 3 saniye sonra sonraki soru gelecek...';
    resultsList.appendChild(waitingDiv);
});

// Soru süresi bitti - otomatik liderlik tablosu
socket.on('question-time-up', (data) => {
    // Liderlik tablosunu göster
    if (data.leaderboard && data.leaderboard.length > 0) {
        const leaderboardHTML = `
            <div class="text-center mb-3">
                <h5><i class="fas fa-hourglass-end text-warning"></i> Süre Bitti!</h5>
                <p class="text-muted">Soru ${data.currentQuestion} / ${data.totalQuestions}</p>
            </div>
        `;

        resultsList.innerHTML = leaderboardHTML;

        data.leaderboard.forEach((student, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            const scoreClass = student.score >= 70 ? 'high-score' : student.score >= 50 ? 'mid-score' : 'low-score';

            const item = document.createElement('div');
            item.className = `result-item ${scoreClass}`;
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="fs-5 me-2">${medal}</span>
                        <strong>${student.studentName}</strong>
                        <small class="text-muted ms-2">(${student.correctCount} doğru)</small>
                    </div>
                    <div class="text-end">
                        <div class="h5 mb-0">${student.score} puan</div>
                    </div>
                </div>
            `;
            resultsList.appendChild(item);
        });
    }

    // Sonraki soru butonunu aktif et
    nextQuestionBtn.disabled = false;
    nextQuestionBtn.classList.add('btn-success');
    nextQuestionBtn.classList.remove('btn-primary');
    nextQuestionBtn.innerHTML = '<i class="fas fa-forward"></i> Sonraki Soruya Geç';
});

// Test tamamlandı - Final sıralaması
socket.on('quiz-finished', (data) => {
    updateRoomStatus('FINISHED');
    nextQuestionBtn.style.display = 'none';

    // Final sıralamasını göster
    if (data.leaderboard && data.leaderboard.length > 0) {
        showFinalRanking(data.leaderboard);
    }
});

// Final sıralama tablosu
function showFinalRanking(leaderboard) {
    resultsList.innerHTML = `
        <div class="text-center mb-4">
            <h4><i class="fas fa-trophy text-warning"></i> Final Sıralaması</h4>
            <p class="text-muted">Test tamamlandı!</p>
        </div>
    `;

    leaderboard.forEach((student, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        const scoreClass = student.score >= 70 ? 'high-score' : student.score >= 50 ? 'mid-score' : 'low-score';

        const item = document.createElement('div');
        item.className = `result-item ${scoreClass}`;
        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <span class="fs-5 me-2">${medal}</span>
                    <strong>${student.studentName}</strong>
                    <div class="small text-muted">
                        <i class="fas fa-check text-success"></i> ${student.correctCount} doğru
                        <i class="fas fa-times text-danger ms-2"></i> ${student.wrongCount || 0} yanlış
                    </div>
                </div>
                <div class="text-end">
                    <div class="h5 mb-0">${student.score} puan</div>
                    <small class="text-muted">${student.correctCount} / ${student.totalAnswers || 0}</small>
                </div>
            </div>
        `;
        resultsList.appendChild(item);
    });
}

// Bağlantı hatası
socket.on('connect_error', (error) => {
    console.error('Bağlantı hatası:', error);
    alert('Sunucuya bağlanırken hata oluştu!');
});

// ==================== TEST DÜZENLEME FONKSİYONLARI ====================

let currentEditingTest = null;
let editModal = null;

// Test düzenleme modalını aç
async function editTest(testId) {
    try {
        const response = await fetch(`/api/tests/${testId}`);
        const test = await response.json();

        currentEditingTest = test;

        // Form alanlarını doldur
        document.getElementById('editTestId').value = test.id;
        document.getElementById('editTestTitle').value = test.title;
        document.getElementById('editTestCategory').value = test.category;
        document.getElementById('editTestDescription').value = test.description || '';
        document.getElementById('editTestTime').value = test.timePerQuestion;

        // Soruları listele
        renderEditQuestions(test.questions);

        // Modal'ı aç
        if (!editModal) {
            const modalElement = document.getElementById('editTestModal');
            editModal = new bootstrap.Modal(modalElement);
        }
        editModal.show();

    } catch (error) {
        console.error('Test yüklenirken hata:', error);
        alert('Test yüklenirken hata oluştu!');
    }
}

// HTML karakterlerini escape et
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Soruları düzenleme listesinde göster
function renderEditQuestions(questions) {
    const container = document.getElementById('editQuestionsList');
    container.innerHTML = '';

    if (!questions || questions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-inbox fa-4x text-muted mb-3"></i>
                <p class="text-muted fs-5">Henüz soru eklenmedi</p>
                <p class="text-muted small">Yeni soru eklemek için yukarıdaki butona tıklayın</p>
            </div>
        `;
        return;
    }

    questions.forEach((q, index) => {
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';

        // Soru metnini al (hem text hem questionText destekle)
        const questionText = q.text || q.questionText || '';
        const imageUrl = q.image || q.imageUrl || '';
        const options = q.options || ['', '', '', ''];
        const correctIndex = q.correct !== undefined ? q.correct : (q.correctAnswer !== undefined ? q.correctAnswer : 0);

        const optionLabels = ['A', 'B', 'C', 'D'];
        const optionClasses = ['option-a', 'option-b', 'option-c', 'option-d'];
        const labelClasses = ['label-a', 'label-b', 'label-c', 'label-d'];

        questionCard.innerHTML = `
            <div class="question-card-header">
                <div class="question-number">
                    <i class="fas fa-question-circle"></i>
                    <span>Soru ${index + 1}</span>
                </div>
                <button type="button" class="btn-delete-question" onclick="deleteQuestion(${index})">
                    <i class="fas fa-trash-alt"></i> Sil
                </button>
            </div>
            <div class="question-card-body">
                <!-- Soru Metni -->
                <div class="mb-4">
                    <label class="modern-label">
                        <i class="fas fa-align-left"></i>
                        Soru Metni
                        <span class="required-star">*</span>
                    </label>
                    <textarea class="form-control modern-textarea question-text" 
                              data-index="${index}" 
                              rows="3" 
                              required
                              placeholder="Sorunuzu buraya yazın..."></textarea>
                </div>

                <!-- Görsel Yükleme -->
                <div class="mb-4">
                    <label class="modern-label">
                        <i class="fas fa-image"></i>
                        Soru Görseli
                        <span class="badge bg-secondary ms-2" style="font-size: 0.7rem;">Opsiyonel</span>
                    </label>
                    <div class="image-upload-area" 
                         id="uploadArea${index}" 
                         data-index="${index}" 
                         ondragover="handleDragOver(event, ${index})" 
                         ondragleave="handleDragLeave(event, ${index})" 
                         ondrop="handleDrop(event, ${index})"
                         onclick="document.getElementById('fileInput${index}').click()">
                        <div class="upload-icon">
                            <i class="fas fa-cloud-upload-alt"></i>
                        </div>
                        <div class="upload-text">Görseli Sürükle & Bırak</div>
                        <div class="upload-subtext">veya tıklayarak dosya seç (Max: 500KB)</div>
                        <input type="file" 
                               id="fileInput${index}" 
                               data-index="${index}" 
                               accept="image/*" 
                               style="display: none;" 
                               onchange="handleFileSelect(event, ${index})">
                    </div>
                    <div class="image-preview-container" id="imagePreview${index}" style="display: none;">
                        <img src="" class="img-fluid" alt="Soru görseli">
                        <button type="button" class="remove-image-btn" onclick="removeImage(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <input type="hidden" class="question-image-data" data-index="${index}">
                </div>

                <!-- Ayırıcı -->
                <div class="section-divider"></div>

                <!-- Şıklar -->
                <div class="mb-3">
                    <label class="modern-label">
                        <i class="fas fa-list-ul"></i>
                        Cevap Şıkları
                        <span class="required-star">*</span>
                    </label>
                </div>
                <div class="option-group">
                    ${optionLabels.map((label, i) => `
                        <div class="option-card ${optionClasses[i]}">
                            <div class="option-label ${labelClasses[i]}">${label}</div>
                            <div class="option-input-wrapper">
                                <input type="text" 
                                       class="form-control option-input" 
                                       data-index="${index}" 
                                       data-option="${i}"
                                       placeholder="${label} şıkkını girin..."
                                       required>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Doğru Cevap -->
                <div class="correct-answer-section">
                    <label class="modern-label mb-2">
                        <i class="fas fa-check-circle"></i>
                        Doğru Cevap
                        <span class="required-star">*</span>
                    </label>
                    <select class="form-select correct-answer-select correct-answer" data-index="${index}" required>
                        <option value="0" ${correctIndex === 0 ? 'selected' : ''}>A) ${optionLabels[0]} Şıkkı</option>
                        <option value="1" ${correctIndex === 1 ? 'selected' : ''}>B) ${optionLabels[1]} Şıkkı</option>
                        <option value="2" ${correctIndex === 2 ? 'selected' : ''}>C) ${optionLabels[2]} Şıkkı</option>
                        <option value="3" ${correctIndex === 3 ? 'selected' : ''}>D) ${optionLabels[3]} Şıkkı</option>
                    </select>
                </div>
            </div>
        `;
        container.appendChild(questionCard);

        // Değerleri JavaScript ile set et (HTML escape sorunu olmaması için)
        const textArea = questionCard.querySelector('.question-text');
        if (textArea) textArea.value = questionText;

        // Görsel varsa önizleme göster
        const imageDataInput = questionCard.querySelector('.question-image-data');
        if (imageDataInput && imageUrl) {
            imageDataInput.value = imageUrl;
            showImagePreview(index, imageUrl);
        }

        // Şıkları set et
        for (let i = 0; i < 4; i++) {
            const optionInput = questionCard.querySelector(`.option-input[data-option="${i}"]`);
            if (optionInput) optionInput.value = options[i] || '';
        }
    });
}


// Drag & Drop event handlers
function handleDragOver(event, index) {
    event.preventDefault();
    event.stopPropagation();
    const uploadArea = document.getElementById(`uploadArea${index}`);
    if (uploadArea) {
        uploadArea.classList.add('drag-over');
    }
}

function handleDragLeave(event, index) {
    event.preventDefault();
    event.stopPropagation();
    const uploadArea = document.getElementById(`uploadArea${index}`);
    if (uploadArea) {
        uploadArea.classList.remove('drag-over');
    }
}

function handleDrop(event, index) {
    event.preventDefault();
    event.stopPropagation();

    const uploadArea = document.getElementById(`uploadArea${index}`);
    if (uploadArea) {
        uploadArea.classList.remove('drag-over');
    }

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processImageFile(files[0], index);
    }
}

function handleFileSelect(event, index) {
    const files = event.target.files;
    if (files.length > 0) {
        processImageFile(files[0], index);
    }
}

// Görsel dosyasını işle ve base64'e çevir
function processImageFile(file, index) {
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

            // Hidden input'a base64 verisini kaydet
            const imageDataInput = document.querySelector(`.question-image-data[data-index="${index}"]`);
            if (imageDataInput) {
                imageDataInput.value = base64Data;
            }

            // Önizlemeyi göster
            showImagePreview(index, base64Data);

            // Upload alanını gizle
            const uploadArea = document.getElementById(`uploadArea${index}`);
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

// Görseli kaldır
function removeImage(index) {
    // Hidden input'u temizle
    const imageDataInput = document.querySelector(`.question-image-data[data-index="${index}"]`);
    if (imageDataInput) {
        imageDataInput.value = '';
    }

    // Önizlemeyi gizle
    const preview = document.getElementById(`imagePreview${index}`);
    if (preview) {
        preview.style.display = 'none';
    }

    // Upload alanını göster
    const uploadArea = document.getElementById(`uploadArea${index}`);
    if (uploadArea) {
        uploadArea.style.display = 'block';
    }

    // File input'u temizle
    const fileInput = document.getElementById(`fileInput${index}`);
    if (fileInput) {
        fileInput.value = '';
    }
}

// Görsel önizleme göster
function showImagePreview(index, url) {
    const preview = document.getElementById(`imagePreview${index}`);
    if (!preview) return;

    if (url && url.trim()) {
        const img = preview.querySelector('img');
        img.src = url;
        img.onerror = () => {
            preview.style.display = 'none';
        };
        img.onload = () => {
            preview.style.display = 'block';
        };
    } else {
        preview.style.display = 'none';
    }
}

// Yeni soru ekle
function addNewQuestion() {
    if (!currentEditingTest) return;

    const newQuestion = {
        text: '',
        questionText: '',
        options: ['', '', '', ''],
        correct: 0,
        correctAnswer: 0,
        image: ''
    };

    currentEditingTest.questions.push(newQuestion);
    renderEditQuestions(currentEditingTest.questions);
}

// Soru sil
function deleteQuestion(index) {
    if (!currentEditingTest) return;

    if (confirm(`${index + 1}. soruyu silmek istediğinizden emin misiniz?`)) {
        currentEditingTest.questions.splice(index, 1);
        renderEditQuestions(currentEditingTest.questions);
    }
}

// Değişiklikleri kaydet
async function saveTestChanges() {
    try {
        // Form verilerini topla
        const testId = document.getElementById('editTestId').value;
        const title = document.getElementById('editTestTitle').value.trim();
        const category = document.getElementById('editTestCategory').value;
        const description = document.getElementById('editTestDescription').value.trim();
        const timePerQuestion = parseInt(document.getElementById('editTestTime').value);

        if (!title) {
            alert('Test adı boş olamaz!');
            return;
        }

        // Soruları topla
        const questions = [];
        const questionTexts = document.querySelectorAll('.question-text');

        questionTexts.forEach((textarea, index) => {
            const text = textarea.value.trim();
            const imageDataInput = document.querySelector(`.question-image-data[data-index="${index}"]`);
            const imageData = imageDataInput ? imageDataInput.value.trim() : '';
            const options = [];

            // Şıkları topla
            for (let i = 0; i < 4; i++) {
                const optionInput = document.querySelector(`.option-input[data-index="${index}"][data-option="${i}"]`);
                options.push(optionInput ? optionInput.value.trim() : '');
            }

            const correctSelect = document.querySelector(`.correct-answer[data-index="${index}"]`);
            const correct = correctSelect ? parseInt(correctSelect.value) : 0;

            if (text && options.every(o => o)) {
                questions.push({
                    text: text,
                    questionText: text,  // Eski sistemle uyum için
                    options: options,
                    correct: correct,
                    correctAnswer: correct,  // Eski sistemle uyum için
                    image: imageData,
                    imageUrl: imageData,  // Alternatif alan adı
                    type: 'multiple',
                    correctAnswers: [],
                    pairs: []
                });
            }
        });

        if (questions.length === 0) {
            alert('En az bir soru eklemelisiniz!');
            return;
        }

        // API'ye gönder
        const response = await fetch(`/api/tests/${testId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                category,
                description,
                timePerQuestion,
                questions
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server hatası:', errorText);
            alert(`❌ Test güncellenemedi! Sunucu hatası: ${response.status}\n\nGörseller çok büyük olabilir. Lütfen daha küçük görseller kullanın.`);
            return;
        }

        const result = await response.json();

        alert('✅ Test başarıyla güncellendi!');
        editModal.hide();
        loadTests(); // Test listesini yenile

    } catch (error) {
        console.error('Test kaydedilirken hata:', error);
        alert('❌ Test kaydedilirken hata oluştu: ' + error.message + '\n\nGörseller çok büyük olabilir. Lütfen daha küçük görseller kullanın.');
    }
}

// Test sil
async function deleteTest(testId, testTitle) {
    if (!confirm(`"${testTitle}" testini silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz!`)) {
        return;
    }

    try {
        const response = await fetch(`/api/tests/${testId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Silme hatası');
        }

        alert('Test başarıyla silindi!');
        loadTests(); // Test listesini yenile

    } catch (error) {
        console.error('Test silinirken hata:', error);
        alert('Test silinirken hata oluştu!');
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

        // Kategori select'lerini güncelle
        updateCategorySelects();

        return allCategories;
    } catch (error) {
        console.error('Kategoriler yüklenirken hata:', error);
        return [];
    }
}

// Kategori select'lerini güncelle
function updateCategorySelects() {
    // Test düzenleme modalındaki kategori dropdown'unu güncelle
    const editSelect = document.getElementById('editTestCategory');
    const editCurrentValue = editSelect ? editSelect.value : '';

    if (editSelect) {
        editSelect.innerHTML = allCategories.map(cat =>
            `<option value="${cat.name}" ${cat.name === editCurrentValue ? 'selected' : ''}>${cat.name}</option>`
        ).join('');
    }

    // Ana sayfadaki kategori filtre dropdown'unu güncelle
    const filterSelect = document.getElementById('categoryFilter');
    if (filterSelect) {
        const filterCurrentValue = filterSelect.value;
        filterSelect.innerHTML = `
            <option value="">Tüm Kategoriler</option>
            ${allCategories.map(cat =>
            `<option value="${cat.name}" ${cat.name === filterCurrentValue ? 'selected' : ''}>${cat.name}</option>`
        ).join('')}
        `;
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
