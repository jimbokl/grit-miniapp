const tg = window.Telegram?.WebApp;

// Get Telegram user info - FIXED
function getTelegramUser() {
  try {
    const user = tg?.initDataUnsafe?.user;
    if (user && user.id) {
      return {
        id: user.id.toString(),
        username: user.username || `user_${user.id}`,
        firstName: user.first_name || '',
        lastName: user.last_name || ''
      };
    }
  } catch (e) {
    console.warn('Could not get Telegram user:', e);
  }
  
  // Immediate fallback for web testing
  return {
    id: 'demo_123',
    username: 'demo_user',
    firstName: 'Demo',
    lastName: 'User'
  };
}

// REAL Cloud Sync System 
const cloudSync = {
  // Real backend API endpoint
  baseUrl: 'http://212.34.150.91:5000/api',
  
  async saveToCloud(userData) {
    try {
      const telegramUser = getTelegramUser();
      
      // Save to real backend API
      const response = await fetch(`${this.baseUrl}/sync/${telegramUser.username}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramUser: telegramUser,
          profile: userData.profile,
          gtd: userData.gtd,
          dailyLogs: userData.dailyLogs,
          analytics: userData.analytics,
          lastSaved: Date.now()
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('☁️ Data saved to cloud:', result.message);
        return true;
      } else {
        console.warn('Cloud save failed:', response.status);
        return false;
      }
    } catch (error) {
      console.warn('Cloud sync failed:', error);
      return false;
    }
  },
  
  async loadFromCloud() {
    try {
      const telegramUser = getTelegramUser();
      
      // Load from real backend API
      const response = await fetch(`${this.baseUrl}/sync/${telegramUser.username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('☁️ Data loaded from cloud:', result.message);
        return result.data;
      } else if (response.status === 404) {
        console.log('📱 No cloud data found for user');
        return null;
      } else {
        console.warn('Cloud load failed:', response.status);
        return null;
      }
    } catch (error) {
      console.warn('Cloud load failed:', error);
      return null;
    }
  },
  
  // UNIVERSAL SYNC: Use same key pattern across all devices/browsers
  saveToUniversalStorage(userData) {
    try {
      const telegramUser = getTelegramUser();
      
      // Universal key format - will work across devices with same browser
      const universalKey = `GRIT_USER_${telegramUser.username}`;
      const syncData = {
        username: telegramUser.username,
        userData: userData,
        lastSync: Date.now(),
        device: navigator.platform || 'unknown'
      };
      
      // Save to multiple keys for maximum compatibility
      localStorage.setItem(universalKey, JSON.stringify(syncData));
      localStorage.setItem(`grit_${telegramUser.username}`, JSON.stringify(syncData));
      localStorage.setItem('grit_latest_user', telegramUser.username);
      
      console.log('💾 Saved to universal storage:', universalKey);
      return true;
    } catch (error) {
      console.warn('Universal storage save failed:', error);
      return false;
    }
  },
  
  loadFromUniversalStorage() {
    try {
      const telegramUser = getTelegramUser();
      
      // Try multiple key formats
      const keys = [
        `GRIT_USER_${telegramUser.username}`,
        `grit_${telegramUser.username}`,
        `grit_shared_${telegramUser.username}`,
        `grit_gtd_data_${telegramUser.username}`
      ];
      
      for (const key of keys) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const syncData = JSON.parse(stored);
            // Check if data belongs to current user
            if (syncData.username === telegramUser.username || 
                syncData.user?.username === telegramUser.username ||
                syncData.telegramUser?.username === telegramUser.username) {
              
              console.log('📱 Loaded from universal storage:', key);
              return syncData.userData || syncData.data || syncData;
            }
          } catch (e) {
            console.warn('Invalid data in key:', key);
          }
        }
      }
      
      console.log('❌ No data found for user:', telegramUser.username);
      return null;
    } catch (error) {
      console.warn('Universal storage load failed:', error);
      return null;
    }
  }
};

