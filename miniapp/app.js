const tg = window.Telegram?.WebApp;

function showToast(message, type = 'info') {
  const node = document.createElement('div');
  node.className = `toast toast-${type}`;
  node.textContent = message;
  node.setAttribute('role', 'alert');
  document.body.appendChild(node);
  
  // Animate in
  requestAnimationFrame(() => {
    node.classList.add('toast-show');
  });
  
  setTimeout(() => {
    node.classList.remove('toast-show');
    setTimeout(() => node.remove(), 300);
  }, 2200);
}

function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = 'Отправка...';
    button.classList.add('btn-loading');
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
    button.classList.remove('btn-loading');
  }
}

function validateForm(form) {
  const inputs = form.querySelectorAll('input[type="number"]');
  let isValid = true;
  let hasValue = false;
  
  inputs.forEach(input => {
    const value = parseInt(input.value) || 0;
    
    // Clear previous validation
    input.classList.remove('input-error', 'input-success');
    
    if (input.value.trim() && value < 0) {
      input.classList.add('input-error');
      isValid = false;
    } else if (value > 0) {
      input.classList.add('input-success');
      hasValue = true;
    }
  });
  
  return { isValid, hasValue };
}

function getInitDataUnsafe() {
  try {
    return tg?.initDataUnsafe || {};
  } catch (e) {
    return {};
  }
}

function openInTelegram() {
  if (!tg) {
    window.open('https://t.me', '_blank');
    return;
  }
  tg.expand?.();
}

// User settings and personalization
const userSettings = {
  mainGoal: '',
  actionType: '',
  
  save() {
    try {
      localStorage.setItem('grit_user_settings', JSON.stringify({
        mainGoal: this.mainGoal,
        actionType: this.actionType
      }));
    } catch (e) {
      console.warn('Could not save user settings:', e);
    }
  },
  
  load() {
    try {
      const stored = localStorage.getItem('grit_user_settings');
      if (stored) {
        const data = JSON.parse(stored);
        this.mainGoal = data.mainGoal || '';
        this.actionType = data.actionType || '';
      }
    } catch (e) {
      console.warn('Could not load user settings:', e);
    }
  },
  
  updateInterface() {
    const actionLabels = document.querySelectorAll('span');
    actionLabels.forEach(label => {
      if (label.textContent.includes('Целевые действия')) {
        if (this.actionType) {
          label.textContent = label.textContent.replace('Целевые действия', this.actionType);
        }
      }
    });
    
    // Update subtitle if main goal is set
    if (this.mainGoal) {
      const subtitle = document.querySelector('.subtitle');
      if (subtitle) {
        subtitle.textContent = `Цель: ${this.mainGoal}`;
      }
    }
  }
};

