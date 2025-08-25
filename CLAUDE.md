## CLAUDE: GRIT BOT v2.0 Development Guidelines

This document defines the development standards for the GRIT BOT project (Telegram WebApp). This is a complete GRIT (passion + perseverance) tracking system with glassmorphism design based on Angela Duckworth's research.

## 🎯 PROJECT STATUS: PRODUCTION READY [Commit: 5be96eb]

### **✅ COMPLETED IMPLEMENTATION:**
- **Complete GRIT logic** documented in logic.md
- **Main goal management** with editing and target dates
- **Quarterly goals system** with deadlines and progress tracking
- **GRIT Score calculator** (Passion + Perseverance + Consistency + Growth)
- **Streak system** with comeback tracking and motivation
- **Analytics dashboard** with insights and recommendations
- **Journey timeline** visualization
- **Glassmorphism design** with purple-blue gradients
- **Full responsive mobile UI** optimized for Telegram WebApp

## 🚨 DEPLOYMENT LESSONS LEARNED (КОРНЕВАЯ ПРОБЛЕМА НАЙДЕНА):

### **🔍 ДИАГНОСТИКА ЗАВЕРШЕНА - 100% РЕШЕНИЕ:**

**КОРНЕВАЯ ПРИЧИНА:** 
- **Claude Code коммиты используют GITHUB_TOKEN**  
- **GitHub Pages НЕ ТРИГГЕРИТСЯ от GITHUB_TOKEN коммитов** (GitHub docs строка 76)
- Поэтому все мои 20+ коммитов НЕ запускали build!

**НАСТРОЙКИ ПРОЕКТА:**
- **GitHub Pages**: gh-pages branch, ROOT папка ✅
- **ЕДИНСТВЕННЫЙ URL**: https://jimbokl.github.io/grit-miniapp/ 
- **Проблема**: GITHUB_TOKEN ограничение

### **✅ РЕШЕНИЕ ПРИМЕНЕНО:**
- **Создан GitHub Actions workflow** (`.github/workflows/pages.yml`)
- **Автоматический деплой** при push в gh-pages
- **Обходит ограничение GITHUB_TOKEN**
- **Принудительно билдит Pages** при каждом коммите

### **🤦‍♂️ Мои ошибки в процессе:**
- Не знал про GITHUB_TOKEN ограничение
- Путался между main и gh-pages ветками  
- Обновлял неправильные папки (miniapp вместо root)
- Создал лишние файлы и URL
- Не читал GitHub Pages документацию внимательно
- Был "еблан" с deployment настройками 😅

### **📚 КЛЮЧЕВОЙ УРОК:**
**ВСЕГДА читать GitHub Pages документацию про GITHUB_TOKEN ограничения!**

### **📝 ИСТОРИЯ РАЗВИТИЯ ПРОЕКТА:**

#### **Phase 1: Deployment Issues (12:45-13:30)**
- **Коммит ce675b5** (12:45): Последний успешный деплой до проблемы
- **Коммиты 31cd961, cde83f3, b53095f** (13:17-13:20): Попытки исправить через force push
- **Коммит a1b97e3** (13:24): Создан GitHub Actions workflow  
- **Коммит 21a252e** (13:24): Триггер workflow для принудительного деплоя
- **РЕЗУЛЬТАТ**: GitHub Actions решил GITHUB_TOKEN ограничение

#### **Phase 2: GRIT Implementation (13:30-14:00)**
- **Коммит 5e9e7f7** (13:35): Базовая GRIT логика и scoring система
- **Коммит 6019290** (13:40): Полноценный glassmorphism miniapp
- **Коммит 3e543cc** (13:45): Добавлены version indicators
- **Коммит ad4b3b3** (13:50): COMPLETE GRIT BOT - production ready

#### **🎯 FINAL FEATURES [Commit: 5be96eb]:**
- ✅ **GRIT+GTD Integration**: Passion/Perseverance + Getting Things Done
- ✅ **Main Goal Management**: Editing with ESC/Save/Cancel functionality
- ✅ **Quarterly Goals**: Complete deadline tracking with visual indicators
- ✅ **GTD Inbox System**: Capture → Clarify → Next Actions workflow
- ✅ **Custom Date Picker**: Russian calendar with quick date selection
- ✅ **GRIT Score**: Real-time calculation (4-component algorithm)
- ✅ **Deadline Tracking**: Urgent/overdue visual warnings with countdown
- ✅ **Telegram User Binding**: User-specific data storage by username
- ✅ **Full Russian Localization**: All terms translated to Russian
- ✅ **Enhanced Mobile UX**: Fixed horizontal stability, clean dark theme