// GRIT + GTD Super System
const gritGtdData = {
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
  
  // GTD System
  gtd: {
    inbox: [],           // Raw captured items
    nextActions: [],     // Clarified actionable items  
    projects: [],        // Multi-step outcomes
    waiting: [],         // Delegated items
    someday: [],         // Future considerations
    contexts: ['📱 Телефон', '💻 Компьютер', '🏠 Дома', '🏢 Офис', '🚗 В дороге', '🧠 Обдумать'],
    weeklyReview: {
      lastReview: null,
      completed: 0,
      insights: []
    }
  },
  
  dailyLogs: [],
  analytics: {
    patterns: {},
    trends: {}
  },
  
  // GTD Methods
  captureItem(text) {
    const item = {
      id: Date.now().toString(),
      text: text.trim(),
      captured: new Date().toISOString(),
      processed: false
    };
    this.gtd.inbox.push(item);
    this.save();
    return item;
  },
  
  clarifyItem(itemId, clarification) {
    const item = this.gtd.inbox.find(i => i.id === itemId);
    if (!item) return null;
    
    const { action, context, priority, energy } = clarification;
    
    if (action === 'delete') {
      this.gtd.inbox = this.gtd.inbox.filter(i => i.id !== itemId);
    } else if (action === 'next') {
      const nextAction = {
        id: item.id,
        text: item.text,
        context: context || '🧠 Обдумать',
        priority: priority || 'B',
        energy: energy || 'medium',
        createdAt: new Date().toISOString(),
        linkedGoal: null
      };
      this.gtd.nextActions.push(nextAction);
      this.gtd.inbox = this.gtd.inbox.filter(i => i.id !== itemId);
    } else if (action === 'project') {
      const project = {
        id: item.id,
        title: item.text,
        actions: [],
        context: context || '🧠 Обдумать',
        priority: priority || 'B',
        createdAt: new Date().toISOString()
      };
      this.gtd.projects.push(project);
      this.gtd.inbox = this.gtd.inbox.filter(i => i.id !== itemId);
    } else if (action === 'someday') {
      const somedayItem = {
        id: item.id,
        text: item.text,
        createdAt: new Date().toISOString()
      };
      this.gtd.someday.push(somedayItem);
      this.gtd.inbox = this.gtd.inbox.filter(i => i.id !== itemId);
    }
    
    this.save();
    return true;
  },
  
  completeAction(actionId) {
    const action = this.gtd.nextActions.find(a => a.id === actionId);
    if (action) {
      action.completedAt = new Date().toISOString();
      this.gtd.nextActions = this.gtd.nextActions.filter(a => a.id !== actionId);
      
      // Add to GRIT daily log as activity
      const today = new Date().toDateString();
      let todayLog = this.dailyLogs.find(log => log.date === today);
      if (!todayLog) {
        todayLog = {
          date: today,
          actions: { primary: 0, secondary: 0, focusMinutes: 0 },
          gtdActions: 0,
          mood: 5,
          obstacles: '',
          reflection: ''
        };
        this.dailyLogs.push(todayLog);
      }
      
      todayLog.gtdActions = (todayLog.gtdActions || 0) + 1;
      this.save();
      return true;
    }
    return false;
  },

  async save() {
    const telegramUser = getTelegramUser();
    const userData = {
      profile: this.profile,
      gtd: this.gtd,
      dailyLogs: this.dailyLogs,
      analytics: this.analytics,
      lastSaved: Date.now()
    };
    
    // Save locally first
    const key = `grit_gtd_data_${telegramUser.username}`;
    localStorage.setItem(key, JSON.stringify({
      telegramUser: telegramUser,
      ...userData
    }));
    
    // Real cloud sync to backend
    try {
      const cloudSaved = await cloudSync.saveToCloud(userData);
      if (cloudSaved) {
        console.log('✅ Data saved to cloud backend');
        // Update sync status in UI
        const syncStatus = document.getElementById('sync-status');
        if (syncStatus) {
          syncStatus.innerHTML = `☁️ Синхронизировано с облаком<br><small style="opacity:0.7;">${new Date().toLocaleTimeString()}</small>`;
          syncStatus.style.color = 'var(--success)';
        }
      } else {
        // Fallback to URL sharing if cloud fails
        const telegramUser = getTelegramUser();
        const compressed = btoa(JSON.stringify({
          u: telegramUser.username,
          d: userData
        })).slice(0, 200);
        
        const shareUrl = `${window.location.origin}${window.location.pathname}#user=${compressed}`;
        
        const syncStatus = document.getElementById('sync-status');
        if (syncStatus) {
          syncStatus.innerHTML = `
            ⚠️ Облако недоступно. Для синхронизации:<br>
            <button onclick="copyShareUrl('${shareUrl}')" style="background: var(--warning); color: white; border: none; border-radius: 8px; padding: 4px 8px; font-size: 10px; margin-top: 4px;">
              📋 Копировать ссылку
            </button>
          `;
        }
      }
    } catch (error) {
      console.warn('Cloud sync completely failed:', error);
    }
  },
  
  async load() {
    try {
      const telegramUser = getTelegramUser();
      
      // PRIORITY 1: Try cloud API first
      let syncedData = null;
      try {
        syncedData = await cloudSync.loadFromCloud();
        if (syncedData) {
          console.log('☁️ Data loaded from cloud backend');
          showToast('☁️ Загружены цели из облака', 'success');
        }
      } catch (error) {
        console.warn('Cloud API load failed:', error);
      }
      
      // PRIORITY 2: Try URL hash if cloud fails
      if (!syncedData) {
        syncedData = loadFromUrlHash();
        if (syncedData) {
          console.log('🔗 Data loaded from shared URL');
          showToast('🔗 Загружены цели по ссылке', 'success');
        }
      }
      
      // PRIORITY 3: Try localStorage as last resort
      if (!syncedData) {
        try {
          syncedData = cloudSync.loadFromUniversalStorage();
          if (syncedData) {
            console.log('📱 Data found in localStorage');
            showToast('📱 Загружены локальные цели', 'info');
          }
        } catch (error) {
          console.warn('Local sync load failed:', error);
        }
      }
      
      if (syncedData) {
        // Use synced data
        this.profile = { ...this.profile, ...syncedData.profile };
        this.gtd = { ...this.gtd, ...syncedData.gtd };
        this.dailyLogs = syncedData.dailyLogs || [];
        this.analytics = syncedData.analytics || { patterns: {}, trends: {} };
      } else {
        // Fallback to localStorage
        const userKey = `grit_gtd_data_${telegramUser.username}`;
        let stored = localStorage.getItem(userKey);
        
        if (!stored) {
          // Try old formats for migration
          stored = localStorage.getItem('grit_gtd_data') || localStorage.getItem('grit_data');
        }
        
        if (stored) {
          const data = JSON.parse(stored);
          this.profile = { ...this.profile, ...data.profile };
          this.gtd = { ...this.gtd, ...(data.gtd || {}) };
          this.dailyLogs = data.dailyLogs || [];
          this.analytics = data.analytics || { patterns: {}, trends: {} };
        }
      }
      
      // Always set current user info
      this.profile.telegramUser = telegramUser;
      
      // Auto-save after load to sync across devices
      setTimeout(() => this.save(), 1000);
      
    } catch (e) {
      console.warn('Could not load GRIT+GTD data:', e);
      // Initialize new user if all fails
      this.profile.telegramUser = getTelegramUser();
      this.save();
    }
  },
  
  // GRIT Score Calculator with edge case handling
  calculateGritScore() {
    try {
      const recentLogs = this.dailyLogs.filter(log => {
        try {
          return new Date(log.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        } catch (e) {
          return false;
        }
      });
      
      // Passion Score (0-25) - Goal clarity and emotional connection
      let passionScore = 0;
      if (this.profile.mainGoal?.text) passionScore += 10;
      if (this.profile.quarterlyGoals?.length > 0) passionScore += 10;
      if (recentLogs.length > 20) passionScore += 5;
      
      // Perseverance Score (0-25) - Resilience and comeback ability
      let perseveranceScore = 0;
      const currentStreak = Math.max(0, this.profile.streak?.current || 0);
      const comebacks = Math.max(0, this.profile.streak?.comebacks || 0);
      perseveranceScore += Math.min(currentStreak, 15);
      perseveranceScore += Math.min(comebacks * 2, 10);
      
      // Consistency Score (0-25) - Daily execution reliability
      let consistencyScore = 0;
      const consistentDays = recentLogs.filter(log => {
        try {
          const actions = log.actions || {};
          return (actions.primary > 0) || (actions.secondary > 0) || (actions.focusMinutes > 0);
        } catch (e) {
          return false;
        }
      }).length;
      consistencyScore += Math.min(consistentDays, 15);
      consistencyScore += Math.min(Math.floor(recentLogs.length / 3), 10);
      
      // Growth Score (0-25) - Learning and adaptation
      let growthScore = 0;
      if (recentLogs.length > 0) {
        const reflectionDays = recentLogs.filter(log => log.reflection && log.reflection.trim()).length;
        const avgReflection = reflectionDays / recentLogs.length;
        growthScore += Math.floor(avgReflection * 15);
        
        const progressGoals = (this.profile.quarterlyGoals || []).filter(g => g.progress > 50);
        if (progressGoals.length > 0) growthScore += 10;
      }
      
      const totalScore = Math.max(0, Math.min(100, Math.round(passionScore + perseveranceScore + consistencyScore + growthScore)));
      this.profile.totalScore = totalScore;
      return totalScore;
      
    } catch (error) {
      console.warn('Error calculating GRIT score:', error);
      return 0;
    }
  },
  
  getGritLevel(score) {
    if (score >= 91) return 'ГРИТ Чемпион 👑';
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

// GRIT + GTD UI Management
const gritGtdUI = {
  updateHeader() {
    try {
      const score = gritGtdData.calculateGritScore();
      const level = gritGtdData.getGritLevel(score);
      
      const scoreEl = document.getElementById('score-value');
      const levelEl = document.getElementById('grit-level');
      const streakEl = document.getElementById('streak-count');
      const goalTextEl = document.getElementById('goal-text');
      const editBtn = document.getElementById('edit-goal-btn');
      
      if (scoreEl) scoreEl.textContent = score;
      if (levelEl) levelEl.textContent = level;
      if (streakEl) streakEl.textContent = gritGtdData.profile.streak?.current || 0;
      
      if (goalTextEl && gritGtdData.profile.mainGoal?.text) {
        goalTextEl.textContent = gritGtdData.profile.mainGoal.text;
      }
      
      // Update user info immediately
      const userInfoEl = document.getElementById('user-info');
      if (userInfoEl) {
        const user = gritGtdData.profile.telegramUser || getTelegramUser();
        userInfoEl.textContent = `👤 ${user.firstName || 'Demo'} ${user.lastName || 'User'} (@${user.username})`;
      }
      
      // Edit button listener is handled in onReady()
      
    } catch (error) {
      console.warn('Error updating header:', error);
    }
  },
  
  // GTD UI Methods
  renderInbox() {
    const container = document.getElementById('inbox-items');
    if (!container) return;
    
    container.innerHTML = '';
    
    gritGtdData.gtd.inbox.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'inbox-item';
      itemEl.innerHTML = `
        <div class="item-text">${item.text}</div>
        <div class="item-actions">
          <button onclick="gritGtdUI.showClarifyModal('${item.id}')" class="mini-btn">🔍 Обработать</button>
          <button onclick="gritGtdUI.deleteInboxItem('${item.id}')" class="mini-btn delete">🗑️</button>
        </div>
      `;
      container.appendChild(itemEl);
    });
    
    if (gritGtdData.gtd.inbox.length === 0) {
      container.innerHTML = '<div class="empty-inbox">Входящие пусты - отлично! 🎯</div>';
    }
  },
  
  renderNextActions() {
    const container = document.getElementById('next-actions');
    if (!container) return;
    
    container.innerHTML = '';
    
    gritGtdData.gtd.nextActions.forEach(action => {
      const actionEl = document.createElement('div');
      actionEl.className = `action-item priority-${action.priority.toLowerCase()}`;
      actionEl.innerHTML = `
        <div class="item-text">${action.text}</div>
        <div class="item-meta">
          <span class="context-badge energy-${action.energy}">${action.context}</span>
        </div>
        <div class="item-actions">
          <button onclick="gritGtdUI.completeAction('${action.id}')" class="mini-btn">✅ Готово</button>
        </div>
      `;
      container.appendChild(actionEl);
    });
    
    if (gritGtdData.gtd.nextActions.length === 0) {
      container.innerHTML = '<div class="empty-actions">Пока нет действий. Обработайте входящие!</div>';
    }
  },
  
  showClarifyModal(itemId) {
    const item = gritGtdData.gtd.inbox.find(i => i.id === itemId);
    if (!item) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-card compact">
        <h2>🔍 Обработать задачу</h2>
        <div class="clarify-item">"${item.text}"</div>
        <div class="clarify-options">
          <button onclick="gritGtdUI.clarifyAs('${itemId}', 'next')" class="btn primary">⚡ Действие</button>
          <button onclick="gritGtdUI.clarifyAs('${itemId}', 'project')" class="btn primary">📋 Проект</button>
          <button onclick="gritGtdUI.clarifyAs('${itemId}', 'someday')" class="btn ghost">🔮 Когда-нибудь</button>
          <button onclick="gritGtdUI.clarifyAs('${itemId}', 'delete')" class="btn ghost">🗑️ Удалить</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },
  
  clarifyAs(itemId, action) {
    gritGtdData.clarifyItem(itemId, { action });
    this.renderInbox();
    this.renderNextActions();
    
    const actionNames = {
      'next': '⚡ Следующее действие',
      'project': '📋 Проект', 
      'someday': '🔮 Когда-нибудь',
      'delete': '🗑️ Удалено'
    };
    
    showToast(`📝 Обработано как ${actionNames[action]}`, 'success');
    
    // Close modal
    document.querySelector('.modal')?.remove();
  },
  
  deleteInboxItem(itemId) {
    gritGtdData.gtd.inbox = gritGtdData.gtd.inbox.filter(i => i.id !== itemId);
    gritGtdData.save();
    this.renderInbox();
    showToast('🗑️ Задача удалена', 'warning');
  },
  
  completeAction(actionId) {
    const success = gritGtdData.completeAction(actionId);
    if (success) {
      this.renderNextActions();
      this.updateHeader();
      showToast('✅ Действие выполнено! ГРИТ+Система работает!', 'success');
    }
  },
  
  showEditGoalModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-card compact">
        <h2>✏️ Редактировать цель</h2>
        <div class="goal-setup">
          <label class="goal-input">
            <span>🎯 Главная цель:</span>
            <input id="edit-main-goal" type="text" value="${gritGtdData.profile.mainGoal.text}" maxlength="100" />
          </label>
          <label class="goal-input">
            <span>📅 Дедлайн:</span>
            <input id="edit-target-date" type="date" value="${gritGtdData.profile.mainGoal.targetDate || ''}" />
          </label>
        </div>
        <div class="onb-actions">
          <button id="save-goal" class="btn primary">💾 Сохранить</button>
          <button id="cancel-edit" class="btn ghost">❌ Отмена</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    
    // Save button handler
    const saveBtn = modal.querySelector('#save-goal');
    const cancelBtn = modal.querySelector('#cancel-edit');
    
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const newGoal = document.getElementById('edit-main-goal').value.trim();
        const targetDate = document.getElementById('edit-target-date').value;
        
        if (newGoal) {
          gritGtdData.profile.mainGoal.text = newGoal;
          gritGtdData.profile.mainGoal.targetDate = targetDate;
          gritGtdData.save();
          this.updateHeader();
          showToast('🎯 Главная цель обновлена!', 'success');
          modal.remove();
        } else {
          showToast('🎯 Пожалуйста, укажите цель', 'warning');
          document.getElementById('edit-main-goal').focus();
        }
      });
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        modal.remove();
      });
    }
    
    // ESC key to close
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  },
  
  showAddQuarterlyGoalModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-card compact">
        <h2>🎲 Новая цель</h2>
        <div class="goal-setup">
          <label class="goal-input">
            <span>🎯 Описание:</span>
            <input id="quarterly-goal-text" type="text" placeholder="Привлечь 1000 пользователей" maxlength="100" />
          </label>
          <label class="goal-input">
            <span>📅 Дедлайн:</span>
            <div class="custom-date-picker">
              <input id="quarterly-deadline" type="text" readonly placeholder="Выберите дату" />
              <button type="button" class="date-picker-btn" onclick="this.parentElement.querySelector('.date-dropdown').classList.toggle('hidden')">📅</button>
              <div class="date-dropdown hidden">
                <div class="quick-dates">
                  <button type="button" onclick="setQuarterlyDate(7)" class="quick-date-btn">Неделя</button>
                  <button type="button" onclick="setQuarterlyDate(30)" class="quick-date-btn">Месяц</button>
                  <button type="button" onclick="setQuarterlyDate(90)" class="quick-date-btn">Квартал</button>
                  <button type="button" onclick="setQuarterlyDate(180)" class="quick-date-btn">Полгода</button>
                </div>
                <div class="month-picker">
                  <select id="month-select">
                    <option value="0">Январь</option>
                    <option value="1">Февраль</option>
                    <option value="2">Март</option>
                    <option value="3">Апрель</option>
                    <option value="4">Май</option>
                    <option value="5">Июнь</option>
                    <option value="6">Июль</option>
                    <option value="7">Август</option>
                    <option value="8">Сентябрь</option>
                    <option value="9">Октябрь</option>
                    <option value="10">Ноябрь</option>
                    <option value="11">Декабрь</option>
                  </select>
                  <select id="year-select"></select>
                </div>
                <button type="button" onclick="applyCustomDate()" class="btn primary" style="margin-top: 12px; width: 100%;">Применить</button>
              </div>
            </div>
          </label>
        </div>
        <div class="onb-actions">
          <button id="save-quarterly" class="btn primary">💾 Сохранить</button>
          <button id="cancel-quarterly" class="btn ghost">❌ Отмена</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Initialize year select
    const yearSelect = document.getElementById('year-select');
    if (yearSelect) {
      const currentYear = new Date().getFullYear();
      for (let year = currentYear; year <= currentYear + 3; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
      }
      yearSelect.value = currentYear;
    }
    
    // Initialize month select to current month
    const monthSelect = document.getElementById('month-select');
    if (monthSelect) {
      monthSelect.value = new Date().getMonth().toString();
    }
    
    // Set default deadline to 3 months from now
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 3);
    const defaultDate = deadline.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long', 
      year: 'numeric'
    });
    
    const deadlineInput = document.getElementById('quarterly-deadline');
    if (deadlineInput) {
      deadlineInput.value = defaultDate;
      deadlineInput.setAttribute('data-date', deadline.toISOString().split('T')[0]);
    }
    
    // Button handlers with proper selectors
    const saveQuarterlyBtn = modal.querySelector('#save-quarterly');
    const cancelQuarterlyBtn = modal.querySelector('#cancel-quarterly');
    
    if (saveQuarterlyBtn) {
      saveQuarterlyBtn.addEventListener('click', () => {
        const text = document.getElementById('quarterly-goal-text').value.trim();
        const deadlineInput = document.getElementById('quarterly-deadline');
        const deadline = deadlineInput.getAttribute('data-date') || deadlineInput.value;
        
        if (!text) {
          showToast('🎯 Введите описание цели', 'warning');
          document.getElementById('quarterly-goal-text').focus();
          return;
        }
        
        if (!deadline) {
          showToast('📅 Выберите дедлайн', 'warning');
          return;
        }
        
        const goal = gritGtdData.addQuarterlyGoal(text, deadline);
        this.renderQuarterlyGoals();
        showToast('🎲 Промежуточная цель добавлена!', 'success');
        modal.remove();
      });
    }
    
    if (cancelQuarterlyBtn) {
      cancelQuarterlyBtn.addEventListener('click', () => {
        modal.remove();
      });
    }
    
    // ESC key to close
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  },
  
  renderQuarterlyGoals() {
    const container = document.getElementById('quarterly-goals');
    if (!container) return;
    
    container.innerHTML = '';
    
    gritGtdData.profile.quarterlyGoals.forEach(goal => {
      const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
      const isOverdue = daysLeft < 0;
      
      const goalElement = document.createElement('div');
      goalElement.className = 'quarterly-goal-item';
      // Enhanced deadline tracking
      const isUrgent = daysLeft <= 7 && daysLeft > 0;
      const deadlineText = isOverdue ? 'Просрочено!' : 
                          isUrgent ? `⚠️ ${daysLeft} дней` : 
                          `${daysLeft} дней`;
      
      // Format deadline date
      const deadlineDate = new Date(goal.deadline).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      
      goalElement.className = `quarterly-goal-item ${isOverdue ? 'goal-overdue' : isUrgent ? 'goal-urgent' : ''}`;
      goalElement.innerHTML = `
        <div class="goal-header">
          <span class="goal-title">${goal.text}</span>
          <span class="days-left ${isOverdue ? 'overdue' : isUrgent ? 'urgent' : ''}">${deadlineText}</span>
        </div>
        <div class="goal-deadline">
          📅 Дедлайн: ${deadlineDate}
        </div>
        <div class="goal-progress">
          <div class="progress-bar">
            <div class="progress-fill ${goal.progress >= 100 ? 'complete' : ''}" style="width: ${goal.progress}%"></div>
          </div>
          <span class="progress-text">${goal.progress}%</span>
        </div>
        <div class="goal-actions">
          <button onclick="window.updateGoalProgress('${goal.id}', ${Math.min(goal.progress + 10, 100)})" class="mini-btn">+10%</button>
          <button onclick="window.updateGoalProgress('${goal.id}', ${Math.min(goal.progress + 25, 100)})" class="mini-btn">+25%</button>
          ${goal.progress < 100 ? `<button onclick="window.updateGoalProgress('${goal.id}', 100)" class="mini-btn complete">✅ Готово</button>` : ''}
          <button onclick="window.deleteQuarterlyGoal('${goal.id}')" class="mini-btn delete">🗑️</button>
        </div>
      `;
      container.appendChild(goalElement);
    });
    
    if (gritGtdData.profile.quarterlyGoals.length === 0) {
      container.innerHTML = '<div class="no-goals">Пока нет промежуточных целей. Добавьте первую!</div>';
    }
    
    // Add button listener is handled in onReady()
  },
  
  updateGoalProgress(goalId, newProgress) {
    gritGtdData.updateGoalProgress(goalId, newProgress);
    this.renderQuarterlyGoals();
    this.updateHeader();
    showToast(`📈 Прогресс обновлен: ${newProgress}%`, 'success');
  },
  
  deleteQuarterlyGoal(goalId) {
    if (confirm('Удалить эту промежуточную цель?')) {
      gritGtdData.profile.quarterlyGoals = gritGtdData.profile.quarterlyGoals.filter(g => g.id !== goalId);
      gritGtdData.save();
      this.renderQuarterlyGoals();
      this.updateHeader();
      showToast('🗑️ Цель удалена', 'warning');
    }
  },
  
  updateAnalytics() {
    try {
      const profile = gritGtdData.profile;
      const logs = gritGtdData.dailyLogs || [];
      
      const longestStreakEl = document.getElementById('longest-streak');
      const totalDaysEl = document.getElementById('total-days');
      const comebacksEl = document.getElementById('comebacks');
      const goalsCompletedEl = document.getElementById('goals-completed');
      
      if (longestStreakEl) longestStreakEl.textContent = profile.streak?.longest || 0;
      if (totalDaysEl) totalDaysEl.textContent = logs.length;
      if (comebacksEl) comebacksEl.textContent = profile.streak?.comebacks || 0;
      
      const completedGoals = (profile.quarterlyGoals || []).filter(g => g.progress >= 100).length;
      if (goalsCompletedEl) goalsCompletedEl.textContent = completedGoals;
      
      // Update motivation message based on GRIT score
      this.updateMotivationMessage();
      this.updateJourneyTimeline();
      
      // Insights button listener is handled in onReady()
      
    } catch (error) {
      console.warn('Error updating analytics:', error);
    }
  },
  
  updateMotivationMessage() {
    const score = gritGtdData.profile.totalScore;
    const streak = gritGtdData.profile.streak.current;
    const level = gritGtdData.getGritLevel(score);
    
    const messages = {
      low: [
        "🌱 Каждый эксперт когда-то был новичком!",
        "💪 Маленькие шаги ведут к большим результатам!",
        "🎯 Фокусируйтесь на процессе, результат придет!",
        "🔥 Ваш ГРИТ растет с каждым днем!"
      ],
      medium: [
        "🚀 Вы на правильном пути к мастерству!",
        "⭐ Постоянство побеждает интенсивность!",
        "🎪 Препятствия - это возможности для роста!",
        "💎 Ваша настойчивость впечатляет!"
      ],
      high: [
        "👑 Вы - пример настоящего ГРИТ!",
        "🔥 Мастер не тот, кто не падает, а кто встает!",
        "⚡ Ваша страсть и настойчивость вдохновляют!",
        "🌟 Продолжайте показывать что значит истинный ГРИТ!"
      ]
    };
    
    let messageSet = messages.low;
    if (score >= 51) messageSet = messages.medium;
    if (score >= 76) messageSet = messages.high;
    
    const randomMessage = messageSet[Math.floor(Math.random() * messageSet.length)];
    document.getElementById('motivation-message').textContent = randomMessage;
  },
  
  updateJourneyTimeline() {
    try {
      const timeline = document.getElementById('journey-timeline');
      if (!timeline) return;
      
      const profile = gritGtdData.profile;
      const logs = (gritGtdData.dailyLogs || []).slice(-7).reverse(); // Last 7 days
      
      timeline.innerHTML = '';
      
      // Add creation milestone
      if (profile.createdAt) {
        try {
          const createDate = new Date(profile.createdAt);
          const daysAgo = Math.floor((Date.now() - createDate.getTime()) / (1000 * 60 * 60 * 24));
          
          const item = document.createElement('div');
          item.className = 'timeline-item';
          item.innerHTML = `
            <div class="timeline-date">${daysAgo} дней назад</div>
            <div class="timeline-content">🎯 Поставили главную цель: "${profile.mainGoal?.text || 'Цель'}"</div>
          `;
          timeline.appendChild(item);
        } catch (e) {
          console.warn('Error adding creation milestone:', e);
        }
      }
      
      // Add recent activity
      logs.forEach(log => {
        try {
          const date = new Date(log.date);
          const dayName = date.toLocaleDateString('ru', { weekday: 'short', day: 'numeric' });
          
          const actions = log.actions || {};
          const hasActivity = (actions.primary > 0) || (actions.secondary > 0) || (actions.focusMinutes > 0);
          const emoji = hasActivity ? '✅' : '⭕';
          const message = hasActivity ? 
            `Выполнено: ${(actions.primary || 0) + (actions.secondary || 0)} действий, ${actions.focusMinutes || 0} мин фокуса` :
            'День пропущен';
          
          const item = document.createElement('div');
          item.className = 'timeline-item';
          item.innerHTML = `
            <div class="timeline-date">${dayName}</div>
            <div class="timeline-content">${emoji} ${message}</div>
          `;
          timeline.appendChild(item);
        } catch (e) {
          console.warn('Error adding timeline item:', e);
        }
      });
      
      if (logs.length === 0) {
        timeline.innerHTML = '<div class="timeline-item"><div class="timeline-content">Начните отмечать прогресс каждый день!</div></div>';
      }
      
    } catch (error) {
      console.warn('Error updating journey timeline:', error);
    }
  },
  
  showInsights() {
    const profile = gritGtdData.profile;
    const logs = gritGtdData.dailyLogs;
    const score = profile.totalScore;
    
    let insights = [];
    
    // Generate insights based on data
    if (logs.length < 7) {
      insights.push("📊 Накопите больше данных для персональных инсайтов");
    } else {
      const avgFocus = logs.reduce((sum, log) => sum + log.actions.focusMinutes, 0) / logs.length;
      const bestDay = logs.reduce((best, log) => 
        (log.actions.primary + log.actions.secondary) > (best.actions?.primary + best.actions?.secondary || 0) ? log : best
      , {});
      
      insights.push(`🎯 Ваш средний фокус: ${Math.round(avgFocus)} минут в день`);
      insights.push(`⭐ Лучший день: ${bestDay.actions?.primary + bestDay.actions?.secondary || 0} действий`);
      
      if (profile.streak.current > 3) {
        insights.push(`🔥 Отличный streak! Продолжайте в том же духе!`);
      }
      
      if (profile.quarterlyGoals.length > 0) {
        const avgProgress = profile.quarterlyGoals.reduce((sum, g) => sum + g.progress, 0) / profile.quarterlyGoals.length;
        insights.push(`📈 Средний прогресс квартальных целей: ${Math.round(avgProgress)}%`);
      }
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-card">
        <h2>🧠 Ваши GRIT Инсайты</h2>
        <div class="insights-list">
          ${insights.map(insight => `<div class="insight-item">${insight}</div>`).join('')}
        </div>
        <div style="margin-top: 20px; padding: 16px; background: var(--bg-elevated); border-radius: 12px;">
          <strong>💡 Рекомендация:</strong><br>
          ${this.getPersonalizedRecommendation()}
        </div>
        <div class="onb-actions">
          <button id="close-insights" class="btn primary">👍 Понятно</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close button handler for insights
    const closeBtn = modal.querySelector('#close-insights');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.remove();
      });
    }
    
    // ESC key to close insights
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  },
  
  getPersonalizedRecommendation() {
    const score = gritGtdData.profile.totalScore;
    const streak = gritGtdData.profile.streak.current;
    const quarterlyGoals = gritGtdData.profile.quarterlyGoals.length;
    
    if (score < 25) {
      return "Начните с малого - поставьте 1-2 промежуточные цели и фокусируйтесь на постоянстве, а не на интенсивности.";
    } else if (score < 50) {
      return "Увеличьте сложность целей и добавьте ежедневную рефлексию для ускорения роста.";
    } else if (score < 75) {
      return "Отлично! Теперь работайте над более амбициозными целями и помогайте другим развивать ГРИТ.";
    } else {
      return "Вы мастер ГРИТ! Поделитесь своим опытом и вдохновляйте других на великие свершения!";
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
    gritGtdData.logDay({
      primary: this.current.touches,
      secondary: this.current.demos,
      focusMinutes: this.current.focus_minutes
    }, 5, '', '');
    gritGtdUI.updateHeader();
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
    // Prevent multiple celebrations for the same day
    const today = new Date().toDateString();
    const todayLog = gritGtdData.dailyLogs.find(log => log.date === today);
    
    if (todayLog && todayLog.perfectDayCelebrated) {
      return; // Already celebrated today
    }
    
    // Update streak
    const oldStreak = gritGtdData.profile.streak.current;
    gritGtdData.profile.streak.current += 1;
    if (gritGtdData.profile.streak.current > gritGtdData.profile.streak.longest) {
      gritGtdData.profile.streak.longest = gritGtdData.profile.streak.current;
    }
    
    // Mark celebration for today
    if (todayLog) {
      todayLog.perfectDayCelebrated = true;
    }
    
    gritGtdData.save();
    gritGtdUI.updateHeader();
    gritGtdUI.updateAnalytics();
    
    // Enhanced celebration message
    let celebrationMessage = `🔥 Идеальный день! Серия: ${gritGtdData.profile.streak.current} дней!`;
    
    if (gritGtdData.profile.streak.current === 7) {
      celebrationMessage = '🌟 Неделя подряд! Вы развиваете настоящий ГРИТ!';
    } else if (gritGtdData.profile.streak.current === 30) {
      celebrationMessage = '👑 Месяц подряд! Вы мастер настойчивости!';
    } else if (gritGtdData.profile.streak.current > oldStreak && gritGtdData.profile.streak.current > gritGtdData.profile.streak.longest - 1) {
      celebrationMessage = '🎆 Новый рекорд серии! Невероятная настойчивость!';
    }
    
    showToast(celebrationMessage, 'success');
    
    // Trigger celebration animation
    const indicator = document.getElementById('perfect-day-indicator');
    if (indicator) {
      indicator.style.animation = 'celebrate 0.5s ease-in-out 3';
      setTimeout(() => {
        indicator.style.animation = '';
      }, 1500);
    }
    
    // Haptic feedback for extra satisfaction
    tg?.HapticFeedback?.notificationOccurred('success');
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

// Global functions for onclick handlers
window.editGoal = function() {
  console.log('🔧 editGoal() called');
  if (window.gritGtdUI && window.gritGtdUI.showEditGoalModal) {
    window.gritGtdUI.showEditGoalModal();
  } else {
    console.error('❌ gritGtdUI.showEditGoalModal not available');
  }
};

window.addQuarterlyGoal = function() {
  console.log('🔧 addQuarterlyGoal() called');
  if (window.gritGtdUI && window.gritGtdUI.showAddQuarterlyGoalModal) {
    window.gritGtdUI.showAddQuarterlyGoalModal();
  } else {
    console.error('❌ gritGtdUI.showAddQuarterlyGoalModal not available');
  }
};

window.showInsights = function() {
  console.log('🔧 showInsights() called');
  if (window.gritGtdUI && window.gritGtdUI.showInsights) {
    window.gritGtdUI.showInsights();
  } else {
    console.error('❌ gritGtdUI.showInsights not available');
  }
};

// Goal management functions
window.updateGoalProgress = function(goalId, newProgress) {
  console.log('🔧 updateGoalProgress() called:', goalId, newProgress);
  if (window.gritGtdUI && window.gritGtdUI.updateGoalProgress) {
    window.gritGtdUI.updateGoalProgress(goalId, newProgress);
  } else {
    console.error('❌ gritGtdUI.updateGoalProgress not available');
  }
};

window.deleteQuarterlyGoal = function(goalId) {
  console.log('🔧 deleteQuarterlyGoal() called:', goalId);
  if (window.gritGtdUI && window.gritGtdUI.deleteQuarterlyGoal) {
    window.gritGtdUI.deleteQuarterlyGoal(goalId);
  } else {
    console.error('❌ gritGtdUI.deleteQuarterlyGoal not available');
  }
};

window.addMainGoal = function() {
  console.log('🔧 addMainGoal() called');
  const modal = document.getElementById('onboarding-modal');
  if (modal) {
    modal.classList.remove('hidden');
  } else {
    console.error('❌ Onboarding modal not found');
  }
};

// Share URL function
window.copyShareUrl = function(url) {
  navigator.clipboard.writeText(url).then(() => {
    showToast('📋 Ссылка скопирована! Откройте на другом устройстве', 'success');
  }).catch(() => {
    // Fallback - show URL in prompt
    prompt('Скопируйте эту ссылку для синхронизации:', url);
  });
};

// Load data from URL hash
function loadFromUrlHash() {
  try {
    const hash = window.location.hash.replace('#user=', '');
    if (hash) {
      const decoded = JSON.parse(atob(hash));
      const currentUser = getTelegramUser();
      
      if (decoded.u === currentUser.username) {
        console.log('🔗 Loading data from URL hash');
        return decoded.d;
      } else {
        console.log('❌ URL data is for different user:', decoded.u);
      }
    }
  } catch (error) {
    console.warn('URL hash load failed:', error);
  }
  return null;
}

// Date picker functions
window.setQuarterlyDate = function(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const formattedDate = date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  const input = document.getElementById('quarterly-deadline');
  if (input) {
    input.value = formattedDate;
    input.setAttribute('data-date', date.toISOString().split('T')[0]);
  }
  
  // Close dropdown
  const dropdown = document.querySelector('.date-dropdown');
  if (dropdown) {
    dropdown.classList.add('hidden');
  }
  
  showToast(`📅 Дедлайн установлен: ${formattedDate}`, 'success');
};

window.applyCustomDate = function() {
  const monthSelect = document.getElementById('month-select');
  const yearSelect = document.getElementById('year-select');
  
  if (monthSelect && yearSelect) {
    const month = parseInt(monthSelect.value);
    const year = parseInt(yearSelect.value);
    
    const date = new Date(year, month, 1);
    const formattedDate = date.toLocaleDateString('ru-RU', {
      month: 'long',
      year: 'numeric'
    });
    
    const input = document.getElementById('quarterly-deadline');
    if (input) {
      input.value = formattedDate;
      input.setAttribute('data-date', date.toISOString().split('T')[0]);
    }
    
    // Close dropdown
    const dropdown = document.querySelector('.date-dropdown');
    if (dropdown) {
      dropdown.classList.add('hidden');
    }
    
    showToast(`📅 Дедлайн установлен: ${formattedDate}`, 'success');
  }
};

async function onReady() {
  console.log('🚀 App starting...');
  
  // 1. FIRST: Get Telegram user
  const telegramUser = getTelegramUser();
  console.log('👤 Telegram user:', telegramUser);
  
  // Show user info immediately
  const userInfoEl = document.getElementById('sync-status');
  if (userInfoEl) {
    userInfoEl.textContent = `👤 ${telegramUser.firstName} (@${telegramUser.username})`;
  }
  
  // 2. SECOND: Load user's personal data
  console.log('📥 Loading user data...');
  await gritGtdData.load();
  
  // 3. THIRD: Copy UI methods to global scope
  window.gritGtdUI = gritGtdUI;
  
  // 4. FOURTH: Render all components with user data
  console.log('🎨 Rendering UI...');
  gritGtdUI.updateHeader();
  gritGtdUI.renderQuarterlyGoals();
  gritGtdUI.updateAnalytics();
  gritGtdUI.renderInbox();
  gritGtdUI.renderNextActions();
  
  // 5. Initialize daily progress
  dailyProgress.load();
  
  // 6. LAST: Check if onboarding needed AFTER data is loaded
  const modal = document.getElementById('onboarding-modal');
  const hasMainGoal = gritGtdData.profile.mainGoal?.text;
  
  console.log('🎯 Has main goal:', hasMainGoal);
  
  if (!hasMainGoal && modal) {
    console.log('🚀 Showing onboarding - no goal found');
    modal.classList.remove('hidden');
  } else {
    console.log('✅ User has goal, skipping onboarding');
  }
  
  // GTD Capture functionality - FIXED
  const captureInput = document.getElementById('quick-capture');
  const captureBtn = document.getElementById('capture-btn');
  
  if (captureBtn) {
    captureBtn.addEventListener('click', () => {
      const text = captureInput?.value?.trim();
      if (text) {
        gritGtdData.captureItem(text);
        gritGtdUI.renderInbox();
        captureInput.value = '';
        showToast('📥 Записано во входящие! Обработайте позже.', 'success');
      } else {
        showToast('📝 Введите текст для записи', 'warning');
      }
    });
  }
  
  if (captureInput) {
    captureInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        captureBtn?.click();
      }
    });
  }
  
  // MANUAL EVENT LISTENERS FOR ALL BUTTONS - WITH DEBUG
  setTimeout(() => {
    console.log('🔧 Setting up button listeners...');
    
    const editBtn = document.getElementById('edit-goal-btn');
    const addGoalBtn = document.getElementById('add-quarterly-goal');
    const insightsBtn = document.getElementById('show-insights');
    
    console.log('Buttons found:', { editBtn: !!editBtn, addGoalBtn: !!addGoalBtn, insightsBtn: !!insightsBtn });
    
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        console.log('✏️ Edit goal button clicked!');
        gritGtdUI.showEditGoalModal();
      });
      console.log('✅ Edit button listener added');
    } else {
      console.warn('❌ Edit button not found!');
    }
    
    if (addGoalBtn) {
      addGoalBtn.addEventListener('click', () => {
        console.log('➕ Add goal button clicked!');
        gritGtdUI.showAddQuarterlyGoalModal();
      });
      console.log('✅ Add goal button listener added');
    } else {
      console.warn('❌ Add goal button not found!');
    }
    
    if (insightsBtn) {
      insightsBtn.addEventListener('click', () => {
        console.log('🧠 Insights button clicked!');
        gritGtdUI.showInsights();
      });
      console.log('✅ Insights button listener added');
    } else {
      console.warn('❌ Insights button not found!');
    }
    
    // Test all buttons exist
    const allButtons = document.querySelectorAll('button');
    console.log(`📊 Total buttons found: ${allButtons.length}`);
    
  }, 100);
  
  // Onboarding setup
  onbOk?.addEventListener('click', () => {
    const mainGoal = document.getElementById('main-goal').value.trim();
    const action1Name = document.getElementById('action1-name').value.trim();
    const action2Name = document.getElementById('action2-name').value.trim();
    const focusType = document.getElementById('focus-type').value;
    
    if (!mainGoal) {
      showToast('🎯 Пожалуйста, укажите вашу главную цель', 'warning');
      document.getElementById('main-goal').style.animation = 'errorShake 0.5s ease-in-out';
      setTimeout(() => {
        document.getElementById('main-goal').style.animation = '';
      }, 500);
      return;
    }
    
    if (!action1Name) {
      showToast('📊 Пожалуйста, укажите основные действия', 'warning');
      document.getElementById('action1-name').style.animation = 'errorShake 0.5s ease-in-out';
      setTimeout(() => {
        document.getElementById('action1-name').style.animation = '';
      }, 500);
      return;
    }
    
    // Initialize GRIT+GTD profile
    gritGtdData.profile.id = Date.now().toString();
    gritGtdData.profile.createdAt = new Date().toISOString();
    gritGtdData.profile.mainGoal = {
      text: mainGoal,
      createdAt: new Date().toISOString(),
      targetDate: null,
      progress: 0
    };
    gritGtdData.profile.dailyActions = {
      primary: action1Name || 'Основные действия',
      secondary: action2Name || 'Вспомогательные действия',
      focusType: focusType
    };
    
    gritGtdData.save();
    gritGtdUI.updateHeader();
    
    modal?.classList.add('hidden');
    showToast('🔥 ГРИТ+Система настроена! Начинайте достигать!', 'success');
    
    // Re-render everything after setup
    gritGtdUI.updateHeader();
    gritGtdUI.renderQuarterlyGoals();
    gritGtdUI.updateAnalytics();
  });
  
  // TEST ALL FORMS
  console.log('🧪 Testing form elements...');
  
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
    
    // Enhanced motivation based on progress
    const totalActions = inc.touches + inc.demos;
    let motivationMessage = '✅ Прогресс засчитан!';
    
    if (totalActions >= 10) {
      motivationMessage = '🔥 Невероятная продуктивность! Вы на пути к мастерству!';
    } else if (totalActions >= 5) {
      motivationMessage = '💪 Отличная работа! GRIT в действии!';
    } else if (inc.focus_minutes >= 60) {
      motivationMessage = '🧠 Глубокий фокус - секрет больших достижений!';
    }
    
    showToast(motivationMessage, 'success');
    e.target.reset();
    
    // Update analytics after each entry
    gritGtdUI.updateAnalytics();
    
    tg?.HapticFeedback?.notificationOccurred('success');
  });
  
  try { tg?.ready(); } catch (_) {}
  
  // Start auto-sync every 30 seconds
  setInterval(async () => {
    try {
      console.log('🔄 Auto-sync check...');
      const cloudData = await cloudSync.loadFromCloud();
      
      if (cloudData && cloudData.lastSaved > gritGtdData.profile.lastSaved) {
        console.log('🔄 Newer data found in cloud, updating...');
        
        // Merge cloud data
        gritGtdData.profile = { ...gritGtdData.profile, ...cloudData.profile };
        gritGtdData.gtd = { ...gritGtdData.gtd, ...cloudData.gtd };
        gritGtdData.dailyLogs = cloudData.dailyLogs || gritGtdData.dailyLogs;
        
        // Re-render UI
        gritGtdUI.updateHeader();
        gritGtdUI.renderQuarterlyGoals();
        gritGtdUI.renderInbox();
        gritGtdUI.renderNextActions();
        gritGtdUI.updateAnalytics();
        
        showToast('🔄 Данные обновлены с другого устройства', 'info');
      }
    } catch (error) {
      console.warn('Auto-sync failed:', error);
    }
  }, 30000); // 30 seconds
}


document.addEventListener('DOMContentLoaded', onReady);