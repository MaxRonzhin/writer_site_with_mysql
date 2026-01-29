function setMsg(el, text, ok) {
  el.textContent = text || '';
  el.className = `msg ${ok ? 'ok' : 'err'}`;
}

function saveAuth(token, user) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('auth_user') || 'null');
  } catch {
    return null;
  }
}

function updateNavAuth() {
  const li = document.getElementById('navAuthItem');
  if (!li) return;
  const u = getUser();
  if (!u) {
    const link = document.getElementById('navAuthLink');
    if (link) {
      link.textContent = 'Вход';
      link.setAttribute('href', 'auth.html');
    }
    return;
  }
  li.innerHTML = `
    <div class="nav-user">
      <span class="nav-user-name">${(u.name || u.email || 'Пользователь')}</span>
      <button type="button" class="nav-logout-btn" id="navLogoutBtn">Выход</button>
    </div>
  `;
  const btn = document.getElementById('navLogoutBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      location.href = 'index.html';
    });
  }
}

function showAdminLinkIfNeeded() {
  const user = getUser();
  const link = document.getElementById('adminLink');
  if (!link) return;
  link.style.display = user?.role === 'admin' ? 'inline-block' : 'none';
}

async function apiJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

document.addEventListener('DOMContentLoaded', () => {
  updateNavAuth();
  showAdminLinkIfNeeded();

  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginMsg = document.getElementById('loginMsg');
  const registerMsg = document.getElementById('registerMsg');

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg(loginMsg, '', true);

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const data = await apiJson('/api/auth/login', { email, password });
      saveAuth(data.token, data.user);
      setMsg(loginMsg, 'Успешный вход.', true);
      showAdminLinkIfNeeded();
    } catch (err) {
      setMsg(loginMsg, err?.error === 'INVALID_CREDENTIALS' ? 'Неверный email или пароль.' : 'Ошибка входа.', false);
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg(registerMsg, '', true);

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    try {
      const data = await apiJson('/api/auth/register', { name, email, password });
      saveAuth(data.token, data.user);
      setMsg(registerMsg, 'Аккаунт создан и вы вошли.', true);
      showAdminLinkIfNeeded();
    } catch (err) {
      if (err?.error === 'EMAIL_TAKEN') setMsg(registerMsg, 'Этот email уже зарегистрирован.', false);
      else setMsg(registerMsg, 'Ошибка регистрации.', false);
    }
  });
});

