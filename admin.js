function token() {
  return localStorage.getItem('auth_token') || '';
}

function user() {
  try {
    return JSON.parse(localStorage.getItem('auth_user') || 'null');
  } catch {
    return null;
  }
}

function setMsg(el, text, ok) {
  el.textContent = text || '';
  el.className = `msg ${ok ? 'ok' : 'err'}`;
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token()}`
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

async function apiJson(url, method, body) {
  return api(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

function fillForm(form, obj) {
  if (!form || !obj) return;
  [...form.elements].forEach((el) => {
    if (!el.name) return;
    if (el.type === 'file') return;
    if (obj[el.name] !== undefined && obj[el.name] !== null) el.value = obj[el.name];
  });
}

function formToFormData(form) {
  const fd = new FormData();
  [...form.elements].forEach((el) => {
    if (!el.name) return;
    if (el.type === 'file') {
      if (el.files && el.files[0]) fd.append(el.name, el.files[0]);
      return;
    }
    if (el.type === 'checkbox') fd.append(el.name, el.checked ? '1' : '0');
    else fd.append(el.name, el.value);
  });
  return fd;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function tabSwitch(name) {
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tabpane').forEach((p) => p.classList.add('hidden'));
  document.getElementById(`tab-${name}`)?.classList.remove('hidden');
}

async function loadCover() {
  const data = await api('/api/admin/cover');
  const form = document.getElementById('coverForm');
  fillForm(form, data);
  document.getElementById('coverPhotoHint').textContent = data?.author_photo_path ? `Текущее: ${data.author_photo_path}` : '';
}

async function saveCover(e) {
  e.preventDefault();
  const msg = document.getElementById('coverMsg');
  setMsg(msg, '', true);
  const form = document.getElementById('coverForm');
  try {
    const fd = formToFormData(form);
    const res = await api('/api/admin/cover', { method: 'PUT', body: fd });
    document.getElementById('coverPhotoHint').textContent = res?.author_photo_path ? `Текущее: ${res.author_photo_path}` : '';
    setMsg(msg, 'Сохранено.', true);
  } catch (err) {
    setMsg(msg, 'Ошибка сохранения.', false);
  }
}

async function loadAbout() {
  const data = await api('/api/admin/about');
  const form = document.getElementById('aboutForm');
  fillForm(form, data.about);
  document.getElementById('aboutImageHint').textContent = data?.about?.image_path ? `Текущее: ${data.about.image_path}` : '';
  renderAchievements(data.achievements || []);
}

async function saveAbout(e) {
  e.preventDefault();
  const msg = document.getElementById('aboutMsg');
  setMsg(msg, '', true);
  const form = document.getElementById('aboutForm');
  try {
    const fd = formToFormData(form);
    const res = await api('/api/admin/about', { method: 'PUT', body: fd });
    document.getElementById('aboutImageHint').textContent = res?.image_path ? `Текущее: ${res.image_path}` : '';
    setMsg(msg, 'Сохранено.', true);
  } catch {
    setMsg(msg, 'Ошибка сохранения.', false);
  }
}

function resetAchievementForm() {
  const form = document.getElementById('achievementForm');
  if (!form) return;
  form.reset();
  if (form.elements.id) form.elements.id.value = '';
  const submit = document.getElementById('achSubmit');
  const cancel = document.getElementById('achCancel');
  if (submit) submit.textContent = 'Добавить';
  if (cancel) cancel.style.display = 'none';
}

function renderAchievements(items) {
  const list = document.getElementById('achievementsList');
  if (!list) return;
  list.innerHTML = '';
  items.forEach((a) => {
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `
      <div>
        <h4>${escapeHtml(a.title)}</h4>
        <div class="muted">${escapeHtml(a.body)}</div>
        <div class="muted">sort_order: ${escapeHtml(String(a.sort_order))}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-secondary btn-sm" data-act="edit">Редактировать</button>
        <button class="btn btn-secondary btn-sm danger" data-act="del">Удалить</button>
      </div>
    `;
    el.querySelector('[data-act="edit"]').addEventListener('click', () => {
      const form = document.getElementById('achievementForm');
      if (!form) return;
      resetAchievementForm();
      if (form.elements.id) form.elements.id.value = a.id;
      form.elements.title.value = a.title || '';
      form.elements.body.value = a.body || '';
      form.elements.sort_order.value = String(a.sort_order ?? 0);
      const submit = document.getElementById('achSubmit');
      const cancel = document.getElementById('achCancel');
      if (submit) submit.textContent = 'Сохранить';
      if (cancel) cancel.style.display = 'inline-block';
      const rect = form.getBoundingClientRect();
      window.scrollTo({ top: rect.top + window.scrollY - 100, behavior: 'smooth' });
    });
    el.querySelector('[data-act="del"]').addEventListener('click', async () => {
      if (!confirm('Удалить достижение?')) return;
      await api(`/api/admin/achievements/${a.id}`, { method: 'DELETE' });
      await loadAbout();
    });
    list.appendChild(el);
  });
}

async function saveAchievement(e) {
  e.preventDefault();
  const form = document.getElementById('achievementForm');
  const msg = document.getElementById('achMsg');
  setMsg(msg, '', true);
  const id = form.elements.id?.value;
  const title = form.elements.title.value.trim();
  const body = form.elements.body.value.trim();
  const sort_order = Number(form.elements.sort_order.value || 0);
  try {
    if (id) {
      await apiJson(`/api/admin/achievements/${id}`, 'PUT', { title, body, sort_order });
    } else {
      await apiJson('/api/admin/achievements', 'POST', { title, body, sort_order });
    }
    resetAchievementForm();
    setMsg(msg, 'Сохранено.', true);
    await loadAbout();
  } catch {
    setMsg(msg, 'Ошибка сохранения.', false);
  }
}

let booksCache = [];
let reviewsCache = [];

function resetBookForm() {
  const form = document.getElementById('bookForm');
  form.reset();
  form.elements.id.value = '';
  document.getElementById('bookSubmit').textContent = 'Добавить';
  document.getElementById('bookCancel').style.display = 'none';
  document.getElementById('bookCoverHint').textContent = '';
}

function resetReviewForm() {
  const form = document.getElementById('reviewForm');
  form.reset();
  form.elements.id.value = '';
  document.getElementById('reviewSubmit').textContent = 'Добавить';
  document.getElementById('reviewCancel').style.display = 'none';
  document.getElementById('reviewAvatarHint').textContent = '';
}

async function loadBooks() {
  booksCache = await api('/api/admin/books');
  renderBooks(booksCache);
}

function renderBooks(items) {
  const list = document.getElementById('booksList');
  list.innerHTML = '';
  items.forEach((b) => {
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `
      <div>
        <h4>${escapeHtml(b.title)} <span class="muted">(${escapeHtml(b.genre)})</span></h4>
        <div class="muted">rating: ${escapeHtml(String(b.rating))}, sort_order: ${escapeHtml(String(b.sort_order))}</div>
        <div>${escapeHtml(b.description)}</div>
        ${b.cover_path ? `<div class="muted">cover: ${escapeHtml(b.cover_path)}</div>` : ''}
      </div>
      <div class="item-actions">
        <button class="btn btn-secondary btn-sm" data-act="edit">Редактировать</button>
        <button class="btn btn-secondary btn-sm danger" data-act="del">Удалить</button>
      </div>
    `;
    el.querySelector('[data-act="edit"]').addEventListener('click', () => {
      const form = document.getElementById('bookForm');
      resetBookForm();
      form.elements.id.value = b.id;
      fillForm(form, b);
      document.getElementById('bookSubmit').textContent = 'Сохранить';
      document.getElementById('bookCancel').style.display = 'inline-block';
      document.getElementById('bookCoverHint').textContent = b.cover_path ? `Текущее: ${b.cover_path}` : '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    el.querySelector('[data-act="del"]').addEventListener('click', async () => {
      if (!confirm('Удалить книгу?')) return;
      await api(`/api/admin/books/${b.id}`, { method: 'DELETE' });
      await loadBooks();
    });
    list.appendChild(el);
  });
}

async function saveBook(e) {
  e.preventDefault();
  const form = document.getElementById('bookForm');
  const msg = document.getElementById('bookMsg');
  setMsg(msg, '', true);
  const id = form.elements.id.value;
  try {
    const fd = formToFormData(form);
    if (id) await api(`/api/admin/books/${id}`, { method: 'PUT', body: fd });
    else await api('/api/admin/books', { method: 'POST', body: fd });
    resetBookForm();
    setMsg(msg, 'Сохранено.', true);
    await loadBooks();
  } catch {
    setMsg(msg, 'Ошибка сохранения.', false);
  }
}

async function loadReviews() {
  reviewsCache = await api('/api/admin/reviews');
  renderReviews(reviewsCache);
}

async function loadFooter() {
  const data = await api('/api/admin/footer');
  const form = document.getElementById('footerForm');
  fillForm(form, data);
}

async function saveFooter(e) {
  e.preventDefault();
  const form = document.getElementById('footerForm');
  const msg = document.getElementById('footerMsg');
  setMsg(msg, '', true);
  try {
    const fd = formToFormData(form);
    await api('/api/admin/footer', { method: 'PUT', body: fd });
    setMsg(msg, 'Сохранено.', true);
  } catch {
    setMsg(msg, 'Ошибка сохранения.', false);
  }
}

function renderReviews(items) {
  const list = document.getElementById('reviewsList');
  list.innerHTML = '';
  items.forEach((r) => {
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `
      <div>
        <h4>${escapeHtml(r.reviewer_name)} <span class="muted">(${escapeHtml(r.reviewer_location)})</span></h4>
        <div class="muted">rating: ${escapeHtml(String(r.rating))}, sort_order: ${escapeHtml(String(r.sort_order))}</div>
        <div class="muted">книга: ${escapeHtml(r.book_title)}</div>
        <div>${escapeHtml(r.body)}</div>
        ${r.avatar_path ? `<div class="muted">avatar: ${escapeHtml(r.avatar_path)}</div>` : ''}
      </div>
      <div class="item-actions">
        <button class="btn btn-secondary btn-sm" data-act="edit">Редактировать</button>
        <button class="btn btn-secondary btn-sm danger" data-act="del">Удалить</button>
      </div>
    `;
    el.querySelector('[data-act="edit"]').addEventListener('click', () => {
      const form = document.getElementById('reviewForm');
      resetReviewForm();
      form.elements.id.value = r.id;
      fillForm(form, r);
      document.getElementById('reviewSubmit').textContent = 'Сохранить';
      document.getElementById('reviewCancel').style.display = 'inline-block';
      document.getElementById('reviewAvatarHint').textContent = r.avatar_path ? `Текущее: ${r.avatar_path}` : '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    el.querySelector('[data-act="del"]').addEventListener('click', async () => {
      if (!confirm('Удалить отзыв?')) return;
      await api(`/api/admin/reviews/${r.id}`, { method: 'DELETE' });
      await loadReviews();
    });
    list.appendChild(el);
  });
}

async function saveReview(e) {
  e.preventDefault();
  const form = document.getElementById('reviewForm');
  const msg = document.getElementById('reviewMsg');
  setMsg(msg, '', true);
  const id = form.elements.id.value;
  try {
    const fd = formToFormData(form);
    if (id) await api(`/api/admin/reviews/${id}`, { method: 'PUT', body: fd });
    else await api('/api/admin/reviews', { method: 'POST', body: fd });
    resetReviewForm();
    setMsg(msg, 'Сохранено.', true);
    await loadReviews();
  } catch {
    setMsg(msg, 'Ошибка сохранения.', false);
  }
}

async function bootstrap() {
  const u = user();
  document.getElementById('whoami').textContent = u ? `${u.name} (${u.role})` : 'Неизвестный пользователь';

  if (!token()) {
    setMsg(document.getElementById('globalMsg'), 'Нет токена. Перейдите на страницу входа.', false);
    return;
  }

  try {
    await loadCover();
    await loadAbout();
    await loadBooks();
    await loadReviews();
    await loadFooter();
  } catch (err) {
    if (err?.error === 'UNAUTHORIZED' || err?.error === 'FORBIDDEN') {
      setMsg(document.getElementById('globalMsg'), 'Нет доступа. Войдите администратором.', false);
    } else {
      setMsg(document.getElementById('globalMsg'), 'Ошибка загрузки данных.', false);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab').forEach((b) =>
    b.addEventListener('click', () => tabSwitch(b.dataset.tab))
  );

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    location.href = 'auth.html';
  });

  document.getElementById('coverForm')?.addEventListener('submit', saveCover);
  document.getElementById('aboutForm')?.addEventListener('submit', saveAbout);
  document.getElementById('achievementForm')?.addEventListener('submit', saveAchievement);
  document.getElementById('achCancel')?.addEventListener('click', resetAchievementForm);

  document.getElementById('bookForm')?.addEventListener('submit', saveBook);
  document.getElementById('bookCancel')?.addEventListener('click', resetBookForm);

  document.getElementById('reviewForm')?.addEventListener('submit', saveReview);
  document.getElementById('reviewCancel')?.addEventListener('click', resetReviewForm);

  document.getElementById('footerForm')?.addEventListener('submit', saveFooter);

  bootstrap();
});

