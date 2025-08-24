const tg = window.Telegram?.WebApp;

function applyTelegramTheme() {
  const p = tg?.themeParams || {};
  const root = document.documentElement;
  const set = (k, v) => v && root.style.setProperty(k, v);
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
  if (window.location.hostname === 'jimbokl.github.io') return 'https://212-34-150-91.sslip.io/grit';
  return 'http://localhost:8000';
}

function getInitDataUnsafe() {
  try { return tg?.initDataUnsafe || {}; } catch { return {}; }
}

async function postJSON(path, body, options = {}) {
  const base = getApiBase();
  const url = path.startsWith('http') ? path : base.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 20000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(options.headers||{}) },
      body: JSON.stringify(body || {}),
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const txt = await res.text().catch(()=>'');
      throw new Error(`HTTP ${res.status}: ${txt}`);
    }
    return await res.json();
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

function showToast(message) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2200);
}

// ---------- Plan rendering ----------
function renderPlan(structured, planText) {
  const s = structured || {};
  const blocks = [
    { title: 'Ежедневный ритуал', items: s.daily_ritual },
    { title: 'Мини-план на день', items: s.mini_plan },
    { title: 'Фокус-блоки', items: s.focus_blocks },
    { title: 'Анти-срыв', items: s.anti_slip },
    { title: 'Маркеры недели', items: s.weekly_markers },
  ];
  const hasAny = blocks.some(b => Array.isArray(b.items) && b.items.length);
  if (!hasAny) {
    return (planText || '').trim();
  }
  const wrap = document.createElement('div');
  blocks.forEach(b => {
    if (!Array.isArray(b.items) || b.items.length === 0) return;
    const h = document.createElement('div'); h.style.fontWeight = '600'; h.style.margin = '8px 0 6px'; h.textContent = b.title; wrap.appendChild(h);
    const ul = document.createElement('ul'); ul.style.margin = '0 0 8px 16px'; ul.style.padding = '0';
    b.items.forEach(it => { const li = document.createElement('li'); li.style.margin = '4px 0'; li.textContent = it; ul.appendChild(li); });
    wrap.appendChild(ul);
  });
  return wrap;
}

function parsePlanTextToStructured(planText) {
  const text = (planText || '').replace(/\r/g, '');
  function sliceBetween(startRe, endRe) {
    const s = text.search(startRe); if (s < 0) return '';
    const e = text.slice(s + 1).search(endRe); // +1 защищает от нулевого
    if (e < 0) return text.slice(s);
    return text.slice(s, s + 1 + e);
  }
  function listFromBlock(block) {
    const items = [];
    (block.match(/(^|\n)\s*(?:[-*•]|\d+[.)])\s+.+/g) || []).forEach(line => {
      const clean = line.replace(/(^|\n)\s*(?:[-*•]|\d+[.)])\s+/g, '').trim();
      if (clean) items.push(clean);
    });
    return items;
  }
  const map = [
    { key: 'daily_ritual', re: /(Ежедневный ритуал)/i },
    { key: 'mini_plan', re: /(Мини-план[^\n]*)/i },
    { key: 'focus_blocks', re: /(Фокус-блок[^\n]*)/i },
    { key: 'anti_slip', re: /(Анти-срыв)/i },
    { key: 'weekly_markers', re: /(Маркеры прогресса|Маркеры недели)/i },
  ];
  const out = { daily_ritual: [], mini_plan: [], focus_blocks: [], anti_slip: [], weekly_markers: [] };
  for (let i = 0; i < map.length; i++) {
    const start = map[i].re;
    const end = i < map.length - 1 ? map[i+1].re : /\Z/;
    const block = sliceBetween(start, end);
    if (block) {
      out[map[i].key] = listFromBlock(block);
    }
  }
  return out;
}

// State
function todayKey() { return new Date().toISOString().slice(0,10); }
function loadState() {
  try { return JSON.parse(localStorage.getItem('grit_state') || '{}'); } catch { return {}; }
}
function saveState(s) { localStorage.setItem('grit_state', JSON.stringify(s)); }

