# Команды для запуска проекта 

## Запуск Бэкенда (Python/FastAPI)
Открой первый терминал в VS Code.
1. Перейди в папку бэкенда:
   `cd backend`
2. Активируй виртуальное окружение (появится `(venv)`):
   `venv\Scripts\activate`
    если запрет политики   `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
    
3. Запусти сервер:
   `python -m uvicorn main:app --reload`
   *(Сервер будет доступен по адресу: http://127.0.0.1:8000)*

## Запуск Фронтенда (React/Vite)
Открой второй терминал в VS Code (нажми на плюсик).
1. Перейди в папку фронтенда:
   `cd frontend`
2. Запусти сервер разработки:
   `npm run dev`
   *(Приложение будет доступно по адресу: http://localhost:5173)*

## Как посмотреть "как на телефоне" (Эмулятор)
1. Открой в браузере (например, Chrome) ссылку: `http://localhost:5173`
2. Нажми `F12`, чтобы открыть инструменты разработчика.
3. Нажми на иконку "Toggle device toolbar" (или `Ctrl+Shift+M`).
4. Выбери в выпадающем списке любой телефон (например, iPhone 12).
5. Теперь ты видишь приложение так, как его увидит пациент в мессенджере.

## Git (Сохранение изменений)
- Сохранить изменения: `git add .` -> `git commit -m "что сделал"` -> `git push`
- Вытянуть: `git pull origin main` ``

### Некорректная кодировка кириллицы в консоли при тестах
```powershell
[Console]::OutputEncoding = [Text.Encoding]::UTF8
```

## Запуск тестов

```bash
# все тесты
cd backend
python -m pytest -v

# только слой Red Flags
python -m pytest tests/test_red_flags.py -v

# с выводом отладочной информации
python -m pytest -vvs
```


## Деплой frontend на GitHub Pages

```bash
cd frontend
npm run build
npx gh-pages -d dist
```
## Структура проекта

```
   medved/
   ├── backend/
   │   ├── main.py               # Приложение FastAPI, эндпоинты
   │   ├── core/
   │   │   ├── safety.py         # Слой 1: Red Flags
   │   │   ├── router.py         # Маршрутизация пациента
   │   │   ├── nlp.py            # Слой 2: резервный NLP
   │   │   ├── llm_client.py     # Слой 3: клиент GigaChat
   │   │   └── schemas.py        # Модели Pydantic
   │   ├── rules/
   │   │   ├── red_flags.yaml    # Правила критических состояний
   │   │   └── triage_rules.yaml # Правила маршрутизации
   │   └── tests/                # Набор pytest-тестов (89 шт.)
   │
   ├── frontend/
   │   ├── src/
   │   │   ├── App.tsx           # Корневой компонент, машина состояний экранов
   │   │   ├── api/
   │   │   │   └── mockBackend.ts# HTTP-клиент для обращения к backend
   │   │   ├── components/       # Экраны опроса и результаты
   │   │   └── types.ts          # Типы TypeScript
   │   ├── dist/                 # Сборка для деплоя
   │   ├── .env                  # Переменные режима разработки
   │   └── .env.production       # Переменные режима сборки
   │
   ├── README.md                 # Основное описание проекта
   ├── README_START_SERVERS.md   # Инструкция по запуску (данный файл)
   ├── ARCHITECTURE.md           # Описание архитектуры
   └── PRIVACY.md                # Политика обработки персональных данных
```