const tg = window.Telegram?.WebApp;

// User personalization
const userSettings = {
  mainGoal: '',
  action1Name: '',
  action2Name: '',
  focusType: 'работа',
  
  save() {
    localStorage.setItem('grit_user_settings', JSON.stringify({
      mainGoal: this.mainGoal,
      action1Name: this.action1Name,
      action2Name: this.action2Name,
      focusType: this.focusType
    }));
  },
  
  load() {
    try {
      const stored = localStorage.getItem('grit_user_settings');
      if (stored) {
        const data = JSON.parse(stored);
        this.mainGoal = data.mainGoal || '';
        this.action1Name = data.action1Name || '';
        this.action2Name = data.action2Name || '';
        this.focusType = data.focusType || 'работа';
      }
    } catch (e) {
      console.warn('Could not load settings:', e);
    }
  },
  
  updateInterface() {
    const subtitle = document.getElementById('goal-subtitle');
    if (subtitle && this.mainGoal) {
      subtitle.textContent = `🎯 ${this.mainGoal}`;
    }
    
    // Update labels
    if (this.action1Name) {
      document.getElementById('plan-action1-label').textContent = `${this.action1Name} (шт)`;
      document.getElementById('fact-action1-label').textContent = `${this.action1Name} +`;
      document.getElementById('progress-action1-label').textContent = this.action1Name;
    }
    
    if (this.action2Name) {
      document.getElementById('plan-action2-label').textContent = `${this.action2Name} (шт)`;
      document.getElementById('fact-action2-label').textContent = `${this.action2Name} +`;
      document.getElementById('progress-action2-label').textContent = this.action2Name;
    }
  }
};

// Progress tracking
const dailyProgress = {
  goals: { touches: 0, demos: 0, focus_minutes: 0 },
  current: { touches: 0, demos: 0, focus_minutes: 0 },
  
  updateGoals(goals) {
    this.goals = { ...goals };
    this.updateDisplay();
    this.save();
  },
  
  updateCurrent(increments) {
    this.current.touches += increments.touches || 0;
    this.current.demos += increments.demos || 0;
    this.current.focus_minutes += increments.focus_minutes || 0;
    this.updateDisplay();
    this.save();
  },
  
  updateDisplay() {
    document.getElementById('touches-progress').textContent = `${this.current.touches} / ${this.goals.touches}`;
    document.getElementById('demos-progress').textContent = `${this.current.demos} / ${this.goals.demos}`;
    document.getElementById('focus-progress').textContent = `${this.current.focus_minutes} / ${this.goals.focus_minutes} мин`;
    
    this.updateProgressBar('touches', this.current.touches, this.goals.touches);
    this.updateProgressBar('demos', this.current.demos, this.goals.demos);
    this.updateProgressBar('focus', this.current.focus_minutes, this.goals.focus_minutes);
    
    this.checkPerfectDay();
  },
  
  updateProgressBar(type, current, goal) {
    const bar = document.getElementById(`${type}-bar`);
    if (!bar || goal === 0) return;
    
    const percentage = Math.min((current / goal) * 100, 100);
    bar.style.width = `${percentage}%`;
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
  
  save() {
    localStorage.setItem('grit_progress', JSON.stringify({
      goals: this.goals,
      current: this.current,
      date: new Date().toDateString()
    }));
  },
  
  load() {
    try {
      const stored = localStorage.getItem('grit_progress');
      if (stored) {
        const data = JSON.parse(stored);
        const today = new Date().toDateString();
        
        if (data.date === today) {
          this.goals = data.goals || { touches: 0, demos: 0, focus_minutes: 0 };
          this.current = data.current || { touches: 0, demos: 0, focus_minutes: 0 };
        } else {
          this.goals = data.goals || { touches: 0, demos: 0, focus_minutes: 0 };
          this.current = { touches: 0, demos: 0, focus_minutes: 0 };
        }
        
        this.updateDisplay();
      }
    } catch (e) {
      console.warn('Could not load progress:', e);
    }
  }
};

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} toast-show`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function onReady() {
  userSettings.load();
  userSettings.updateInterface();
  dailyProgress.load();
  
  const modal = document.getElementById('onboarding-modal');
  const onbOk = document.getElementById('onb-ok');
  
  // Show onboarding if no goal set
  if (!userSettings.mainGoal && modal) {
    modal.classList.remove('hidden');
  }
  
  onbOk?.addEventListener('click', () => {
    const mainGoal = document.getElementById('main-goal').value.trim();
    const action1Name = document.getElementById('action1-name').value.trim();
    const action2Name = document.getElementById('action2-name').value.trim();
    const focusType = document.getElementById('focus-type').value;
    
    if (!mainGoal) {
      showToast('Пожалуйста, укажите вашу главную цель', 'warning');
      return;
    }
    
    userSettings.mainGoal = mainGoal;
    userSettings.action1Name = action1Name || 'Основные действия';
    userSettings.action2Name = action2Name || 'Вспомогательные действия';
    userSettings.focusType = focusType;
    userSettings.save();
    userSettings.updateInterface();
    
    modal?.classList.add('hidden');
    showToast('🎉 Персональный трекер настроен!', 'success');
  });
  
  // Plan form
  document.getElementById('plan-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const plan = {
      touches: Number(document.getElementById('plan-touches').value || 0),
      demos: Number(document.getElementById('plan-demos').value || 0),
      focus_minutes: Number(document.getElementById('plan-focus').value || 0),
    };
    
    dailyProgress.updateGoals(plan);
    showToast('📋 План сохранен', 'success');
    e.target.reset();
    
    tg?.HapticFeedback?.notificationOccurred('success');
  });
  
  // Fact form
  document.getElementById('fact-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const inc = {
      touches: Number(document.getElementById('fact-touches').value || 0),
      demos: Number(document.getElementById('fact-demos').value || 0),
      focus_minutes: Number(document.getElementById('fact-focus').value || 0),
    };
    
    if (inc.touches === 0 && inc.demos === 0 && inc.focus_minutes === 0) {
      showToast('Введите хотя бы одно значение', 'warning');
      return;
    }
    
    dailyProgress.updateCurrent(inc);
    showToast('✅ Добавлено!', 'success');
    e.target.reset();
    
    tg?.HapticFeedback?.notificationOccurred('success');
  });
  
  try { tg?.ready(); } catch (_) {}
}

document.addEventListener('DOMContentLoaded', onReady);