function ensureDefaults(state) {
  state.checkins = state.checkins || {}; // date -> {effort, win, challenge}
  state.streak = state.streak || 0;
  state.lastCheckin = state.lastCheckin || null;
  state.goals = state.goals || { main: '100 видео за 100 дней', subs: [] };
  return state;
}

function updateStreak(state) {
  const last = state.lastCheckin; const today = todayKey();
  if (!last) { state.streak = state.checkins[today] ? 1 : 0; return; }
  const lastDate = new Date(last); const tDate = new Date(today);
  const diff = Math.round((tDate - lastDate) / 86400000);
  if (diff === 1 && state.checkins[today]) state.streak += 1;
  else if (diff === 0) {/* same day, no change */}
  else if (diff > 1 && state.checkins[today]) state.streak = 1; else if (diff > 1) state.streak = 0;
}

function avgEffort7(state) {
  const dates = Object.keys(state.checkins).sort().slice(-7);
  if (!dates.length) return 0;
  const sum = dates.reduce((a,d) => a + (Number(state.checkins[d]?.effort||0)), 0);
  return Math.round((sum/dates.length) * 20); // 1..5 -> 20..100
}

// Tabs & swipe
let currentTab = 'path';
let touchStartX = null;
const tabsOrder = ['path','goals','progress','gym','profile'];
function switchTab(name, animateDir) {
  if (!name) return;
  if (name === currentTab) return;
  const prev = document.querySelector(`[data-tab-section="${currentTab}"]`);
  const next = document.querySelector(`[data-tab-section="${name}"]`);
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.getAttribute('data-tab') === name));
  if (prev && next) {
    if (animateDir) {
      prev.classList.add(animateDir === 'left' ? 'slide-out-left' : 'slide-out-right');
      next.classList.add(animateDir === 'left' ? 'slide-in-right' : 'slide-in-left');
      next.classList.remove('hidden');
      setTimeout(() => {
        prev.classList.add('hidden');
        prev.classList.remove('slide-out-left','slide-out-right');
        next.classList.remove('slide-in-left','slide-in-right');
      }, 250);
    } else {
      document.querySelectorAll('.tab-section').forEach((s) => s.classList.toggle('hidden', s !== next));
    }
    currentTab = name;
  }
}

function bindSwipes() {
  document.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, {passive:true});
  document.addEventListener('touchend', (e) => {
    if (touchStartX == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX; touchStartX = null;
    if (Math.abs(dx) < 40) return;
    const idx = tabsOrder.indexOf(currentTab);
    if (dx < 0 && idx < tabsOrder.length-1) switchTab(tabsOrder[idx+1], 'left');
    else if (dx > 0 && idx > 0) switchTab(tabsOrder[idx-1], 'right');
  }, {passive:true});
}

function calcGritScore(form) {
  const values = Array.from(form.querySelectorAll('select')).map((s) => Number(s.value || 0));
  if (!values.length) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return (sum / values.length).toFixed(1);
}