// Progress tracking functionality
const dailyProgress = {
  goals: { touches: 0, demos: 0, focus_minutes: 0 },
  current: { touches: 0, demos: 0, focus_minutes: 0 },
  
  updateGoals(goals) {
    this.goals = { ...goals };
    this.updateDisplay();
    this.saveToStorage();
  },
  
  updateCurrent(increments) {
    this.current.touches += increments.touches || 0;
    this.current.demos += increments.demos || 0;
    this.current.focus_minutes += increments.focus_minutes || 0;
    this.updateDisplay();
    this.saveToStorage();
  },
  
  updateDisplay() {
    // Update progress text
    document.getElementById('touches-progress').textContent = 
      `${this.current.touches} / ${this.goals.touches}`;
    document.getElementById('demos-progress').textContent = 
      `${this.current.demos} / ${this.goals.demos}`;
    document.getElementById('focus-progress').textContent = 
      `${this.current.focus_minutes} / ${this.goals.focus_minutes} мин`;
    
    // Update progress bars
    this.updateProgressBar('touches', this.current.touches, this.goals.touches);
    this.updateProgressBar('demos', this.current.demos, this.goals.demos);
    this.updateProgressBar('focus', this.current.focus_minutes, this.goals.focus_minutes);
    
    // Check for perfect day
    this.checkPerfectDay();
  },
  
  updateProgressBar(type, current, goal) {
    const bar = document.getElementById(`${type}-bar`);
    if (!bar || goal === 0) return;
    
    const percentage = Math.min((current / goal) * 100, 100);
    bar.style.width = `${percentage}%`;
    
    if (current >= goal) {
      bar.classList.add('complete');
    } else {
      bar.classList.remove('complete');
    }
  },
  
  checkPerfectDay() {
    const isPerfect = this.current.touches >= this.goals.touches && 
                      this.current.demos >= this.goals.demos && 
                      this.current.focus_minutes >= this.goals.focus_minutes &&
                      (this.goals.touches > 0 || this.goals.demos > 0 || this.goals.focus_minutes > 0);
    
    const indicator = document.getElementById('perfect-day-indicator');
    if (isPerfect) {
      indicator.classList.remove('hidden');
    } else {
      indicator.classList.add('hidden');
    }
  },
  
  saveToStorage() {
    try {
      localStorage.setItem('grit_progress', JSON.stringify({
        goals: this.goals,
        current: this.current,
        date: new Date().toDateString()
      }));
    } catch (e) {
      console.warn('Could not save progress to localStorage:', e);
    }
  },
  
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('grit_progress');
      if (stored) {
        const data = JSON.parse(stored);
        const today = new Date().toDateString();
        
        if (data.date === today) {
          this.goals = data.goals || { touches: 0, demos: 0, focus_minutes: 0 };
          this.current = data.current || { touches: 0, demos: 0, focus_minutes: 0 };
        } else {
          // New day, reset current but keep goals
          this.goals = data.goals || { touches: 0, demos: 0, focus_minutes: 0 };
          this.current = { touches: 0, demos: 0, focus_minutes: 0 };
        }
        
        this.updateDisplay();
      }
    } catch (e) {
      console.warn('Could not load progress from localStorage:', e);
    }
  }
};

// Offline queue for failed requests
const offlineQueue = {
  queue: [],
  
  add(url, data) {
    this.queue.push({ url, data, timestamp: Date.now() });
    this.saveToStorage();
  },
  
  async processQueue() {
    if (this.queue.length === 0) return;
    
    const processed = [];
    for (const item of this.queue) {
      try {
        await postJSON(item.url, item.data);
        processed.push(item);
      } catch (err) {
        console.warn('Failed to process offline item:', err);
        // Keep item in queue if it's not too old (24 hours)
        if (Date.now() - item.timestamp > 24 * 60 * 60 * 1000) {
          processed.push(item); // Remove old items
        }
      }
    }
    
    this.queue = this.queue.filter(item => !processed.includes(item));
    this.saveToStorage();
    
    if (processed.length > 0) {
      showToast(`Синхронизировано ${processed.length} записей`, 'success');
    }
  },
  
  saveToStorage() {
    try {
      localStorage.setItem('grit_offline_queue', JSON.stringify(this.queue));
    } catch (e) {
      console.warn('Could not save offline queue:', e);
    }
  },
  
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('grit_offline_queue');
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not load offline queue:', e);
      this.queue = [];
    }
  }
};

