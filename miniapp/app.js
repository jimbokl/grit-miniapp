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