### 1) Technology Stack
- **Frontend**: Vanilla JavaScript ES6+, HTML5, CSS3 with Glassmorphism design system
- **Design**: iOS/Material You inspired with vibrant gradients and blur effects
- **Backend**: Python 3.11+ with `python-telegram-bot` for the bot API
- **Database**: PostgreSQL (production) - no Redis/SQLite/Sheets in production
- **Hosting**: GitHub Pages (gh-pages branch, root folder), Railway/Render/Heroku for backend
- **Telegram Integration**: WebApp SDK for frontend, Bot API for backend

### 2) Architecture
**Frontend Structure:**
- `index.html` - Main WebApp entry point
- `app.js` - Core application logic and Telegram WebApp integration
- `styles.css` - Minimal styling optimized for Telegram's dark theme
- Static files served directly (no build process required)

**Backend Structure:**
- `main.py` - Application entry point and dependency injection
- `handlers/` - Telegram bot command handlers and dialogs
- `storage/` - Data access layer and repositories
- `services/` - Business logic and domain rules
- `config/` - Environment configuration
- `db/` - Database migrations (Alembic) and schemas

### 3) GRIT System Architecture - Research-Based Implementation

**GRIT Definition (Angela Duckworth):** Passion and perseverance for long-term goals

#### **🎯 Goal Hierarchy System:**
- **Main Goal**: Long-term ambitious goal (1-5 years) with target date
- **Quarterly Goals**: 3-month milestones linked to main goal
- **Daily Actions**: Specific measurable activities supporting quarterly goals

#### **📊 GRIT Score Calculation (0-100):**
- **Passion Score (0-25)**: Goal clarity + emotional connection + sacrifice willingness
- **Perseverance Score (0-25)**: Current streak + comebacks after failures
- **Consistency Score (0-25)**: Daily execution rate + progress stability  
- **Growth Score (0-25)**: Learning from obstacles + strategy adaptation

#### **🏆 GRIT Levels:**
- **0-25**: Новичок 🌱
- **26-50**: Развивающийся 💪
- **51-75**: Целеустремленный 🎯  
- **76-90**: Мастер настойчивости 🔥
- **91-100**: GRIT Чемпион 👑

#### **🔥 Motivational System:**
- **Dynamic messaging** based on GRIT score and performance
- **Streak celebrations** with comeback support
- **Journey timeline** showing progress milestones
- **Analytics insights** with personalized recommendations

#### **📱 User Experience Flow:**
1. **Onboarding**: Set main goal + define daily actions
2. **Daily Planning**: Set targets for primary/secondary actions + focus time
3. **Progress Tracking**: Real-time updates with GRIT Score calculation
4. **Analytics Review**: Weekly insights and recommendations
5. **Goal Evolution**: Quarterly goal management and main goal refinement

### 4) Code Quality Standards
**Frontend:**
- Modern ES6+ JavaScript with comprehensive error handling and offline support
- Glassmorphism design system with CSS custom properties
- Mobile-first responsive design optimized for Telegram WebApp
- Comprehensive form validation and loading states
- Clear function names, avoid deep nesting, early returns

**Design System:**
- Vibrant gradient backgrounds (purple-blue primary)
- Glass morphism effects with backdrop-filter blur
- Premium color palette (coral, mint, gold accents)
- Smooth animations with cubic-bezier easing
- Touch-optimized component sizing (60px+ buttons)

**Backend:**
- PEP 8 compliance, type hints everywhere (Python typing)
- Code style: `black` + `flake8` + `isort`
- Static analysis: `mypy` in strict mode where possible
- Clear naming conventions, no abbreviations
- Configuration via environment variables only, no secrets in code

### 5) Database Design
- **Schema**: `users`, `daily_logs`, `weekly_snapshots` (see TRD.md for details)
- **Migrations**: Alembic only, no manual schema changes in production
- **Constraints**: Unique keys, foreign keys, indexes on frequently queried columns
- **Transactions**: Wrap all mutating operations in transactions
- **Performance**: Avoid N+1 queries, use aggregating queries where appropriate

