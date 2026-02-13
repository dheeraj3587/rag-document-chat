# Kagaz — Final Architecture & Implementation Plan

## Overview

Kagaz is an AI-powered document Q&A application. Users upload PDFs, audio, or video files and interact with them via a rich-text editor with AI-powered RAG (Retrieval-Augmented Generation). The backend has been migrated from Convex (TypeScript BaaS) to a Python FastAPI server to meet SDE-1 assignment requirements.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)                  │
│  React 19 · Tiptap Editor · Clerk Auth · Tailwind CSS    │
│  shadcn/ui · MediaPlayer · PdfViewer · REST API Client   │
└────────────────────────┬─────────────────────────────────┘
                         │  HTTP / SSE
┌────────────────────────▼─────────────────────────────────┐
│                  FastAPI Backend (Python)                  │
│  Routers: files, chat, search, users, notes               │
│  Auth: Clerk JWT verification + API key auth            │\n│  Middleware: Rate limiting, Redis caching                │
│  Services: PDF, Transcription, Embedding, AI, Storage     │
├───────────┬──────────┬──────────┬────────────────────────┤
│ PostgreSQL│  MinIO   │  FAISS   │   Celery + Redis       │
│ (Database)│ (Storage)│ (Vectors)│   (Background Tasks)   │
└───────────┴──────────┴──────────┴────────────────────────┘
```

---

## Tech Stack

### Frontend (Kept)
| Technology | Purpose |
|---|---|
| Next.js 16 + React 19 | App framework |
| Tiptap | Rich text editor with AI toolbar |
| Clerk | Authentication (sign-in/up, JWT) |
| Tailwind CSS + shadcn/ui | Styling & components |
| react-resizable-panels | Workspace split layout |

### Backend (New — Python)
| Technology | Purpose |
|---|---|
| FastAPI | REST API framework |
| SQLAlchemy (async) + asyncpg | ORM + PostgreSQL driver |
| PostgreSQL | Relational database |
| MinIO | S3-compatible object storage |
| FAISS (faiss-cpu) | Local vector similarity search |
| Celery + Redis | Background task processing + caching |
| LangChain + Google Generative AI | RAG pipeline (embeddings + Gemini LLM) |
| OpenAI Whisper API | Audio/video transcription |
| python-jose | Clerk JWT verification |

### Infrastructure
| Technology | Purpose |
|---|---|
| Docker + docker-compose | Containerization (6 services) |
| GitHub Actions | CI/CD pipeline |
| pytest + pytest-cov | Testing with 95%+ coverage |

---

## Backend Structure

```
backend/
├── main.py                      # FastAPI app, lifespan, CORS, routers
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variable template
├── Dockerfile                   # Backend container
├── Dockerfile.worker            # Celery worker container
├── core/
│   ├── config.py                # Pydantic Settings (env vars)
│   ├── security.py              # Clerk JWT + API key auth
│   ├── cache.py                 # Redis cache with in-memory fallback
│   └── rate_limit.py            # Per-endpoint rate limiter
├── models/
│   ├── database.py              # Async engine, session, get_db
│   ├── user.py                  # User model
│   ├── file.py                  # File model (pdf/audio/video)
│   ├── note.py                  # Note model
│   └── timestamp.py             # MediaTimestamp model
├── services/
│   ├── storage_service.py       # MinIO S3 operations
│   ├── pdf_service.py           # PyPDFLoader + text splitting
│   ├── transcription_service.py # Whisper API transcription
│   ├── timestamp_service.py     # Gemini topic extraction
│   ├── embedding_service.py     # Google embeddings + FAISS
│   └── ai_service.py            # Gemini chat/summarize streaming
├── routers/
│   ├── files.py                 # POST /upload, GET /, GET /{id}, DELETE
│   ├── chat.py                  # POST /ask (SSE), POST /summarize
│   ├── search.py                # POST / (vector search)
│   ├── users.py                 # POST /, GET /me, PATCH /{email}
│   └── notes.py                 # GET /{fileId}, PUT /{fileId}, DELETE
├── vector_store/
│   └── faiss_index.py           # Per-file FAISS indices on disk
├── tasks/
│   └── celery_worker.py         # process_pdf, process_media tasks
└── tests/
    ├── conftest.py              # Fixtures, mocks, test DB
    ├── test_files.py            # 11 tests
    ├── test_notes.py            # 8 tests
    ├── test_users.py            # 8 tests
    ├── test_chat.py             # 8 tests
    ├── test_search.py           # 8 tests (incl. cache + rate limit)
    ├── test_transcription.py    # 6 tests
    ├── test_faiss.py            # 10 tests
    ├── test_health.py           # 2 tests
    ├── test_security.py         # 7 tests (incl. API key auth)
    └── test_storage.py          # 8 tests
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/files/upload` | Upload file (multipart: pdf/audio/video) |
| GET | `/api/files?user_email=` | List user's files |
| GET | `/api/files/{file_id}` | Get file metadata + presigned URL |
| DELETE | `/api/files/{file_id}` | Delete file + storage + index |
| POST | `/api/chat/ask` | RAG streaming answer (SSE) |
| POST | `/api/chat/summarize` | Streaming summarization (SSE) |
| POST | `/api/search` | Vector similarity search |
| POST | `/api/users` | Create/sync user |
| GET | `/api/users/me?email=` | Get current user |
| PATCH | `/api/users/{email}` | Update user (upgrade, name) |
| GET | `/api/notes/{file_id}` | Get notes for a file |
| PUT | `/api/notes/{file_id}` | Upsert notes |
| DELETE | `/api/notes/{file_id}` | Delete notes |

---

## Database Schema

### Users
| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | Auto-increment |
| email | VARCHAR UNIQUE | From Clerk |
| name | VARCHAR | Display name |
| image_url | TEXT | Profile pic |
| upgrade | BOOLEAN | Pro plan flag |

### Files
| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | Auto-increment |
| file_id | UUID UNIQUE | Public identifier |
| file_name | VARCHAR | User-given name |
| file_type | ENUM | pdf, audio, video |
| storage_key | VARCHAR | MinIO object key |
| file_url | TEXT | Presigned URL (generated on read) |
| transcript | TEXT | Whisper transcription |
| duration_seconds | FLOAT | Media duration |
| status | ENUM | processing, ready, failed |
| created_by | VARCHAR | User email |

### Notes
| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | Auto-increment |
| file_id | VARCHAR | References files.file_id |
| note | TEXT | Tiptap HTML content |
| created_by | VARCHAR | User email |

### MediaTimestamps
| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | Auto-increment |
| file_id | VARCHAR | References files.file_id |
| start_time | FLOAT | Seconds |
| end_time | FLOAT | Seconds |
| text | TEXT | Segment text |
| topic | VARCHAR | Topic label |

---

## File Processing Pipeline

### PDF Upload
```
Upload → MinIO → Celery: process_pdf
  → PyPDFLoader → RecursiveCharacterTextSplitter (1000 chars, 200 overlap)
  → GoogleGenerativeAIEmbeddings → FAISS index (per-file)
  → status = "ready"
