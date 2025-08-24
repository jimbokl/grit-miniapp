# Grit Mini App (Telegram WebApp)

## Локальный превью

Статический фронтенд, достаточно любого статик-сервера. Пример:

```bash
python3 -m http.server 8080 --directory miniapp
```

Откройте `http://localhost:8080/`.

## Интеграция с бэкендом

Приложение делает POST-запросы к эндпоинтам:
- `POST /api/plan/today` — сохранить план на сегодня
- `POST /api/fact/increment` — добавить инкременты по факту

Заголовок `X-Telegram-Init-Data` содержит `initData` из Telegram WebApp SDK.

## Встраивание в Telegram Mini App

В BotFather включить `Web App` и указать URL на `index.html`.

## Разработка

- HTML: `miniapp/index.html`
- JS: `miniapp/app.js`
- CSS: `miniapp/styles.css`

Стили минимальны, оптимизированы под тёмную тему Telegram.
