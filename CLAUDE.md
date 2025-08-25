## CLAUDE: Personal Goal Tracker Development Guidelines

This document defines the development standards for the Personal Goal Tracker project (Telegram WebApp). This is a fully personalized goal tracking system with glassmorphism design that adapts to any user's objectives and terminology.

## ⚠️ DEPLOYMENT LESSONS LEARNED (из личного опыта):
- **GitHub Pages для этого проекта**: **gh-pages branch, ROOT папка** ✅
- **ЕДИНСТВЕННЫЙ URL**: https://jimbokl.github.io/grit-miniapp/ 
- **НЕ создавать лишние URL** - один проект = один URL
- **GitHub Pages кеширование АГРЕССИВНОЕ** - встраивать стили для больших изменений
- **Всегда проверять deployment target** перед изменениями

**🤦‍♂️ Ошибки которые я сделал:**
- Путался между main и gh-pages ветками
- Обновлял неправильные папки (miniapp вместо root)  
- Создал лишние файлы и URL
- Не проверил deployment settings изначально
- Был "еблан" с GitHub Pages настройками 😅

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

### 3) Core Business Rules - Complete Personalization System
- **Universal Goal Structure**: Any goal → 3 measurable daily actions
  - **Primary Actions**: Core activities that directly achieve the goal (user-defined)
  - **Supporting Actions**: Auxiliary activities that help the goal (user-defined) 
  - **Focus Time**: Deep work time in minutes (always in minutes, but user defines type)

- **Full Personalization**: 
  - User sets their main goal (e.g., "Launch a startup", "Learn French", "Get fit")
  - User defines what their "primary actions" are (e.g., "client calls", "vocabulary practice", "workouts")
  - User defines what their "supporting actions" are (e.g., "investor meetings", "conversation practice", "meal prep")
  - User selects focus type (study/development/planning/practice/work)

- **Dynamic Interface**: All UI elements change based on user's terminology
- **Perfect Day**: Achievement of all three personalized daily goals
- **Data Flow**: Initial setup → Morning planning → Day tracking → Evening review

**Example Configurations:**
- **Entrepreneur**: Goal: "Launch SaaS" | Primary: "Customer calls" | Supporting: "Investor meetings" | Focus: "Development"
- **Student**: Goal: "Pass certification" | Primary: "Practice problems" | Supporting: "Study sessions" | Focus: "Learning"
- **Athlete**: Goal: "Run marathon" | Primary: "Training runs" | Supporting: "Strength workouts" | Focus: "Planning"

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

**🚨 DEPLOYMENT GOTCHAS (исправлено):**
- GitHub Pages for this project deploys from **gh-pages branch ROOT folder** ✅
- ЕДИНСТВЕННЫЙ правильный URL: https://jimbokl.github.io/grit-miniapp/
- CSS caching is aggressive - use embedded styles for major design changes  
- Always test deployment target before major updates
- Обновлять файлы в ROOT папке gh-pages ветки, НЕ в подпапках

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

### 12) References
- **TRD**: `TRD.md` - Technical Requirements Document
- **Telegram WebApp**: https://core.telegram.org/bots/webapps
- **Bot API**: https://core.telegram.org/bots/api


