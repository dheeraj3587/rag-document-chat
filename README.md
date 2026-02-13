<div align="center">

# 📄 RAG Document Chat

### Chat with your PDFs, audio, and video files

*Upload files, ask questions, and get grounded answers with citations and timestamps.*

[![Star on GitHub](https://img.shields.io/github/stars/dheeraj3587/rag-document-chat?style=social)](https://github.com/dheeraj3587/rag-document-chat)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-05998b)](https://fastapi.tiangolo.com/)

[Report Bug](https://github.com/dheeraj3587/rag-document-chat/issues) • [Request Feature](https://github.com/dheeraj3587/rag-document-chat/issues)

</div>

---

## 📸 Preview

![RAG Document Chat](public/home-page.png)

---

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** FastAPI (async), PostgreSQL, Celery
- **Authentication:** Clerk JWT
- **AI/RAG:** LangChain, Google Generative AI (Gemini), FAISS
- **Storage:** MinIO (S3-compatible)
- **UI Components:** shadcn UI, Tiptap (rich text editor)
- **Styling:** Tailwind CSS with custom animations

---

### Document Embedding Success

![Document Embedding Proof](./public/embedding.png)

*Screenshot showing successful document processing and embedding generation*

---

## Known Limitations

### Token Limit Constraints

- **Large File Processing**: Due to API token limits, very large PDF files may not be fully processed or embedded
- **Incomplete Embeddings**: Documents exceeding token limits will only have partial content embedded, potentially missing important information
- **Processing Timeouts**: Extremely large documents may experience timeout errors during the embedding process

### Other Limitations

- **File Format Support**: PDFs, audio (MP3/WAV), and video (MP4/WebM)
- **Context Window**: Answers are based on limited context chunks, which may not capture the full document scope
- **Processing Time**: Large documents require significant time for chunking and embedding generation

---


##  Usage

1. **Sign In**: Create an account or sign in using Clerk authentication
2. **Upload Document**: Upload a PDF, audio, or video file
3. **Wait for Processing**: The system extracts text/transcripts, chunks, and embeds content
4. **Ask Questions**: Type your question in the chat interface
5. **Get Answers**: Receive grounded answers with sources and timestamps

---

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm (for local frontend dev)
- A Clerk account ([sign up here](https://clerk.com/))

---

## Project Structure

```
kagaz/
├── app/                    # Next.js app directory
│   ├── (routes)/          # Application routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── backend/              # FastAPI backend
│   ├── routers/          # API routes
│   ├── services/         # RAG pipeline + processing
│   ├── models/           # SQLAlchemy models
│   └── tasks/            # Celery background tasks
├── lib/                  # Utility functions
├── public/               # Static assets
└── configs/              # Configuration files
```

---

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/dheeraj3587/rag-document-chat.git
   cd rag-document-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create `backend/.env`:
   ```env
    DATABASE_URL=postgresql+asyncpg://kagaz:kagaz_password@db:5432/kagaz
    REDIS_URL=redis://redis:6379/0
    CELERY_BROKER_URL=redis://redis:6379/0
    CELERY_RESULT_BACKEND=redis://redis:6379/1
    MINIO_ENDPOINT=minio:9000
    MINIO_ACCESS_KEY=minioadmin
    MINIO_SECRET_KEY=minioadmin
    MINIO_BUCKET=kagaz-files
    MINIO_USE_SSL=false
    GOOGLE_API_KEY=your-google-api-key
    OPENAI_API_KEY=your-openai-api-key
    CLERK_JWKS_URL=https://your-clerk-domain.clerk.accounts.dev/.well-known/jwks.json
    CLERK_ISSUER=https://your-clerk-domain.clerk.accounts.dev
   ```

4. **Run the development server**
   ```bash
   docker-compose up --build
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000`

---

## Authentication

Kagaz supports two authentication methods:

### Clerk JWT (default)

All API requests from the frontend include a Clerk-issued JWT in the `Authorization` header:

```
Authorization: Bearer <clerk-jwt-token>
```

### API Key (machine-to-machine)

For programmatic access, supply an API key via the `X-API-Key` header:

```
X-API-Key: your-api-key
```

Configure allowed keys in `backend/.env`:

```env
# Comma-separated or JSON array
API_KEYS=key1,key2
# or
API_KEYS=["key1","key2"]
```

Invalid or missing credentials return **401 Unauthorized**.

---

## Rate Limiting

Every endpoint is rate-limited per authenticated identity (email or API key fingerprint) using a fixed-window algorithm backed by Redis (with in-memory fallback).

Default limits (requests per minute):

| Endpoint group | Env var | Default |
|---|---|---|
| General | `RATE_LIMIT_DEFAULT_PER_MINUTE` | 120 |
| File upload | `RATE_LIMIT_UPLOAD_PER_MINUTE` | 20 |
| Chat (ask) | `RATE_LIMIT_CHAT_PER_MINUTE` | 30 |
| Summarize | `RATE_LIMIT_SUMMARIZE_PER_MINUTE` | 10 |
| Search | `RATE_LIMIT_SEARCH_PER_MINUTE` | 60 |
| Users | `RATE_LIMIT_USERS_PER_MINUTE` | 60 |
| Notes | `RATE_LIMIT_NOTES_PER_MINUTE` | 120 |

When the limit is exceeded the API returns **429 Too Many Requests** with `Retry-After`, `X-RateLimit-Limit`, and `X-RateLimit-Remaining` headers.

---

## Response Caching

AI-generated responses are cached in Redis to reduce latency and API costs.

| Setting | Default | Description |
|---|---|---|
| `CACHE_ENABLED` | `true` | Toggle caching on/off |
| `CACHE_TTL_CHAT_SECONDS` | `1800` | TTL for chat answers (30 min) |
| `CACHE_TTL_SUMMARY_SECONDS` | `1800` | TTL for summaries (30 min) |
| `CACHE_TTL_SEARCH_SECONDS` | `600` | TTL for search results (10 min) |

Identical requests within the TTL window are served from cache. If Redis is unavailable, an in-memory fallback is used automatically.

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=postgresql+asyncpg://kagaz:kagaz@db:5432/kagaz

# MinIO / S3
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=kagaz-files
MINIO_USE_SSL=false

# AI
GOOGLE_API_KEY=your-google-api-key
OPENAI_API_KEY=your-openai-api-key

# Redis
REDIS_URL=redis://redis:6379/0

# Clerk Auth
CLERK_JWKS_URL=https://your-clerk-domain.clerk.accounts.dev/.well-known/jwks.json
CLERK_ISSUER=https://your-clerk-domain.clerk.accounts.dev

# API key auth (optional)
API_KEYS=

# Caching
CACHE_ENABLED=true
CACHE_TTL_CHAT_SECONDS=1800
CACHE_TTL_SUMMARY_SECONDS=1800
CACHE_TTL_SEARCH_SECONDS=600

# Rate limiting (per minute)
RATE_LIMIT_DEFAULT_PER_MINUTE=120
RATE_LIMIT_UPLOAD_PER_MINUTE=20
RATE_LIMIT_CHAT_PER_MINUTE=30
RATE_LIMIT_SUMMARIZE_PER_MINUTE=10
RATE_LIMIT_SEARCH_PER_MINUTE=60
RATE_LIMIT_USERS_PER_MINUTE=60
RATE_LIMIT_NOTES_PER_MINUTE=120

# CORS
CORS_ORIGINS=["http://localhost:3000"]

# FAISS
FAISS_INDEX_PATH=./faiss_indices
```

### Docker Compose

All backend env vars listed above can also be set in the `environment` block of the `backend` and `worker` services in `docker-compose.yml`.

---

## Author

**Dheeraj Joshi**

- GitHub: [@dheeraj3587](https://github.com/dheeraj3587)
- Project Link: [https://github.com/dheeraj3587/rag-document-chat](https://github.com/dheeraj3587/rag-document-chat)

---

## ⭐ Star History

If you find this project useful, please consider giving it a star!

[![Star History Chart](https://api.star-history.com/svg?repos=dheeraj3587/rag-document-chat&type=Date)](https://star-history.com/#dheeraj3587/rag-document-chat&Date)

---

<div align="center">

**[⬆ Back to Top](#-rag-document-chat)**

Made with ❤️ by [Dheeraj Joshi](https://github.com/dheeraj3587)

</div>
