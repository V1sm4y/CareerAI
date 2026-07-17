# CareerForge AI 🚀

> **AI-powered job application tracker** — Track every opportunity, analyze your resume, and land your dream job.

![Tech Stack](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=flat&logo=tailwindcss)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

---

## Features

| Feature | Description |
|---|---|
| 🔐 **JWT Auth** | Register, login, and protected routes |
| 📋 **Application Tracker** | Create, edit, delete job applications with 6 status stages |
| 📊 **Dashboard** | Live statistics and recent applications view |
| 📄 **Resume Upload** | PDF upload with text extraction via pdfminer.six |
| 🤖 **AI Resume Analysis** | Score (0–100), grade, strengths & recommendations |
| 🔍 **Security Logging** | Structured JSON logs for every event |
| 📡 **Event Pipeline** | SOC-ready security event stream (NDJSON) |
| 🐳 **Docker** | Full containerised deployment |

---

## Project Structure

```
careerforge-ai/
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── main.py             # App entry point + lifespan
│   │   ├── config.py           # Pydantic settings
│   │   ├── database.py         # SQLAlchemy + SQLite
│   │   ├── models/             # ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── routers/            # API route handlers
│   │   ├── services/           # Business logic (auth, PDF parse, AI)
│   │   ├── security/           # JWT + auth dependencies
│   │   ├── logging/            # Structured logger + event pipeline
│   │   └── middleware.py       # Request logging
│   ├── uploads/                # Uploaded resumes (gitignored)
│   ├── logs/                   # Structured logs (gitignored)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Route-level pages
│   │   ├── services/api.ts     # Axios API client
│   │   ├── context/            # Auth React context
│   │   └── types/              # TypeScript type definitions
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Quick Start

### Option 1 — Docker (Recommended)

```bash
# 1. Clone and enter the project
cd careerforge-ai

# 2. Copy environment variables
cp backend/.env.example backend/.env

# 3. (Optional) Set a strong SECRET_KEY in backend/.env

# 4. Build and start all services
docker compose up --build

# App available at:
#   Frontend: http://localhost:3000
#   Backend API: http://localhost:8000
#   API Docs: http://localhost:8000/docs
```

### Option 2 — Local Development

#### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env

# Start the development server
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server (proxies /api to :8000)
npm run dev
```

Frontend runs at **http://localhost:3000** and proxies all `/api/*` calls to the backend.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | `dev-secret-key...` | JWT signing key — **change in production** |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Token lifetime (24 hours) |
| `DATABASE_URL` | `sqlite:///./careerforge.db` | SQLAlchemy connection string |
| `UPLOAD_DIR` | `uploads` | Directory for uploaded PDFs |
| `LOG_DIR` | `logs` | Directory for log files |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed CORS origins |

---

## API Reference

Base URL: `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create new account |
| `POST` | `/api/auth/login` | Login → returns JWT |
| `GET` | `/api/auth/me` | Get current user profile |

### Applications (🔒 Protected)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/applications/dashboard` | Dashboard statistics |
| `GET` | `/api/applications/` | List all applications |
| `POST` | `/api/applications/` | Create application |
| `PUT` | `/api/applications/{id}` | Update application |
| `DELETE` | `/api/applications/{id}` | Delete application |

### Resumes (🔒 Protected)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/resumes/upload` | Upload PDF resume |
| `GET` | `/api/resumes/` | List all resumes |
| `GET` | `/api/resumes/{id}` | Get single resume |
| `POST` | `/api/resumes/{id}/analyze` | Run AI analysis |

---

## Application Statuses

```
Applied → OA Scheduled → Interview → Offer → Accepted
                       ↘ Rejected
```

---

## Logging & Monitoring

### Application Logs
Location: `backend/logs/app.log`  
Format: Newline-delimited JSON

```json
{
  "timestamp": "2026-07-16T09:00:00.000Z",
  "level": "INFO",
  "event_type": "login_success",
  "message": "User logged in: user@example.com",
  "user": "user@example.com",
  "ip": "127.0.0.1",
  "severity": "info",
  "extra": {}
}
```

### Security Events
Location: `backend/logs/security_events.json`  
Format: Newline-delimited JSON (NDJSON) — SOC/ESP32 ready

```json
{"timestamp": "...", "event_type": "login_failed", "severity": "medium", "user": "attacker@x.com", "ip": "1.2.3.4", "detail": {"reason": "invalid_credentials"}}
{"timestamp": "...", "event_type": "resume_uploaded", "severity": "info", "user": "jane@example.com", "ip": "127.0.0.1", "detail": {"filename": "resume.pdf"}}
```

### Event Types Tracked
- `login_success` / `login_failed`
- `registration_attempt` / `registration_success` / `registration_failed`
- `resume_uploaded` / `resume_analyzed`
- `application_created` / `application_updated` / `application_deleted`
- `api_request` (every HTTP request)
- `app_startup` / `app_shutdown`

---

## Pluggable AI Architecture

The AI analyzer is isolated in `backend/app/services/ai_analyzer.py`.  
To replace the heuristic scorer with a real AI model:

```python
# Current (heuristic)
def analyze_resume(text: str) -> dict: ...

# Replace with OpenAI:
import openai

def analyze_resume(text: str) -> dict:
    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": f"Analyze this resume:\n{text}"}]
    )
    # Parse response into the same dict shape
    return {"score": ..., "grade": ..., "recommendations": [...], ...}
```

The dict shape (`score`, `grade`, `recommendations`, `strengths`, `word_count`, `sections_found`) must remain unchanged for the frontend to work without modification.

---

## Production Checklist

- [ ] Change `SECRET_KEY` to a 32+ character random string
- [ ] Set `CORS_ORIGINS` to your production domain(s)
- [ ] Replace SQLite with PostgreSQL (`DATABASE_URL=postgresql://...`)
- [ ] Enable HTTPS on your reverse proxy (nginx/Caddy)
- [ ] Set up log rotation for `logs/`
- [ ] Connect `security_events.json` to your SIEM/SOC dashboard
- [ ] Replace AI placeholder with production model (OpenAI, Gemini, etc.)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript 5, Tailwind CSS 3, Vite |
| Backend | FastAPI, Python 3.11, SQLAlchemy 2, Pydantic v2 |
| Database | SQLite (dev) → PostgreSQL (prod) |
| Auth | JWT via `python-jose`, bcrypt via `passlib` |
| PDF Parse | pdfminer.six |
| Containers | Docker, docker-compose |

---

## License

MIT © CareerForge AI
