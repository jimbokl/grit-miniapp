const tg = window.Telegram?.WebApp;

function applyTelegramTheme() {
  const p = tg?.themeParams || {};
  const root = document.documentElement;
  const set = (k, v) => v && root.style.setProperty(k, v);
  // Map TG params to CSS vars (fallbacks remain from CSS file)
  set('--bg', p.bg_color);
  set('--text', p.text_color);
  set('--muted', p.hint_color);
  set('--card', p.secondary_bg_color);
  set('--border', p.section_separator_color);
  set('--primary', p.button_color);
}

function getApiBase() {
  const ls = (typeof localStorage !== 'undefined') ? localStorage.getItem('GRIT_API_BASE') : '';
  if (ls) return ls;
  if (window.location.hostname === 'jimbokl.github.io') return 'https://nflowsserver.com/grit';
  return window.GRIT_API_BASE || 'http://localhost:8000';
}

function showToast(message) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2200);
}

function getInitDataUnsafe() {
  try {
    return tg?.initDataUnsafe || {};
  } catch (e) {
    return {};
  }
}

async function postJSON(url, data) {
  const base = getApiBase();
  const full = base.replace(/\/$/, '') + url;
  const resp = await fetch(full, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': tg?.initData || '',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!resp.ok) throw new Error(`Request failed: ${resp.status}`);
  return resp.json().catch(() => ({}));
}

function switchTab(name) {
  document.querySelectorAll('[data-tab-section]')?.forEach((el) => {
    el.classList.toggle('hidden', el.getAttribute('data-tab-section') !== name);
  });
  document.querySelectorAll('.tab')?.forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === name);
  });
}

function bindTabs() {
  document.querySelectorAll('.tab')?.forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });
}

function calcGritScore(form) {
  const values = Array.from(form.querySelectorAll('select')).map((s) => Number(s.value || 0));
  if (!values.length) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return (sum / values.length).toFixed(1);
}

function onReady() {
  applyTelegramTheme?.();
  bindTabs();
  switchTab('grit-test');

  const planForm = document.getElementById('plan-form');
  const factForm = document.getElementById('fact-form');
  const modal = document.getElementById('onboarding-modal');
  const onbOk = document.getElementById('onb-ok');

  if (modal) {
    modal.classList.remove('hidden');
  }
  onbOk?.addEventListener('click', () => {
    modal?.classList.add('hidden');
  });
  modal?.querySelector('[data-onb-close]')?.addEventListener('click', () => {
    modal?.classList.add('hidden');
  });

  // Grit-тест
  const gritForm = document.getElementById('grit-form');
  const gritResult = document.getElementById('grit-result');
  gritForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const score = calcGritScore(gritForm);
    gritResult.textContent = `Ваш Grit: ${score} / 5.0`;
    gritResult.classList.remove('hidden');
  });

  // Цели
  const goalsForm = document.getElementById('goals-form');
  const goalsSaved = document.getElementById('goals-saved');
  goalsForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const main = document.getElementById('goal-main').value.trim();
    const subs = document.getElementById('goal-sub').value.trim();
    localStorage.setItem('grit_goal_main', main);
    localStorage.setItem('grit_goal_sub', subs);
    goalsSaved.textContent = `Сохранено. Главная цель: ${main}. Подцели: ${subs}`;
    goalsSaved.classList.remove('hidden');
  });

  // Генерация плана (в разделе Цели)
  const genForm = document.getElementById('gen-form');
  const genResult = document.getElementById('gen-result');
  genForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const task = document.getElementById('gen-task').value.trim();
    const frequency = document.getElementById('gen-frequency').value;
    const time = Number(document.getElementById('gen-time').value || 0);
    const constraints = document.getElementById('gen-constraints').value.trim();
    if (!task || time <= 0) return showToast('Заполните задачу и время');
    try {
      const data = await postJSON('/api/plan/generate', { init: getInitDataUnsafe(), task, frequency, time_minutes: time, constraints });
      genResult.textContent = data?.plan_text || 'План готов.';
      genResult.classList.remove('hidden');
      tg?.HapticFeedback?.notificationOccurred('success');
    } catch (err) {
      console.error(err); showToast('Ошибка генерации'); tg?.HapticFeedback?.notificationOccurred('error');
    }
  });

  // Оставшиеся обработчики (план/факт)
  planForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const plan = {
      touches: Number(document.getElementById('plan-touches').value || 0),
      demos: Number(document.getElementById('plan-demos').value || 0),
      focus_minutes: Number(document.getElementById('plan-focus').value || 0),
    };
    try {
      await postJSON('/api/plan/today', { plan, init: getInitDataUnsafe() });
      showToast('План сохранён');
      tg?.HapticFeedback?.notificationOccurred('success');
    } catch (err) {
      console.error(err);
      showToast('Ошибка: не удалось сохранить план');
      tg?.HapticFeedback?.notificationOccurred('error');
    }
  });

  factForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inc = {
      touches: Number(document.getElementById('fact-touches').value || 0),
      demos: Number(document.getElementById('fact-demos').value || 0),
      focus_minutes: Number(document.getElementById('fact-focus').value || 0),
    };
    try {
      await postJSON('/api/fact/increment', { inc, init: getInitDataUnsafe() });
      showToast('Факт добавлен');
      tg?.HapticFeedback?.notificationOccurred('success');
      factForm.reset();
    } catch (err) {
      console.error(err);
      showToast('Ошибка: не удалось добавить факт');
      tg?.HapticFeedback?.notificationOccurred('error');
    }
  });

  try { tg?.ready(); } catch (_) {}
}

document.addEventListener('DOMContentLoaded', onReady);