function onReady() {
  applyTelegramTheme?.();
  // Tabs click (delegation)
  document.querySelector('.tabbar')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab');
    if (!btn) return;
    e.preventDefault();
    const target = btn.getAttribute('data-tab');
    const idx = tabsOrder.indexOf(currentTab);
    const targetIdx = tabsOrder.indexOf(target);
    const dir = targetIdx > idx ? 'left' : targetIdx < idx ? 'right' : null;
    switchTab(target, dir);
  });
  document.querySelector('.icon-btn')?.addEventListener('click', (e) => { e.preventDefault(); switchTab('profile'); });
  // Init tab
  currentTab = 'path';
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.getAttribute('data-tab') === 'path'));
  document.querySelectorAll('.tab-section').forEach((s) => s.classList.toggle('hidden', s.getAttribute('data-tab-section') !== 'path'));
  bindSwipes();

  // State init
  let state = ensureDefaults(loadState());
  // Effort ring
  const ring = document.querySelector('.effort-ring');
  const pct = avgEffort7(state); ring?.style.setProperty('--val', String(pct));
  // Streak
  const sv = document.getElementById('streak-val'); if (sv) sv.textContent = String(state.streak || 0);
  // Goals
  const mainGoal = state.goals?.main; const gTitle = document.querySelector('[data-tab-section="goals"] .gl-title');
  if (gTitle && mainGoal) gTitle.textContent = mainGoal;

  // Focus
  const focusChk = document.getElementById('focus-done');
  focusChk?.addEventListener('change', () => tg?.HapticFeedback?.notificationOccurred(focusChk.checked ? 'success' : 'warning'));

  // Check-in modal
  const modal = document.getElementById('checkin-modal');
  const openBtn = document.getElementById('open-checkin');
  openBtn?.addEventListener('click', () => modal?.classList.remove('hidden'));
  document.querySelectorAll('[data-close="checkin"]').forEach((el) => el.addEventListener('click', () => modal?.classList.add('hidden')));
  document.getElementById('chk-save')?.addEventListener('click', () => {
    const effort = Number(document.getElementById('chk-effort')?.value || 0);
    const win = document.getElementById('chk-win')?.value || '';
    const challenge = document.getElementById('chk-challenge')?.value || '';
    const key = todayKey();
    state.checkins[key] = { effort, win, challenge };
    state.lastCheckin = key;
    updateStreak(state);
    saveState(state);
    // update UI
    document.getElementById('streak-val').textContent = String(state.streak);
    const pct2 = avgEffort7(state); ring?.style.setProperty('--val', String(pct2));
    modal?.classList.add('hidden');
    showToast('День сохранён'); tg?.HapticFeedback?.notificationOccurred('success');
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
  function fillPlanStructure(structured) {
    const map = [
      ['plan-daily-ritual','daily_ritual'],
      ['plan-mini-plan','mini_plan'],
      ['plan-focus-blocks','focus_blocks'],
      ['plan-anti-slip','anti_slip'],
      ['plan-weekly-markers','weekly_markers'],
    ];
    map.forEach(([ulId, key]) => {
      const ul = document.getElementById(ulId);
      if (!ul) return;
      ul.innerHTML = '';
      const arr = structured?.[key] || [];
      arr.forEach((text) => {
        const li = document.createElement('li');
        li.innerHTML = `<input type="checkbox"/> ${text}`;
        ul.appendChild(li);
      });
    });
  }
  genForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    genResult.classList.remove('hidden');
    genResult.textContent = 'Генерирую…';
    const task = document.getElementById('gen-task').value.trim();
    const frequency = document.getElementById('gen-frequency').value;
    const time = Number(document.getElementById('gen-time').value || 0);
    const constraints = document.getElementById('gen-constraints').value.trim();
    if (!task || time <= 0) return showToast('Заполните задачу и время');
    try {
      const data = await postJSON('/api/plan/generate', { init: getInitDataUnsafe(), task, frequency, time_minutes: time, constraints });
      const structured = data?.structured && (data.structured.daily_ritual?.length || data.structured.mini_plan?.length || data.structured.focus_blocks?.length || data.structured.anti_slip?.length || data.structured.weekly_markers?.length)
        ? data.structured
        : parsePlanTextToStructured(data?.plan_text || '');
      // persist
      const s = ensureDefaults(loadState());
      s.lastGeneratedPlan = { task, frequency, time_minutes: time, constraints, structured, plan_text: data?.plan_text || '' };
      saveState(s);
      // fill UI
      fillPlanStructure(structured);
      genResult.textContent = 'План сохранён и разложен по структуре ниже';
      tg?.HapticFeedback?.notificationOccurred('success');
    } catch (err) {
      console.error(err); genResult.textContent = 'Ошибка генерации'; showToast('Ошибка генерации'); tg?.HapticFeedback?.notificationOccurred('error');
    }
  });

  // Оставшиеся обработчики (план/факт)
  const planForm = document.getElementById('plan-form');
  const factForm = document.getElementById('fact-form');
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
