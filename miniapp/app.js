const tg = window.Telegram?.WebApp;

function getApiBase() {
  const ls = (typeof localStorage !== 'undefined') ? localStorage.getItem('GRIT_API_BASE') : '';
  return ls || window.GRIT_API_BASE || 'http://localhost:8000';
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

function onReady() {
  const planForm = document.getElementById('plan-form');
  const factForm = document.getElementById('fact-form');
  const modal = document.getElementById('onboarding-modal');
  const onbOk = document.getElementById('onb-ok');
  
  // Onboarding modal — показать один раз
  const ONB_KEY = 'grit_onboarding_v1';
  const shouldShowOnboarding = !localStorage.getItem(ONB_KEY);
  if (shouldShowOnboarding && modal) {
    modal.classList.remove('hidden');
  }
  onbOk?.addEventListener('click', () => {
    localStorage.setItem(ONB_KEY, '1');
    modal?.classList.add('hidden');
  });
  modal?.querySelector('[data-onb-close]')?.addEventListener('click', () => {
    localStorage.setItem(ONB_KEY, '1');
    modal?.classList.add('hidden');
  });

  // Генерация плана через онбординг
  const onbForm = document.getElementById('onb-form');
  const onbResult = document.getElementById('onb-result');
  onbForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const task = document.getElementById('onb-task').value.trim();
    const frequency = document.getElementById('onb-frequency').value;
    const time = Number(document.getElementById('onb-time').value || 0);
    const constraints = document.getElementById('onb-constraints').value.trim();
    if (!task || time <= 0) {
      showToast('Заполните задачу и время в день');
      return;
    }
    try {
      const data = await postJSON('/api/plan/generate', {
        init: getInitDataUnsafe(),
        task,
        frequency,
        time_minutes: time,
        constraints,
      });
      const text = data?.plan_text || 'План сгенерирован.';
      if (onbResult) {
        onbResult.textContent = text;
        onbResult.classList.remove('hidden');
      }
      tg?.HapticFeedback?.notificationOccurred('success');
    } catch (err) {
      console.error(err);
      showToast('Ошибка генерации плана');
      tg?.HapticFeedback?.notificationOccurred('error');
    }
  });

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
