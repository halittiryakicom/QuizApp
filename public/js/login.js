const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const forgotPasswordSection = document.getElementById('forgotPasswordSection');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');

function showRegister() {
    loginSection.style.display = 'none';
    registerSection.style.display = 'block';
    forgotPasswordSection.style.display = 'none';
}

function showLogin() {
    registerSection.style.display = 'none';
    loginSection.style.display = 'block';
    forgotPasswordSection.style.display = 'none';
}

function showForgotPassword() {
    loginSection.style.display = 'none';
    registerSection.style.display = 'none';
    forgotPasswordSection.style.display = 'block';
}

// Giriş formu
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            // Token'ı localStorage'a kaydet
            localStorage.setItem('teacherToken', data.token);
            localStorage.setItem('teacherName', data.user.fullName);
            localStorage.setItem('teacherUsername', data.user.username);

            // Öğretmen paneline yönlendir
            window.location.href = '/teacher';
        } else {
            alert('Hata: ' + data.message);
        }
    } catch (error) {
        alert('Giriş yapılırken hata oluştu: ' + error.message);
    }
});

// Kayıt formu
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;

    if (password !== passwordConfirm) {
        alert('Şifreler eşleşmiyor!');
        return;
    }

    if (password.length < 4) {
        alert('Şifre en az 4 karakter olmalıdır!');
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fullName, username, password })
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
            showLogin();
            document.getElementById('username').value = username;
        } else {
            alert('Hata: ' + data.message);
        }
    } catch (error) {
        alert('Kayıt olurken hata oluştu: ' + error.message);
    }
});

// Şifremi Unuttum formu
forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('fpUsername').value;
    const newPassword = document.getElementById('fpNewPassword').value;
    const newPasswordConfirm = document.getElementById('fpNewPasswordConfirm').value;

    if (newPassword !== newPasswordConfirm) {
        alert('Şifreler eşleşmiyor!');
        return;
    }

    if (newPassword.length < 4) {
        alert('Şifre en az 4 karakter olmalıdır!');
        return;
    }

    try {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, newPassword })
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Şifreniz başarıyla sıfırlandı! Şimdi giriş yapabilirsiniz.');
            showLogin();
            document.getElementById('username').value = username;
            // Formu temizle
            document.getElementById('fpUsername').value = '';
            document.getElementById('fpNewPassword').value = '';
            document.getElementById('fpNewPasswordConfirm').value = '';
        } else {
            alert('Hata: ' + data.message);
        }
    } catch (error) {
        alert('Şifre sıfırlanırken hata oluştu: ' + error.message);
    }
});