### 6) Telegram WebApp Integration
- **Frontend**: Use Telegram WebApp SDK (`window.Telegram.WebApp`)
- **Authentication**: Pass `initData` in `X-Telegram-Init-Data` header
- **UI/UX**: Follow Telegram's design guidelines, support dark theme
- **Responsive**: Mobile-first design, touch-friendly interfaces

### 7) Security & Data Protection
- **Secrets**: Environment variables only, no hardcoded tokens
- **Data Validation**: Strict input validation and sanitization
- **API Security**: Validate Telegram initData, rate limiting
- **Privacy**: Minimal personal data collection

### 8) Testing Strategy
- **Frontend**: Manual testing in Telegram WebApp environment
- **Backend**: Unit tests for business logic, integration tests for API endpoints
- **E2E**: Test full flow from WebApp to backend
- **Coverage**: Target 80%+ for critical business logic

### 9) Deployment - CRITICAL SETUP NOTES
- **Frontend**: GitHub Pages (main branch, /miniapp folder) 
- **Backend**: PaaS hosting (Railway, Render, Heroku)
- **Environment**: Staging and production environments
- **Monitoring**: Error tracking, performance monitoring

**🚨 DEPLOYMENT GOTCHAS (ПОЛНОСТЬЮ РЕШЕНО):**
- **GitHub Pages**: gh-pages branch ROOT folder ✅
- **ЕДИНСТВЕННЫЙ URL**: https://jimbokl.github.io/grit-miniapp/ ✅
- **🔥 ГЛАВНАЯ ПРОБЛЕМА**: GITHUB_TOKEN commits НЕ ТРИГГЕРЯТ Pages build ✅
- **РЕШЕНИЕ**: Создан GitHub Actions workflow (.github/workflows/pages.yml) ✅
- **CSS caching**: use embedded styles for major changes
- **УРОК**: Всегда читать документацию про ограничения GitHub_TOKEN!

### 10) Development Workflow
- **Branching**: Feature branches, PR reviews required
- **Code Style**: Automated formatting and linting
- **Documentation**: Keep README and technical docs up to date
- **Versioning**: Semantic versioning for releases

### 11) Performance Guidelines
- **Frontend**: Minimize bundle size, optimize assets, lazy loading
- **Backend**: Database query optimization, caching where appropriate
- **Network**: Minimize API calls, batch operations when possible
- **Mobile**: Touch targets, smooth animations, fast load times

### 12) References & Documentation
- **logic.md**: Complete GRIT bot architecture and implementation plan
- **TRD.md**: Technical Requirements Document  
- **TODO.md**: Development roadmap and feature backlog
- **Telegram WebApp**: https://core.telegram.org/bots/webapps
- **Bot API**: https://core.telegram.org/bots/api
- **GRIT Research**: Angela Duckworth's "Grit: Passion and Perseverance for Long-Term Goals"

### 13) Production Deployment Info [Current: 5be96eb]
- **Live URL**: https://jimbokl.github.io/grit-miniapp/
- **GitHub Repository**: https://github.com/jimbokl/grit-miniapp
- **Deployment Method**: GitHub Actions workflow (.github/workflows/pages.yml)
- **Branch**: gh-pages (root folder)
- **Status**: Production ready with full GRIT+GTD implementation
- **Version**: v3.0 ГРИТ+Система (Super Productivity System)
- **Last Update**: 25.08.2025

### 14) Key Features Summary [v3.0]
- 🔥 **GRIT+GTD Integration**: Passion/Perseverance + Getting Things Done methodology
- 🎯 **Goal Hierarchy**: Main → Quarterly (with deadlines) → Daily actions
- 📅 **Deadline Tracking**: Visual countdown, urgent/overdue indicators
- 📥 **GTD Workflow**: Capture → Clarify → Organize → Review → Engage
- 📊 **GRIT Scoring**: 4-component algorithm (Passion+Perseverance+Consistency+Growth)
- 🔥 **Streak Tracking**: Series counting with comeback support
- 📈 **Analytics**: Comprehensive insights with personalized recommendations
- 👤 **Telegram Integration**: User-specific data storage by username
- 🇷🇺 **Full Russian Localization**: Native language interface
- 🎨 **Dark Glassmorphism**: Readable theme with blur effects
- 📱 **Mobile Optimized**: Fixed positioning, touch-friendly interface
- 💾 **Data Persistence**: User-specific localStorage with migration
- 🔧 **Production Quality**: Complete error handling, ESC key support, validation


