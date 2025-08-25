## CLAUDE: Grit Mini App Development Guidelines

This document defines the development standards for the Grit Mini App project (Telegram WebApp). Follow these principles for all development work.

### 1) Technology Stack
- **Frontend**: Vanilla JavaScript ES6+, HTML5, CSS3 (no frameworks - keep it lightweight)
- **Backend**: Python 3.11+ with `python-telegram-bot` for the bot API
- **Database**: PostgreSQL (production) - no Redis/SQLite/Sheets in production
- **Hosting**: Railway/Render/Heroku for backend, static hosting for frontend
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

### 3) Core Business Rules
- **Daily Goals**: Three core metrics - `касания` (touches), `демо` (demos), `фокус` (focus minutes)
- **Perfect Day**: Achievement of all three daily goals
- **Minimum Day**: Manual flag to maintain streak without breaking chain
- **User Timezone**: Per-user timezone support, week runs Monday-Sunday
- **Data Flow**: Morning planning → Day tracking → Evening review

### 4) Code Quality Standards
**Frontend:**
- Modern ES6+ JavaScript, no transpilation required
- Semantic HTML5 with proper accessibility attributes
- CSS custom properties for theming, mobile-first responsive design
- Clear function names, avoid deep nesting, early returns

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

### 9) Deployment
- **Frontend**: Static hosting (Netlify, Vercel, GitHub Pages)
- **Backend**: PaaS hosting (Railway, Render, Heroku)
- **Environment**: Staging and production environments
- **Monitoring**: Error tracking, performance monitoring

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


