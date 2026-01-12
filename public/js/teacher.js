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
                <button class="btn btn-primary btn-sm w-100" data-test-id="${test.id}" onclick="selectTestById('${test.id}')">
                    <i class="fas fa-check-circle"></i> Bu Testi Seç
                </button>
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
