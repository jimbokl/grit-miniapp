const tg = window.Telegram?.WebApp;

// GRIT Data Management
const gritData = {
  profile: {
    id: '',
    createdAt: null,
    gritLevel: 0,
    totalScore: 0,
    mainGoal: {
      text: '',
      createdAt: null,
      targetDate: null,
      progress: 0
    },
    quarterlyGoals: [],
    dailyActions: {
      primary: '',
      secondary: '',
      focusType: 'работа'
    },
    streak: {
      current: 0,
      longest: 0,
      comebacks: 0
    }
  },
  
  dailyLogs: [],
  analytics: {
    patterns: {},
    trends: {}
  },
  
  save() {
    localStorage.setItem('grit_data', JSON.stringify({
      profile: this.profile,
      dailyLogs: this.dailyLogs,
      analytics: this.analytics,
      lastSaved: Date.now()
    }));
  },
  
  load() {
    try {
      const stored = localStorage.getItem('grit_data');
      if (stored) {
        const data = JSON.parse(stored);
        this.profile = { ...this.profile, ...data.profile };
        this.dailyLogs = data.dailyLogs || [];
        this.analytics = data.analytics || { patterns: {}, trends: {} };
      }
    } catch (e) {
      console.warn('Could not load GRIT data:', e);
    }
  },
  
  // GRIT Score Calculator
  calculateGritScore() {
    const today = new Date().toDateString();
    const recentLogs = this.dailyLogs.filter(log => 
      new Date(log.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    
    // Passion Score (0-25)
    let passionScore = 0;
    if (this.profile.mainGoal.text) passionScore += 10;
    if (this.profile.quarterlyGoals.length > 0) passionScore += 10;
    if (recentLogs.length > 20) passionScore += 5;
    
    // Perseverance Score (0-25)  
    let perseveranceScore = 0;
    perseveranceScore += Math.min(this.profile.streak.current, 15);
    perseveranceScore += Math.min(this.profile.streak.comebacks * 2, 10);
    
    // Consistency Score (0-25)
    let consistencyScore = 0;
    const consistentDays = recentLogs.filter(log => 
      log.actions.primary > 0 || log.actions.secondary > 0 || log.actions.focusMinutes > 0
    ).length;
    consistencyScore += Math.min(consistentDays, 15);
    consistencyScore += Math.min(recentLogs.length / 3, 10);
    
    // Growth Score (0-25)
    let growthScore = 0;
    if (recentLogs.length > 0) {
      const avgReflection = recentLogs.filter(log => log.reflection).length / recentLogs.length;
      growthScore += avgReflection * 15;
      if (this.profile.quarterlyGoals.some(g => g.progress > 50)) growthScore += 10;
    }
    
    const totalScore = Math.round(passionScore + perseveranceScore + consistencyScore + growthScore);
    this.profile.totalScore = totalScore;
    return totalScore;
  },
  
  getGritLevel(score) {
    if (score >= 91) return 'GRIT Чемпион 👑';
    if (score >= 76) return 'Мастер настойчивости 🔥';
    if (score >= 51) return 'Целеустремленный 🎯';
    if (score >= 26) return 'Развивающийся 💪';
    return 'Новичок 🌱';
  },
  
  addQuarterlyGoal(text, deadline) {
    const goal = {
      id: Date.now().toString(),
      text: text.trim(),
      deadline: deadline,
      progress: 0,
      linkedToMain: true,
      createdAt: new Date().toISOString()
    };
    this.profile.quarterlyGoals.push(goal);
    this.save();
    return goal;
  },
  
  updateGoalProgress(goalId, progress) {
    const goal = this.profile.quarterlyGoals.find(g => g.id === goalId);
    if (goal) {
      goal.progress = Math.min(Math.max(progress, 0), 100);
      this.save();
    }
  },
  
  logDay(actions, mood, obstacles, reflection) {
    const today = new Date().toDateString();
    const existingLog = this.dailyLogs.find(log => log.date === today);
    
    const logEntry = {
      date: today,
      mainGoalProgress: this.profile.mainGoal.progress,
      quarterlyProgress: this.profile.quarterlyGoals.reduce((acc, goal) => {
        acc[goal.id] = goal.progress;
        return acc;
      }, {}),
      actions: actions,
      mood: mood,
      obstacles: obstacles || '',
      reflection: reflection || '',
      gritScore: this.calculateGritScore(),
      timestamp: Date.now()
    };
    
    if (existingLog) {
      Object.assign(existingLog, logEntry);
    } else {
      this.dailyLogs.push(logEntry);
      // Update streak
      this.updateStreak();
    }
    
    this.save();
    return logEntry;
  },
  
  updateStreak() {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toDateString();
    
    const yesterdayLog = this.dailyLogs.find(log => log.date === yesterdayStr);
    const hasYesterdayActivity = yesterdayLog && (
      yesterdayLog.actions.primary > 0 || 
      yesterdayLog.actions.secondary > 0 || 
      yesterdayLog.actions.focusMinutes > 0
    );
    
    if (hasYesterdayActivity) {
      this.profile.streak.current += 1;
      if (this.profile.streak.current > this.profile.streak.longest) {
        this.profile.streak.longest = this.profile.streak.current;
      }
    } else if (this.profile.streak.current > 0) {
      // Streak broken - record comeback
      this.profile.streak.comebacks += 1;
      this.profile.streak.current = 0;
    }
  }
};

// UI Management
const gritUI = {
  updateHeader() {
    const score = gritData.calculateGritScore();
    const level = gritData.getGritLevel(score);
    
    document.getElementById('score-value').textContent = score;
    document.getElementById('grit-level').textContent = level;
    document.getElementById('streak-count').textContent = gritData.profile.streak.current;
    
    const goalText = document.getElementById('goal-text');
    if (gritData.profile.mainGoal.text) {
      goalText.textContent = gritData.profile.mainGoal.text;
    }
  },
  
  showEditGoalModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-card">
        <h2>✏️ Редактировать главную цель</h2>
        <div class="goal-setup">
          <label class="goal-input">
            <span>🎯 Ваша главная цель:</span>
            <input id="edit-main-goal" type="text" value="${gritData.profile.mainGoal.text}" maxlength="100" />
          </label>
          <label class="goal-input">
            <span>📅 Целевая дата (опционально):</span>
            <input id="edit-target-date" type="date" value="${gritData.profile.mainGoal.targetDate || ''}" />
          </label>
        </div>
        <div class="onb-actions">
          <button id="save-goal" class="btn primary">💾 Сохранить</button>
          <button id="cancel-edit" class="btn ghost">❌ Отмена</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('save-goal').onclick = () => {
      const newGoal = document.getElementById('edit-main-goal').value.trim();
      const targetDate = document.getElementById('edit-target-date').value;
      
      if (newGoal) {
        gritData.profile.mainGoal.text = newGoal;
        gritData.profile.mainGoal.targetDate = targetDate;
        gritData.save();
        this.updateHeader();
        showToast('🎯 Главная цель обновлена!', 'success');
      }
      modal.remove();
    };
    
    document.getElementById('cancel-edit').onclick = () => modal.remove();
  },
  
  showAddQuarterlyGoalModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-card">
        <h2>🎲 Добавить промежуточную цель</h2>
        <div class="goal-setup">
          <label class="goal-input">
            <span>🎯 Описание цели:</span>
            <input id="quarterly-goal-text" type="text" placeholder="Например: Привлечь 1000 пользователей" maxlength="100" />
          </label>
          <label class="goal-input">
            <span>📅 Дедлайн:</span>
            <input id="quarterly-deadline" type="date" required />
          </label>
        </div>
        <div class="onb-actions">
          <button id="save-quarterly" class="btn primary">💾 Сохранить</button>
          <button id="cancel-quarterly" class="btn ghost">❌ Отмена</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Set default deadline to 3 months from now
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 3);
    document.getElementById('quarterly-deadline').value = deadline.toISOString().split('T')[0];
    
    document.getElementById('save-quarterly').onclick = () => {
      const text = document.getElementById('quarterly-goal-text').value.trim();
      const deadline = document.getElementById('quarterly-deadline').value;
      
      if (text && deadline) {
        const goal = gritData.addQuarterlyGoal(text, deadline);
        this.renderQuarterlyGoals();
        showToast('🎲 Промежуточная цель добавлена!', 'success');
      }
      modal.remove();
    };
    
    document.getElementById('cancel-quarterly').onclick = () => modal.remove();
  },
  
  renderQuarterlyGoals() {
    const container = document.getElementById('quarterly-goals');
    container.innerHTML = '';
    
    gritData.profile.quarterlyGoals.forEach(goal => {
      const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
      const isOverdue = daysLeft < 0;
      
      const goalElement = document.createElement('div');
      goalElement.className = 'quarterly-goal-item';
      goalElement.innerHTML = `
        <div class="goal-header">
          <span class="goal-title">${goal.text}</span>
          <span class="days-left ${isOverdue ? 'overdue' : ''}">${isOverdue ? 'Просрочено' : `${daysLeft} дней`}</span>
        </div>
        <div class="goal-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${goal.progress}%"></div>
          </div>
          <span class="progress-text">${goal.progress}%</span>
        </div>
        <div class="goal-actions">
          <button onclick="gritUI.updateGoalProgress('${goal.id}', ${Math.min(goal.progress + 10, 100)})" class="mini-btn">+10%</button>
          <button onclick="gritUI.updateGoalProgress('${goal.id}', ${Math.min(goal.progress + 25, 100)})" class="mini-btn">+25%</button>
          <button onclick="gritUI.deleteQuarterlyGoal('${goal.id}')" class="mini-btn delete">🗑️</button>
        </div>
      `;
      container.appendChild(goalElement);
    });
    
    if (gritData.profile.quarterlyGoals.length === 0) {
      container.innerHTML = '<div class="no-goals">Пока нет промежуточных целей. Добавьте первую!</div>';
    }
  },
  
  updateGoalProgress(goalId, newProgress) {
    gritData.updateGoalProgress(goalId, newProgress);
    this.renderQuarterlyGoals();
    this.updateHeader();
    showToast(`📈 Прогресс обновлен: ${newProgress}%`, 'success');
  },
  
  deleteQuarterlyGoal(goalId) {
    if (confirm('Удалить эту промежуточную цель?')) {
      gritData.profile.quarterlyGoals = gritData.profile.quarterlyGoals.filter(g => g.id !== goalId);
      gritData.save();
      this.renderQuarterlyGoals();
      this.updateHeader();
      showToast('🗑️ Цель удалена', 'warning');
    }
  }
};

