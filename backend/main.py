import os
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    import google.generativeai as genai  # type: ignore
except Exception:  # pragma: no cover
    genai = None


class GeneratePlanRequest(BaseModel):
    task: str = Field(..., description="Главная задача пользователя, напр. 'Видео каждый день'")
    frequency: str = Field(..., description="Частота: daily|weekdays|custom")
    time_minutes: int = Field(..., ge=5, le=600, description="Время в день в минутах")
    constraints: Optional[str] = Field(None, description="Ограничения/условия")


class GeneratePlanResponse(BaseModel):
    plan_text: str


app = FastAPI(title="Grit Backend API")

# Разрешаем запросы с GitHub Pages и локальной разработки
origins = [
    "https://jimbokl.github.io",
    "https://jimbokl.github.io/",
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _build_prompt(req: GeneratePlanRequest) -> str:
    freq_map = {
        "daily": "ежедневно",
        "weekdays": "по будням (пн–пт)",
        "custom": "по выбранным дням недели",
    }
    freq = freq_map.get(req.frequency, req.frequency)
    constraints_text = f"Ограничения: {req.constraints}." if req.constraints else ""
    return (
        "Ты — коуч по продуктивности. Построй подробный, практичный план удержания GRIT "
        "(ритма ключевых действий) под задачу пользователя. Форматируй краткими пунктами.\n\n"
        f"Задача: {req.task}.\n"
        f"Частота: {freq}. Время в день: {req.time_minutes} минут. {constraints_text}\n\n"
        "Структура ответа:\n"
        "1) Ежедневный ритуал (1–3 шага, 3–5 минут).\n"
        "2) Мини-план на день (3–5 конкретных действий).\n"
        "3) Фокус-блок(и) (помесячно растить сложность).\n"
        "4) Анти-срыв (что делать в плохой день: минимальная версия).\n"
        "5) Маркеры прогресса на неделю (2–4 пункта).\n"
        "Коротко, без воды, на 'ты'."
    )


def _generate_with_gemini(req: GeneratePlanRequest) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return (
            "[Нет ключа GEMINI_API_KEY] Установите ключ и перезапустите сервис. "
            "Временно: сформулируйте 3–5 конкретных шагов на день, один анти-срыв и 2–3 маркера недели."
        )
    if genai is None:
        return (
            "[Библиотека google-generativeai не установлена] Добавьте её в зависимости и перезапустите сервис."
        )
    genai.configure(api_key=api_key)
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    model = genai.GenerativeModel(model_name)
    prompt = _build_prompt(req)
    response = model.generate_content(prompt)
    text = getattr(response, "text", None) or ""
    if not text:
        # попытка собрать из частей
        parts = []
        for cand in getattr(response, "candidates", []) or []:
            for part in getattr(getattr(cand, "content", None), "parts", []) or []:
                parts.append(str(getattr(part, "text", "")))
        text = "\n".join([p for p in parts if p])
    return text.strip() or "Не удалось получить ответ от модели. Попробуйте ещё раз."


@app.post("/api/plan/generate", response_model=GeneratePlanResponse)
def generate_plan(req: GeneratePlanRequest) -> GeneratePlanResponse:
    try:
        plan_text = _generate_with_gemini(req)
        return GeneratePlanResponse(plan_text=plan_text)
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"generation_error: {exc}")


@app.get("/healthz")
def healthz():
    return {"ok": True}