async function postJSON(url, data) {
  try {
    const resp = await fetch(url, {
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
  } catch (error) {
    // If offline, add to queue
    if (!navigator.onLine) {
      offlineQueue.add(url, data);
      throw new Error('Сохранено локально. Отправится при подключении к сети.');
    }
    throw error;
  }
}

function onReady() {
  const planForm = document.getElementById('plan-form');
  const factForm = document.getElementById('fact-form');
  const modal = document.getElementById('onboarding-modal');
  const onbOk = document.getElementById('onb-ok');
  
  // Initialize user settings
  userSettings.load();
  userSettings.updateInterface();
  
  // Initialize progress tracking
  dailyProgress.loadFromStorage();
  
  // Initialize offline support
  offlineQueue.loadFromStorage();
  
  // Handle online/offline events
  window.addEventListener('online', () => {
    showToast('Подключение восстановлено', 'success');
    offlineQueue.processQueue();
  });
  
  window.addEventListener('offline', () => {
    showToast('Работа в автономном режиме', 'warning');
  });

  // Onboarding modal — показать один раз или если нет главной цели
  const ONB_KEY = 'grit_onboarding_v1';
  const shouldShowOnboarding = !localStorage.getItem(ONB_KEY) || !userSettings.mainGoal;
  if (shouldShowOnboarding && modal) {
    modal.classList.remove('hidden');
    // Pre-fill existing values
    if (userSettings.mainGoal) {
      document.getElementById('main-goal').value = userSettings.mainGoal;
    }
    if (userSettings.actionType) {
      document.getElementById('action-type').value = userSettings.actionType;
    }
  }
  
  onbOk?.addEventListener('click', () => {
    // Save user settings
    const mainGoal = document.getElementById('main-goal').value.trim();
    const actionType = document.getElementById('action-type').value.trim();
    
    if (!mainGoal) {
      showToast('Пожалуйста, укажите вашу главную цель', 'warning');
      return;
    }
    
    userSettings.mainGoal = mainGoal;
    userSettings.actionType = actionType || 'Целевые действия';
    userSettings.save();
    userSettings.updateInterface();
    
    localStorage.setItem(ONB_KEY, '1');
    modal?.classList.add('hidden');
    showToast('Настройки сохранены!', 'success');
  });
  
  modal?.querySelector('[data-onb-close]')?.addEventListener('click', () => {
    if (!userSettings.mainGoal) {
      showToast('Пожалуйста, настройте вашу цель', 'warning');
      return;
    }
    localStorage.setItem(ONB_KEY, '1');
    modal?.classList.add('hidden');
  });

  planForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = planForm.querySelector('button[type="submit"]');
    const { isValid, hasValue } = validateForm(planForm);
    
    if (!isValid) {
      showToast('Пожалуйста, введите корректные значения (не меньше 0)', 'error');
      tg?.HapticFeedback?.notificationOccurred('error');
      return;
    }
    
    if (!hasValue) {
      showToast('Введите хотя бы одну цель на день', 'warning');
      return;
    }
    
    const plan = {
      touches: Number(document.getElementById('plan-touches').value || 0),
      demos: Number(document.getElementById('plan-demos').value || 0),
      focus_minutes: Number(document.getElementById('plan-focus').value || 0),
    };
    
    setButtonLoading(submitBtn, true);
    
    try {
      await postJSON('/api/plan/today', { plan, init: getInitDataUnsafe() });
      showToast('План сохранён', 'success');
      tg?.HapticFeedback?.notificationOccurred('success');
      
      // Update progress tracking with new goals
      dailyProgress.updateGoals(plan);
      
      // Clear form after successful submission
      planForm.reset();
      planForm.querySelectorAll('input').forEach(input => {
        input.classList.remove('input-error', 'input-success');
      });
      
    } catch (err) {
      console.error(err);
      showToast('Ошибка: не удалось сохранить план', 'error');
      tg?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  factForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = factForm.querySelector('button[type="submit"]');
    const { isValid, hasValue } = validateForm(factForm);
    
    if (!isValid) {
      showToast('Пожалуйста, введите корректные значения (не меньше 0)', 'error');
      tg?.HapticFeedback?.notificationOccurred('error');
      return;
    }
    
    if (!hasValue) {
      showToast('Введите хотя бы одно значение для добавления', 'warning');
      return;
    }
    
    const inc = {
      touches: Number(document.getElementById('fact-touches').value || 0),
      demos: Number(document.getElementById('fact-demos').value || 0),
      focus_minutes: Number(document.getElementById('fact-focus').value || 0),
    };
    
    setButtonLoading(submitBtn, true);
    
    try {
      await postJSON('/api/fact/increment', { inc, init: getInitDataUnsafe() });
      showToast('Факт добавлен', 'success');
      tg?.HapticFeedback?.notificationOccurred('success');
      
      // Update progress tracking with increments
      dailyProgress.updateCurrent(inc);
      
      factForm.reset();
      factForm.querySelectorAll('input').forEach(input => {
        input.classList.remove('input-error', 'input-success');
      });
    } catch (err) {
      console.error(err);
      showToast('Ошибка: не удалось добавить факт', 'error');
      tg?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  try { tg?.ready(); } catch (_) {}
}

document.addEventListener('DOMContentLoaded', onReady);