// Progress tracking (enhanced)
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
    
    // Log to GRIT system
    gritData.logDay(this.current, 5, '', '');
    gritUI.updateHeader();
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
      // Trigger GRIT celebration
      this.celebratePerfectDay();
    } else {
      indicator.classList.add('hidden');
    }
  },
  
  celebratePerfectDay() {
    // Update streak
    gritData.profile.streak.current += 1;
    if (gritData.profile.streak.current > gritData.profile.streak.longest) {
      gritData.profile.streak.longest = gritData.profile.streak.current;
    }
    gritData.save();
    gritUI.updateHeader();
    
    showToast(`🔥 Perfect Day! Streak: ${gritData.profile.streak.current} дней!`, 'success');
    
    // Trigger celebration animation
    const indicator = document.getElementById('perfect-day-indicator');
    indicator.style.animation = 'celebrate 0.5s ease-in-out 3';
  },
  
  save() {
    const today = new Date().toDateString();
    localStorage.setItem('daily_progress', JSON.stringify({
      goals: this.goals,
      current: this.current,
      date: today
    }));
  },
  
  load() {
    try {
      const stored = localStorage.getItem('daily_progress');
      if (stored) {
        const data = JSON.parse(stored);
        const today = new Date().toDateString();
        
        if (data.date === today) {
          this.goals = data.goals || { touches: 0, demos: 0, focus_minutes: 0 };
          this.current = data.current || { touches: 0, demos: 0, focus_minutes: 0 };
        } else {
          // New day - reset current but keep goals
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

function validateForm(form) {
  const inputs = form.querySelectorAll('input[type="number"]');
  let isValid = true;
  let hasValue = false;
  
  inputs.forEach(input => {
    const value = parseInt(input.value) || 0;
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

function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = 'Сохранение...';
    button.classList.add('btn-loading');
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
    button.classList.remove('btn-loading');
  }
}

function onReady() {
  // Initialize GRIT system
  gritData.load();
  gritUI.updateHeader();
  gritUI.renderQuarterlyGoals();
  
  // Initialize daily progress
  dailyProgress.load();
  
  const modal = document.getElementById('onboarding-modal');
  const onbOk = document.getElementById('onb-ok');
  
  // Show onboarding if no main goal set
  if (!gritData.profile.mainGoal.text && modal) {
    modal.classList.remove('hidden');
  }
  
  // Onboarding setup
  onbOk?.addEventListener('click', () => {
    const mainGoal = document.getElementById('main-goal').value.trim();
    const action1Name = document.getElementById('action1-name').value.trim();
    const action2Name = document.getElementById('action2-name').value.trim();
    const focusType = document.getElementById('focus-type').value;
    
    if (!mainGoal) {
      showToast('🎯 Пожалуйста, укажите вашу главную цель', 'warning');
      return;
    }
    
    // Initialize GRIT profile
    gritData.profile.id = Date.now().toString();
    gritData.profile.createdAt = new Date().toISOString();
    gritData.profile.mainGoal = {
      text: mainGoal,
      createdAt: new Date().toISOString(),
      targetDate: null,
      progress: 0
    };
    gritData.profile.dailyActions = {
      primary: action1Name || 'Основные действия',
      secondary: action2Name || 'Вспомогательные действия',
      focusType: focusType
    };
    
    gritData.save();
    gritUI.updateHeader();
    
    modal?.classList.add('hidden');
    showToast('🔥 GRIT Tracker настроен! Начинайте достигать!', 'success');
  });
  
  // Edit goal functionality
  document.getElementById('edit-goal-btn').addEventListener('click', () => {
    gritUI.showEditGoalModal();
  });
  
  // Add quarterly goal
  document.getElementById('add-quarterly-goal').addEventListener('click', () => {
    gritUI.showAddQuarterlyGoalModal();
  });
  
  // Plan form
  document.getElementById('plan-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const { isValid, hasValue } = validateForm(e.target);
    if (!isValid) {
      showToast('Пожалуйста, введите корректные значения', 'error');
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
    
    dailyProgress.updateGoals(plan);
    showToast('📋 План на день установлен!', 'success');
    e.target.reset();
    
    tg?.HapticFeedback?.notificationOccurred('success');
  });
  
  // Fact form
  document.getElementById('fact-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const { isValid, hasValue } = validateForm(e.target);
    if (!isValid) {
      showToast('Пожалуйста, введите корректные значения', 'error');
      return;
    }
    
    if (!hasValue) {
      showToast('Введите хотя бы одно значение', 'warning');
      return;
    }
    
    const inc = {
      touches: Number(document.getElementById('fact-touches').value || 0),
      demos: Number(document.getElementById('fact-demos').value || 0),
      focus_minutes: Number(document.getElementById('fact-focus').value || 0),
    };
    
    dailyProgress.updateCurrent(inc);
    showToast('✅ Прогресс засчитан! Отличная работа!', 'success');
    e.target.reset();
    
    tg?.HapticFeedback?.notificationOccurred('success');
  });
  
  try { tg?.ready(); } catch (_) {}
}

document.addEventListener('DOMContentLoaded', onReady);