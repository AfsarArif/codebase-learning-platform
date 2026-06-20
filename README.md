# Codebase Learning Platform

> **Turn any GitHub repository into an interactive learning experience — in minutes.**

A self-hostable platform that connects to GitHub repositories, analyzes the codebase with AI, explains architecture and purpose, and generates a complete interactive learning curriculum: step-by-step lessons, flashcards, quizzes, mini-games, a grounded chat tutor, and simulated technical interviews — all derived from real code, not generic explanations.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-green)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-teal)](https://prisma.io)

## Features

| Feature | Description |
|---------|-------------|
| 🔗 **GitHub Integration** | Paste a public repo URL (no sign-in) or connect GitHub OAuth for private repos |
| 🧠 **Deep Codebase Analysis** | Structural parsing, AST extraction, architecture inference, dependency graphing, semantic summarization |
| 📚 **Progressive Learning Paths** | Multi-track curriculum (Newcomer, Frontend, Backend, Full-Stack, Testing, Deployment, Interview Prep) |
| 💬 **Repository Tutor** | Ask natural-language questions, get answers grounded in actual code with file citations |
| 🃏 **Auto-Generated Flashcards** | File→Purpose, Concept→Location, Term→Definition, Endpoint→Flow |
| 📝 **Quizzes** | Multiple-choice, true/false, ordering, and matching quizzes with explanations |
| 🎮 **Mini-Games** | File-to-purpose matching, request-lifecycle ordering, architecture map reveal, feature locator |
| 🎯 **Interview Mode** | 4 modes (Conceptual, Implementation, Debug, System Design), scored with feedback, tracks mastery by concept |
| 🤖 **Personal Bot** | Remembers your progress, weak areas, and adapts teaching — uses spaced repetition |
| 🔄 **Incremental Sync** | Webhook-driven re-indexing on push, diff-based updates, version-aware content |

## Architecture

```
codebase-learning-platform/
├── apps/
│   ├── web/               # Next.js 14 (App Router) — frontend + API routes
│   │   └── src/app/
│   │       ├── page.tsx               # Landing page
│   │       ├── dashboard/[repoId]/    # Repository dashboard
│   │       ├── repos/                 # Import repo form
│   │       ├── tutor/[repoId]/        # Chat tutor interface
│   │       ├── study/[repoId]/        # Learning path, flashcards, quizzes
│   │       ├── interview/[repoId]/    # Interview session UI
│   │       └── api/                   # REST API (11 endpoints)
│   └── worker/             # Python service — analysis + content generation
│       └── src/
│           ├── ingestion/  # Git clone, file walk, filtering, language detection
│           ├── analysis/   # Architecture inference, entry-point detection
│           ├── embeddings/ # Provider-agnostic embedding (OpenAI, dummy)
│           ├── generation/ # Lessons, flashcards, quizzes, interview questions
│           └── tasks/      # Celery async tasks (indexing, resync)
├── packages/
│   ├── shared/             # Prisma schema (18 models), Zod validators, types
│   ├── github/             # URL parser, GitHub API client
│   ├── prompts/            # 8 LLM prompt templates (provider-agnostic)
│   ├── parsing/            # File filtering, language detection, chunking
│   ├── retrieval/          # Vector search abstraction
│   └── ui/                 # Shared UI utilities (cn helper)
├── infrastructure/docker/  # Dockerfile.web, Dockerfile.worker
├── docker-compose.yml      # PostgreSQL+pgvector, Redis, Web, Worker
├── Makefile                # setup, dev, test, docker-up, db-migrate, etc.
├── .env.example            # All configuration with documentation
└── clp.md                  # Original product specification & implementation plan
```

## Services

| Service | Technology | Port | Description |
|---------|-----------|------|-------------|
| **Web** | Next.js 14 + TypeScript + Tailwind | `3000` | Frontend UI + REST API |
| **Worker** | Python 3.10+ + Celery | — | Background analysis & content generation |
| **Database** | PostgreSQL 16 + pgvector | `5432` | Primary data store + vector search |
| **Cache/Queue** | Redis 7 | `6379` | Celery broker + session cache |

## Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **Python** ≥ 3.10
- **Docker** + Docker Compose (recommended, for PostgreSQL & Redis)
- **GitHub OAuth App** credentials (optional, for private repo access)

### 1. Clone & Configure

```bash
git clone https://github.com/AfsarArif/codebase-learning-platform.git
cd codebase-learning-platform

# Copy environment file and fill in your keys
cp .env.example .env
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL, Redis, and the worker
docker compose up -d

# Or start just the databases
docker compose up -d postgres redis
```

### 3. Setup & Run

```bash
make setup       # Install deps + generate Prisma client + run migrations
make db-seed     # Seed demo data (express, django repos with lessons, flashcards)
make dev         # Start Next.js dev server on http://localhost:3000
```

### 4. Import Your First Repository

Open `http://localhost:3000/repos` and paste any public GitHub URL:
- `https://github.com/expressjs/express`
- `https://github.com/fastify/fastify`

The platform will:
1. Fetch repo metadata from GitHub API
2. Clone and analyze the codebase
3. Generate lessons, flashcards, quizzes, and interview questions
4. Make everything available on the repository dashboard

## API Reference

### Repository Import
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/repos/import` | Import from public GitHub URL |
| `POST` | `/api/repos/:id/resync` | Re-index repository |

### Repository Data
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/repos/:id/summary` | Repository overview + stats + indexing status |
| `GET` | `/api/repos/:id/architecture` | Architecture breakdown + concept graph + relations |
| `GET` | `/api/repos/:id/learning-path` | Progressive lessons ordered by track |

### Learning & Interaction
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/repos/:id/chat` | Send message to repository tutor (modes: explain/beginner/advanced/quiz) |
| `POST` | `/api/repos/:id/study-materials` | Generate flashcards, quizzes, or both |
| `POST` | `/api/repos/:id/interview` | Start interview (modes: conceptual/implementation/debug/system_design) |
| `POST` | `/api/repos/:id/interview/answer` | Submit answer for scoring and feedback |
| `GET` `/POST` | `/api/repos/:id/progress` | Read/update learning progress |

### Webhooks
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/webhooks/github` | Receive GitHub push events for auto-resync |

## Data Model

The platform uses 18 database models:

| Model | Purpose |
|-------|---------|
| `User`, `GitHubConnection` | Authentication & GitHub integration |
| `Repository`, `RepositorySnapshot` | Repo tracking & versioned analysis |
| `File`, `Symbol` | Parsed code structure |
| `Concept`, `ConceptRelation` | Knowledge graph (prerequisite/dependency edges) |
| `Lesson`, `LessonResource` | Learning curriculum |
| `Flashcard`, `Quiz` | Study materials |
| `TutorThread`, `TutorMessage` | Chat history with citations |
| `Interview`, `InterviewQuestion`, `InterviewResponse` | Interview engine with scoring |
| `UserProgress`, `ConceptMasteryMetric` | Learning progress tracking |
| `PersonalBot` | Per-user bot configuration & memory |

## Configuration

See `.env.example` for all options. Essential variables:

```env
# LLM Provider: anthropic or openai
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Embeddings: openai
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-...

# GitHub (for private repo access)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Security
ENCRYPTION_KEY=<32-byte-hex>
NEXTAUTH_SECRET=<random-secret>
```

## Development

```bash
make help              # Show all commands
make setup             # Full setup (install + prisma generate + migrate)
make dev               # Start Next.js dev server
make docker-up         # Start all Docker services
make docker-down       # Stop Docker services
make db-migrate        # Run Prisma migrations
make db-seed           # Seed demo data
make db-studio         # Open Prisma Studio (DB GUI)
make test              # Run all tests
make lint              # Run linters
make index-sample-repo # Test import a sample repo via curl
```

## Implementation Status

Following the [clp.md](./clp.md) product blueprint:

| Phase | Feature | Status |
|-------|---------|--------|
| 0 | Monorepo scaffold, Docker, auth | ✅ |
| 1 | Public URL import, GitHub OAuth, snapshot storage | ✅ |
| 2 | AST/heuristic analysis, architecture summary, embeddings | ✅ |
| 3 | Repository-aware chat tutor with citations | ✅ |
| 4 | Concept graph, lesson paths, flashcards, quizzes | ✅ |
| 5 | Interview engine (question gen, scoring, 4 modes) | ✅ |
| 6 | Progress tracking, personal bot, spaced repetition | ✅ |
| 7 | Webhook sync, incremental re-indexing | ✅ |

## License

Apache 2.0 — see [LICENSE](./LICENSE) for details.

---

**Built for developers who need to understand codebases fast.** Paste a URL, get a curriculum.