```

### Audio/Video Upload
```
Upload → MinIO → Celery: process_media
  → Whisper API → transcript + timestamped segments
  → Gemini → topic extraction from segments
  → Group segments → embed → FAISS index
  → Store MediaTimestamps → status = "ready"
```

---

## Frontend Migration (Convex → REST)

All 10 files that imported from `convex/react` or `@/convex/` have been migrated:

| File | Before (Convex) | After (REST) |
|---|---|---|
| `ConvexClientProvider.tsx` | ConvexProviderWithClerk | Simple passthrough |
| `app/page.tsx` | useMutation(api.user.createUser) | fetch POST /api/users |
| `pricing.tsx` | useAction(api.stripe.createPaymentCheckout) | fetch POST /api/users/checkout |
| `dashboard/page.tsx` | useQuery(api.fileStorage.getUserFiles) | useApiQuery(/api/files) |
| `header.tsx` | useMutation + useQuery (user) | createUser() + fetchUser() |
| `sidebar.tsx` | useQuery (files + user) | useApiQuery (files + user) |
| `file-upload.tsx` | generateUploadUrl + InsertFileEntry + embedDocuments | uploadFile() multipart |
| `workspace/[fileId]/page.tsx` | useQuery(api.fileStorage.getFileData) | useApiQuery(/api/files/{id}) + MediaPlayer |
| `textEditor.tsx` | useQuery(api.notes.getNotes) | useApiQuery(/api/notes/{id}) |
| `workspace-header.tsx` | useMutation(api.notes.saveNote) | saveNote() REST |
| `Editor-extension.tsx` | useAction(api.myAction.search) + useMutation | searchDocuments() + saveNote() REST |

**New shared modules:**
- `lib/api-client.ts` — Type-safe REST client functions
- `lib/hooks.ts` — `useApiQuery` and `useApiMutation` React hooks (replace Convex hooks)

---

## Docker Services (docker-compose.yml)

| Service | Image | Port | Purpose |
|---|---|---|---|
| db | postgres:16-alpine | 5432 | PostgreSQL database |
| redis | redis:7-alpine | 6379 | Celery broker + cache |
| minio | minio/minio:latest | 9000, 9001 | Object storage |
| backend | backend/Dockerfile | 8000 | FastAPI API server |
| worker | backend/Dockerfile.worker | — | Celery background worker |
| frontend | Dockerfile | 3000 | Next.js app |

**Start:** `docker-compose up --build`

---

## CI/CD Pipeline (.github/workflows/ci.yml)

### Jobs
1. **backend-test** — Install Python deps, run `pytest --cov` with 95% threshold, upload coverage
2. **frontend-build** — Install Node deps, lint, type-check, build Next.js
3. **docker-build** — Build all 3 Docker images (backend, worker, frontend)

### Triggers
- Push to `main` or `develop`
- Pull requests to `main`

---

## Running Locally

### Backend only:
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Start PostgreSQL, Redis, MinIO (or use docker-compose up db redis minio)
uvicorn main:app --reload --port 8000
# In another terminal:
celery -A tasks.celery_worker.celery_app worker --loglevel=info
```

### Frontend only:
```bash
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

### Full stack (Docker):
```bash
cp backend/.env.example backend/.env  # Fill in API keys
docker-compose up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# MinIO:    http://localhost:9001
```

---

## Tests

```bash
cd backend
pytest --cov=. --cov-report=term-missing -v
```

**Test count:** 81 tests across 11 test files  
**Coverage target:** 95%+  
**All external services mocked** (DB uses SQLite, MinIO/Celery/AI/Whisper all mocked)
