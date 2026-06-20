# Codebase Learning Platform Implementation Plan

## Project overview

Build a reproducible platform that connects to GitHub repositories, analyzes a codebase, explains the architecture and purpose of the project, and turns the repository into an interactive learning experience. The platform should support both authenticated GitHub integration and unauthenticated public GitHub URL ingestion, then provide step-by-step teaching, question answering, flashcards, quizzes, mini learning games, interview-style assessments, and a personal learning bot for each user.

This plan is written so an implementation agent such as Claude Code can use it as a full product and engineering blueprint.

## Product goals

### Primary goals

- Ingest a GitHub repository from either:
  - A user-authenticated GitHub connection.
  - A public GitHub repository URL.
- Understand the codebase at multiple levels:
  - Repository purpose.
  - Tech stack.
  - File and module structure.
  - Runtime architecture.
  - Data flow.
  - Important business logic.
  - Developer workflows.
- Generate a progressive learning path so a developer can learn their project step by step.
- Provide an interactive tutor that can answer questions grounded in the repository.
- Generate study materials automatically, including flashcards, quizzes, mini learning games, and interview-style questions.
- Make the system easy to reproduce locally or in the cloud so anyone can run it.

### Success criteria

- A user can paste a GitHub URL and receive a useful repository overview within minutes.
- A user can connect GitHub and analyze private repositories securely.
- The system produces a structured curriculum from real code, not generic explanations.
- The tutor answers questions with references to files, modules, symbols, and architecture concepts from the repo.
- Study materials remain synchronized with the current codebase version.
- The interview mode can accurately test a learner’s understanding of this specific project.
- The app can be self-hosted with a one-command or low-friction setup.

## User personas

### 1. Solo developer

Wants to understand an old personal project or onboarding into a side project after time away.

### 2. Team member

Needs a guided onboarding path for an internal codebase and wants explanations tied to actual architecture.

### 3. Student or learner

Wants to learn from open-source repositories by pasting a GitHub link without signing in.

### 4. Engineering manager or lead

Wants reusable onboarding and study content for team repositories.

## Core user journeys

### Journey 1: Public repo learning

1. User pastes a public GitHub URL.
2. System clones or fetches repository metadata and source files.
3. System analyzes the codebase.
4. System generates:
   - Repo summary.
   - Architecture map.
   - Learning path.
   - Ask-a-bot tutor.
   - Study materials.
5. User studies the repo and asks questions.

### Journey 2: Private repo learning

1. User signs in.
2. User connects GitHub via OAuth or GitHub App.
3. User selects a repository.
4. System securely ingests the chosen codebase.
5. System generates the learning workspace.
6. User studies, chats, and generates learning artifacts.

### Journey 3: Continuous repository learning

1. User connects a repository once.
2. System stores the analyzed knowledge graph and embeddings by commit SHA.
3. On sync or webhook updates, the system reprocesses changed files.
4. Learning content updates incrementally.
5. User can compare learning material between versions.

## Scope

### MVP scope

- Public GitHub URL ingestion for public repos.
- GitHub OAuth or GitHub App support for private repos.
- Repository cloning or remote fetch.
- Codebase parsing and chunking.
- Embeddings and vector search.
- Repository-aware chat tutor.
- Auto-generated repository overview.
- Auto-generated architecture breakdown.
- Step-by-step learning path.
- Flashcards and quizzes.
- Basic mini-game support, such as matching concepts to files or architecture flow ordering.
- Basic interview-style question generation and evaluation.
- Dockerized deployment.

### Phase 2 scope

- Multi-repo workspaces.
- Team spaces and shared study tracks.
- Slack or Discord bot.
- IDE extension.
- PR-aware learning updates.
- Fine-grained personalization based on user proficiency.
- Voice tutor or screen-share walkthrough mode.
- More advanced interview modes and reporting.

## Product requirements

### Repository ingestion

The system must support two ingestion modes.

#### Mode A: Connected GitHub account

- Sign in with GitHub.
- Request only necessary scopes.
- Let user browse accessible repositories.
- Support private and public repositories.
- Store installation or access tokens securely.
- Optionally support GitHub App for stronger org compatibility.

#### Mode B: Public URL ingestion

- Accept URLs like:
  - `https://github.com/owner/repo`
  - `https://github.com/owner/repo/tree/branch/path`
- Validate repository accessibility.
- Fetch only public data.
- No sign-in required.

### Repository understanding

The system should derive and store the following:

- Project purpose and domain.
- Languages and frameworks.
- Build tools and package managers.
- Entry points.
- Folder structure.
- Service boundaries.
- Internal modules and their responsibilities.
- APIs, routes, controllers, services, models, jobs, utilities, and config.
- Database and schema clues.
- Third-party dependencies.
- Test structure.
- Deployment or infrastructure signals.
- Runtime flow from request or event to result.

### Learning experience

The system should generate a layered learning model.

#### Layer 1: Orientation

- What this project does.
- Who it serves.
- Main technologies.
- How the app runs.
- Key directories.

#### Layer 2: Architecture

- System components.
- Data flow.
- Request lifecycle.
- State management.
- Integration points.

#### Layer 3: Deep dives

- Module-by-module walkthroughs.
- Critical files.
- Important classes and functions.
- Patterns and conventions.
- Common bugs or complexity hotspots.

#### Layer 4: Practice

- Flashcards.
- Quizzes.
- Mini-games.
- Challenge prompts such as “trace how login works.”
- Interview-style questions that simulate technical screening on this codebase.

### Chat tutor requirements

The tutor should:

- Answer questions grounded in the repository.
- Cite files, folders, classes, functions, and commit-aware context.
- Explain at beginner, intermediate, or advanced depth.
- Offer step-by-step walkthroughs.
- Ask clarifying questions when the question is ambiguous.
- Avoid hallucinating beyond the indexed codebase and available metadata.
- Be able to switch modes:
  - Explain simply.
  - Explain with architecture detail.
  - Explain with code references.
  - Quiz me instead.
  - Interview me on this project.

### Study materials generation

The platform should generate:

- Flashcards:
  - Term → definition.
  - File → responsibility.
  - Endpoint → flow.
  - Concept → implementation location.
- Quizzes:
  - Multiple choice.
  - Short answer.
  - True/false.
  - Ordering and matching.
- Mini-games:
  - Match directory to purpose.
  - Order request lifecycle steps.
  - Connect function to module.
  - Identify where a feature lives.
- Learning guides:
  - “Learn this project in 30 minutes.”
  - “Backend-first path.”
  - “Frontend-first path.”
  - “New contributor path.”
- Interview-style questions and sessions:
  - Conceptual and implementation questions grounded in repo.
  - Scored sessions to assess understanding.
  - Feedback loops into lessons and flashcards.

### Personal bot

Each user should be able to have a repository-specific bot persona.

Capabilities:

- Persist repository context.
- Remember the learner’s progress and weak areas.
- Recommend next lessons.
- Answer follow-up questions over time.
- Generate targeted practice based on mistakes.
- Run interview-style sessions and use results to adapt teaching.

## High-level architecture

Use a modular architecture with clear separation between ingestion, analysis, retrieval, teaching, and user experience.

### Core subsystems

1. Frontend application.
2. Backend API.
3. GitHub integration service.
4. Repository ingestion and parsing pipeline.
5. Knowledge extraction pipeline.
6. Vector indexing and retrieval layer.
7. Tutor and content generation service.
8. Interview-mode assessment service.
9. User progress and personalization service.
10. Storage layer.
11. Background jobs and orchestration.

## Recommended tech stack

This stack balances reproducibility, AI integration, and developer productivity.

### Frontend

- Next.js with App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui or a similar accessible component layer.
- React Query or TanStack Query for server state.
- Zustand or lightweight state management for local UI state.

### Backend

Option A, strongly recommended for a unified app:

- Next.js API routes or route handlers for lighter backend concerns.
- Separate worker service for heavy ingestion and indexing.

Option B, better for scale:

- FastAPI or NestJS for API.
- Separate worker service using Python for parsing and AI pipelines.

Recommended final split:

- Next.js frontend and thin API layer.
- Python service for repository analysis, embeddings, and content generation.
- Background queue for long-running jobs.

### AI and retrieval

- LLM provider abstraction so the implementation can swap between OpenAI, Anthropic, or local models.
- Embedding model abstraction.
- Vector database such as pgvector, Qdrant, or Weaviate.
- Reranking support for more accurate retrieval.

### Storage

- PostgreSQL for primary relational data.
- Object storage for raw repository snapshots, generated diagrams, and lesson artifacts.
- Redis for caching, sessions, and queues.

### Background processing

- Celery, RQ, Dramatiq, or BullMQ.
- Webhook-driven sync jobs.
- Incremental re-indexing jobs.

### Auth and GitHub

- GitHub OAuth for user sign-in.
- GitHub App for repository installation and org-grade private access.
- Prefer GitHub App if deep repository integration is a core feature.

### Deployment

- Docker Compose for local reproducibility.
- Optional Kubernetes or managed cloud deployment later.
- Infrastructure as code with Terraform in later phases.

## System design details

### 1. Frontend app

Core pages:

- Landing page.
- Sign-in page.
- Repository onboarding page.
- Repository dashboard.
- Learning path page.
- Chat tutor page.
- Study material page.
- Interview mode page.
- Progress page.
- Admin or settings page.

Key frontend modules:

- GitHub connect flow.
- Public repo URL input.
- Repository selection UI.
- Job status tracker for indexing progress.
- Learning path navigator.
- Tutor chat interface.
- Flashcard review UI.
- Quiz engine UI.
- Mini-game player UI.
- Interview session UI.
- Personal progress dashboard.

### 2. Backend API

Suggested API domains:

- `/auth/*`
- `/github/*`
- `/repos/*`
- `/analysis/*`
- `/learning/*`
- `/chat/*`
- `/study-materials/*`
- `/interviews/*`
- `/progress/*`
- `/webhooks/github`

Representative endpoints:

- `POST /repos/import-from-url`
- `POST /repos/import-from-github`
- `GET /repos/:id/summary`
- `GET /repos/:id/architecture`
- `GET /repos/:id/learning-path`
- `POST /chat/:repoId/message`
- `POST /study-materials/:repoId/generate`
- `POST /interviews/:repoId/start`
- `GET /interviews/:id`
- `POST /interviews/:id/answer`
- `GET /interviews/:repoId/history`
- `POST /progress/:repoId/lesson/:lessonId/complete`
- `POST /repos/:id/resync`

### 3. GitHub integration service

Responsibilities:

- OAuth login and token handling.
- GitHub App installation flow.
- Repository listing.
- Metadata fetch.
- Clone URL or archive download generation.
- Webhook handling for pushes and pull requests if desired.

Important design choice:

Prefer archive download or sparse fetch when possible for reproducibility and speed. Fall back to full clone for deeper analysis if needed.

### 4. Repository ingestion pipeline

Pipeline stages:

1. Validate repository and user access.
2. Snapshot the repository at a target branch or commit SHA.
3. Detect repository type and language ecosystem.
4. Filter files:
   - Ignore binaries.
   - Ignore vendored directories.
   - Ignore generated artifacts.
   - Respect `.gitignore` where useful.
5. Parse file tree and metadata.
6. Chunk code and docs intelligently.
7. Extract symbols and relationships.
8. Store raw and processed artifacts.

Input sources:

- Git clone.
- GitHub tarball or zip archive.
- GitHub API metadata.

### 5. Knowledge extraction pipeline

This is the heart of the product.

The pipeline should produce multiple representations of the repo.

#### A. Structural understanding

- File tree graph.
- Directory purpose summaries.
- Module boundaries.
- Dependency graph.
- Import graph.
- Entry points and bootstrapping flow.

#### B. Semantic understanding

- File summaries.
- Symbol summaries.
- Feature summaries.
- Architecture explanations.
- Domain language extraction.
- Project glossary.

#### C. Learning graph

Represent the codebase as concepts and prerequisites.

Example nodes:

- Authentication flow.
- API routing.
- Data model layer.
- Frontend state management.
- Background jobs.
- Testing strategy.

Example edges:

- “Authentication flow depends on session middleware.”
- “Order creation depends on payment service and user model.”

This graph becomes the basis for the step-by-step curriculum and interview questions.

### 6. Retrieval and tutor layer

Use retrieval-augmented generation with multi-stage retrieval.

Recommended retrieval flow:

1. User asks a question.
2. Classify intent:
   - Explain concept.
   - Locate code.
   - Summarize architecture.
   - Compare modules.
   - Generate quiz.
   - Run interview-style question (if in interview mode).
3. Retrieve from:
   - Repository metadata.
   - File summaries.
   - Symbol summaries.
   - Relevant code chunks.
   - Learning graph.
   - User progress context.
4. Rerank results.
5. Generate grounded answer or question.
6. Return answer with code references and suggested next steps.

### 7. Learning content generation engine

This service should transform repository knowledge into educational assets.

Inputs:

- Repository summary.
- Architecture graph.
- File and symbol summaries.
- User proficiency level.
- Learning goals.

Outputs:

- Lesson plans.
- Reading sequences.
- Flashcards.
- Quizzes.
- Mini-game content.
- Interview questions.
- Personalized recommendations.

## Data model

Below is a practical initial schema.

### Users

- id
- email
- name
- avatar_url
- auth_provider
- created_at
- updated_at

### GitHubConnections

- id
- user_id
- provider_type
- github_user_id
- access_token_encrypted
- refresh_token_encrypted if applicable
- installation_id if GitHub App
- scopes
- created_at
- updated_at

### Repositories

- id
- owner
- name
- full_name
- source_type, such as github_connected or public_url
- github_repo_id nullable
- default_branch
- current_commit_sha
- visibility
- clone_url_or_api_url
- created_by_user_id nullable
- created_at
- updated_at

### RepositorySnapshots

- id
- repository_id
- commit_sha
- branch
- archive_path
- manifest_json
- indexed_status
- created_at

### Files

- id
- snapshot_id
- path
- language
- size_bytes
- hash
- summary
- is_ignored
- raw_storage_path

### Symbols

- id
- file_id
- name
- symbol_type
- signature
- start_line
- end_line
- summary

### Concepts

- id
- snapshot_id
- name
- concept_type
- description
- difficulty

### ConceptRelations

- id
- from_concept_id
- to_concept_id
- relation_type

### Lessons

- id
- snapshot_id
- title
- description
- order_index
- difficulty
- estimated_minutes
- lesson_content_markdown

### LessonResources

- id
- lesson_id
- resource_type
- resource_ref
- display_title

### Flashcards

- id
- snapshot_id
- lesson_id nullable
- front_text
- back_text
- tags_json
- difficulty

### Quizzes

- id
- snapshot_id
- lesson_id nullable
- title
- quiz_type
- payload_json

### TutorThreads

- id
- user_id
- repository_id
- title
- created_at
- updated_at

### TutorMessages

- id
- thread_id
- role
- content
- citations_json
- created_at

### Interviews

- id
- repository_id
- user_id
- mode (conceptual, implementation, debug, system_design)
- difficulty_profile
- focus_areas_json
- status
- created_at
- updated_at

### InterviewQuestions

- id
- interview_id
- concept_id nullable
- question_type
- prompt_text
- reference_answer
- difficulty
- tags_json
- source_files_json
- order_index

### InterviewResponses

- id
- interview_question_id
- user_id
- answer_text
- score
- feedback_text
- evaluated_at
- rubric_json

### UserProgress

- id
- user_id
- repository_id
- concept_id nullable
- lesson_id nullable
- status
- mastery_score
- last_reviewed_at

### ConceptMasteryMetrics

- id
- user_id
- repository_id
- concept_id
- last_interview_score
- average_interview_score
- attempts
- last_assessed_at

### PersonalBots

- id
- user_id
- repository_id
- name
- persona_config_json
- memory_config_json
- created_at

## Code understanding strategy

Use a hybrid analysis approach instead of only embeddings.

### Analysis layers

#### 1. Heuristic analysis

- Detect package files such as `package.json`, `pyproject.toml`, `pom.xml`, `Cargo.toml`, `go.mod`.
- Detect frameworks from dependency and config signals.
- Detect test tools and linters.
- Detect deployment files such as Dockerfile, GitHub Actions, Terraform, Helm.

#### 2. AST and symbol extraction

Use language-aware parsers where possible.

Examples:

- Tree-sitter for multi-language parsing.
- Language-specific parsers for TypeScript, Python, Java, Go, Rust, and others as needed.

Extract:

- Imports.
- Exports.
- Functions.
- Classes.
- Interfaces.
- Routes.
- Decorators or annotations.
- SQL queries if embedded.
- Comments and docstrings.

#### 3. Semantic summarization

Generate summaries at multiple levels:

- File-level summary.
- Module-level summary.
- Feature-level summary.
- End-to-end flow summary.

#### 4. Architecture inference

Infer architecture by combining:

- Folder conventions.
- Dependency direction.
- Runtime entry points.
- Framework patterns.
- Config and deployment artifacts.

Examples:

- MVC app.
- Layered monolith.
- Service-oriented backend.
- Next.js full-stack app.
- Event-driven worker architecture.
- Microservice repo or monorepo.

## Curriculum generation strategy

The system should build lessons from simple to advanced.

### Curriculum algorithm

1. Identify repository type.
2. Build concept graph.
3. Assign difficulty scores.
4. Detect prerequisites.
5. Group concepts into modules.
6. Generate lessons in increasing complexity.
7. Add practical checkpoints and quizzes.
8. Tie interview questions to concepts at different difficulty levels.

### Example lesson structure

Each lesson should include:

- Lesson title.
- Why this matters.
- What the learner will understand.
- Prerequisites.
- Files and modules covered.
- Step-by-step explanation.
- Key terms.
- Common confusion points.
- Practice questions.
- Suggested next lesson.

### Example tracks

- Newcomer track.
- Frontend track.
- Backend track.
- Full-stack architecture track.
- Testing and quality track.
- Deployment and infrastructure track.
- Interview-prep track (focused on questions and assessment).

## Mini-games design

Keep mini-games simple, educational, and data-driven from the repo.

### Game 1: File-to-purpose match

User matches important files or directories to their responsibilities.

### Game 2: Request lifecycle order

User orders steps such as route, controller, service, model, database, response.

### Game 3: Architecture map reveal

User fills missing nodes in an architecture diagram.

### Game 4: Feature locator

User identifies which module likely owns a feature.

### Game 5: Dependency challenge

User predicts what breaks if a module changes.

## Interview-style assessment mode

Add a dedicated interview subsystem that uses the same repository knowledge to generate and run structured interview sessions.

### Goals

- Assess how well a learner understands the specific project’s architecture, implementation details, tradeoffs, and patterns.
- Simulate real technical interviews that reference the actual codebase rather than generic questions.

### Interview modes

- **Conceptual interviews:** Questions about architecture, design decisions, tradeoffs, and high-level flows (for example, how authentication works end to end).
- **Implementation interviews:** Questions that require pointing to files, explaining functions, or walking through specific flows (for example, “Walk me through request X”).
- **Debug/diagnostic interviews:** Present a snippet or flow from the repo and ask what could go wrong, where to log, or how to refactor.
- **System-design-on-this-repo:** Ask “How would you extend this project to do Y?” to check their ability to reason from the existing architecture.

Each interview can be configured for difficulty (beginner, intermediate, advanced) and focus area (frontend, backend, data, infrastructure, testing, and so on).

## Interview question generation

Build on the same knowledge graph and summaries you already planned.

### Question types

- **Basic:** Folder structure, main components, simple flows (for example, “Where does X live in the repo?”).
- **Intermediate:** Logic interactions, lifecycle flows, performance and reliability questions, testing strategy.
- **Advanced:** Design tradeoffs, scalability, refactoring, security, and observability questions grounded in the project.
- **Framework-specific:** Questions about how the project uses a framework (for example, Next.js routing or Django ORM).

### Generation pipeline

1. Use the concept graph and file or symbol summaries to pick a topic or flow.
2. Generate a question, including context (which files or flows), difficulty, and tags (area: API, database, state, tests, and so on).
3. Generate a model answer grounded in specific files, functions, and architectural concepts.
4. Optionally generate follow-up questions that dig deeper if the learner does well.

Reuse the existing retrieval stack and prompts, but add specific interview question generation and evaluation prompts.

## Interview sessions and scoring

### Session structure

- A session is a sequence of 5 to 20 questions of mixed type and difficulty.
- The engine can be configured for “quick check” (5 questions), “round-style” (30 to 45 minutes), or “mock onsite” composed of multiple sessions.

### Scoring and feedback

- For multiple-choice and structured formats, auto-score based on reference answers.
- For free-form answers, use an LLM-based grader that compares the learner answer to a reference answer with thresholds per difficulty.
- Provide immediate feedback: correct or incorrect, explanation, links to relevant files, and suggestions for what to review.
- Track performance by concept, difficulty, and area (for example, strong on routing, weak on database layer).

## Integration with personal bot and learning engine

- The personal bot should be able to enter interview mode, where it stops explaining and instead asks structured questions, waits for answers, and evaluates them.
- After an interview session, the bot uses the results to recommend specific lessons and code paths to review, generate new flashcards targeting weak concepts, and schedule follow-up assessments.

## Prompting and AI orchestration

The implementation should use a prompt pipeline, not a single generic prompt.

### Prompt types

- Repository overview prompt.
- File summarization prompt.
- Architecture inference prompt.
- Lesson generation prompt.
- Flashcard generation prompt.
- Quiz generation prompt.
- Tutor answer prompt.
- Beginner simplification prompt.
- Advanced explanation prompt.
- Interview question generation prompt.
- Interview answer evaluation prompt.
- Performance summarization and recommendation prompt.

### Guardrails

- Never answer outside repository evidence unless clearly labeled as general software knowledge.
- Always include confidence notes or evidence references for uncertain conclusions.
- Prefer “based on these files” phrasing in tutor responses.
- Use branch or commit context so explanations match the indexed version.
- For interview grading, keep rubrics consistent and transparent.

## Reproducibility requirements

This project should be easy for anyone to run.

### Local development requirements

Provide:

- `docker-compose.yml`
- `.env.example`
- `Makefile` or simple `justfile`
- Seed scripts for local demo repositories.
- One command to start all services.

### Suggested local services

- Web app.
- API service.
- Worker service.
- PostgreSQL.
- Redis.
- Vector database if separate from Postgres.
- Optional local object storage emulator.

### Developer experience goals

- `make setup`
- `make dev`
- `make test`
- `make index-sample-repo`

### Open-source friendliness

- Use permissive license.
- Keep provider configuration pluggable.
- Make GitHub mode optional so public URL mode works with minimal setup.
- Provide sample public repositories for demo mode.

## Mock interviews from CLI or API

To make interview practice accessible without the full UI, include simple ways to start and run interviews via the command line and raw HTTP APIs.

### CLI interface

Add a small CLI tool (for example, `cblearn`) that can:

- List repositories the user has access to.
- Start an interview for a given repository with flags for mode, difficulty, and focus areas.
- Run a question-and-answer loop in the terminal.
- Show a summary report at the end, including scores by concept and suggested next lessons.

Example commands (for Claude to implement, not final names):

- `cblearn repos list`
- `cblearn interview start --repo my-repo --mode conceptual --difficulty intermediate`
- `cblearn interview resume --id <interview-id>`

The CLI can talk to the same backend APIs using an auth token, so it stays thin and easy to maintain.

### Raw API usage

Document a minimal flow so users can script their own interview practice with HTTP requests or Postman.

1. Start an interview: `POST /interviews/:repoId/start` with JSON parameters for mode, difficulty, and focus areas.
2. Fetch the first question: `GET /interviews/:id` (or `GET /interviews/:id/next-question` if implemented).
3. Submit an answer: `POST /interviews/:id/answer` with the question id and answer text.
4. Repeat until the interview ends, then fetch a summary: `GET /interviews/:id`.

Keep the API responses simple (question text, type, any options, and scoring feedback) so they can be consumed easily by scripts, terminals, or other tools.

## Non-functional requirements

- Multi-tenant safe.
- Secure by default.
- Reproducible locally.
- Observable.
- Modular.
- Provider-agnostic for LLMs and embeddings.
- Cost-aware with caching and incremental processing.

## Security and privacy

This is critical because private repositories may be involved.

### Security requirements

- Encrypt GitHub access tokens at rest.
- Use least-privilege scopes.
- Separate user auth from repository processing permissions.
- Never expose raw private code to unauthorized users.
- Add repository-level access control checks on every relevant API route.
- Maintain audit logs for repository imports and syncs.
- Allow users to delete repository snapshots and derived learning data.

### Privacy controls

- Clear policy for storing code snapshots.
- Optional “ephemeral analysis mode” where repo data is processed and not retained long term.
- Configurable retention window.
- Ability to disable model training usage if external AI providers are used.

## Performance and scaling

### Performance targets

- Public repo onboarding for small repos under 2 minutes.
- Private repo indexing feedback should start immediately with progress updates.
- Tutor responses should typically return in under 10 seconds for common questions.
- Interview sessions should remain responsive and not stall due to long generation pipelines.

### Scaling strategies

- Chunked indexing.
- Incremental sync by changed files.
- Cache repository summaries.
- Precompute lesson content after ingestion.
- Pre-generate pools of interview questions per concept and difficulty.
- Use separate queues for indexing, summarization, and study content generation.

## Observability

Include from the start:

- Structured logs.
- Job metrics.
- API latency metrics.
- Token and model usage metrics.
- Repository ingestion success and failure tracking.
- Tracing for ingestion pipeline stages.
- Interview session and scoring metrics.

Recommended tools:

- OpenTelemetry.
- Prometheus and Grafana, or managed equivalents.
- Sentry for frontend and backend errors.

## Testing strategy

### Unit tests

- Repository URL parsing.
- GitHub auth flows.
- File filtering.
- Chunking.
- Prompt builders.
- Curriculum ordering logic.
- Quiz and flashcard generators.
- Interview question selection and scoring.
- CLI interactions where practical.

### Integration tests

- Import public repository.
- Connect GitHub and import private repository in a mocked environment.
- Run indexing pipeline.
- Retrieve grounded tutor answers.
- Generate lesson plans and study materials.
- Run full interview sessions end-to-end with mock answers.

### End-to-end tests

- User signs in.
- Imports repository.
- Waits for analysis.
- Opens lesson path.
- Chats with tutor.
- Completes quiz.
- Runs an interview session.
- Reviews feedback and updated lesson recommendations.

### Evaluation tests

Create benchmark repositories and validate:

- Architecture summary quality.
- Tutor grounding accuracy.
- Learning path usefulness.
- Flashcard and quiz quality.
- Interview question relevance and scoring fairness.

## Suggested repository structure

```text
codebase-learning-platform/
  apps/
    web/
    api/
    worker/
  packages/
    ui/
    shared/
    prompts/
    github/
    parsing/
    retrieval/
    learning-engine/
    interview-engine/
  infrastructure/
    docker/
    terraform/
  scripts/
  docs/
  examples/
  docker-compose.yml
  .env.example
  Makefile
```

## Recommended implementation phases

### Phase 0: Foundation

- Set up monorepo.
- Set up frontend, API, worker, database, and queue.
- Add Docker Compose.
- Add auth scaffolding.
- Add GitHub public URL parsing.

### Phase 1: Repository ingestion

- Implement GitHub OAuth or GitHub App.
- Support public repo import.
- Download or clone repository snapshots.
- Parse file tree.
- Filter files.
- Store snapshot metadata.

### Phase 2: Code understanding

- Add AST and heuristic analyzers.
- Generate file summaries.
- Generate architecture summary.
- Build search index and embeddings.
- Create repo dashboard with summary and structure.

### Phase 3: Tutor

- Build repository-aware chat.
- Add citations to files and symbols.
- Add beginner versus advanced explanation modes.
- Add suggested follow-up questions.

### Phase 4: Learning engine

- Build concept graph.
- Generate lesson paths.
- Generate flashcards.
- Generate quizzes.
- Build study UI.

### Phase 5: Interview engine

- Implement interview question generation.
- Implement interview sessions and scoring.
- Integrate with personal bot and progress tracking.
- Implement CLI and raw API flows for interview mode.

### Phase 6: Personalization

- Track progress.
- Add spaced repetition for flashcards.
- Add personal bot memory and recommendations.
- Add weak-area detection using both study and interview data.

### Phase 7: Sync and polish

- Add webhook sync.
- Incremental re-indexing.
- Improve performance.
- Add admin tools, monitoring, and export features.

## Example feature specifications for Claude Code

### Feature: import repository from public URL

Acceptance criteria:

- User can paste a public GitHub repository URL.
- System validates the URL and extracts owner, repo, branch, and path if present.
- System fetches repository contents and metadata.
- System creates a repository record and snapshot.
- System begins analysis asynchronously.
- User sees ingestion progress in the UI.

### Feature: import repository from connected GitHub

Acceptance criteria:

- User can connect GitHub account.
- User can browse accessible repositories.
- User can choose a repository.
- System imports private or public repo with proper authorization.
- Tokens are encrypted and never exposed to the client.

### Feature: generate learning path

Acceptance criteria:

- System generates at least one lesson path after repository analysis.
- Lessons are ordered from basic orientation to deeper architecture and feature flows.
- Each lesson references specific files or modules.
- Lesson content can be regenerated for a new commit snapshot.

### Feature: tutor Q and A

Acceptance criteria:

- User can ask questions in natural language.
- Answers are grounded in repository data.
- Answers reference source files and concepts.
- System can respond in beginner or advanced mode.

### Feature: flashcards and quizzes

Acceptance criteria:

- System can generate flashcards from lessons or repository concepts.
- System can generate quizzes with answer keys and explanations.
- User can regenerate content or request easier or harder material.

### Feature: interview mode

Acceptance criteria:

- User can start an interview session for a repo with chosen mode, difficulty, and focus areas.
- System generates questions grounded in the repo’s code and architecture.
- System scores answers and provides feedback with references to relevant files.
- Interview performance updates concept mastery and future lesson/flashcard recommendations.
- Interview sessions can be run via web UI and CLI.

## Non-functional requirements

- Multi-tenant safe.
- Secure by default.
- Reproducible locally.
- Observable.
- Modular.
- Provider-agnostic for LLMs and embeddings.
- Cost-aware with caching and incremental processing.

## Risks and mitigations

| Risk | Description | Mitigation |
|---|---|---|
| Hallucinated explanations | The tutor may infer too much from incomplete evidence | Enforce retrieval grounding, confidence labeling, and file citations |
| Large repo cost | Big repositories may be expensive to embed and summarize | Use staged indexing, file filtering, and incremental sync |
| Private code sensitivity | Storing code snapshots introduces risk | Encrypt secrets, add deletion controls, support ephemeral mode |
| Weak architecture inference | Some repos have poor structure or sparse docs | Combine heuristics, AST extraction, dependency graphs, and user clarifications |
| Poor study content quality | Automatically generated quizzes may be shallow | Add evaluation prompts, quality checks, and regeneration strategies |
| Interview scoring bias | LLM-based grading may be inconsistent | Use clear rubrics, calibration sets, and human spot checks |
| Reproducibility drift | Too many moving services can hurt adoption | Ship Docker Compose, sample env files, and make commands |

## Nice-to-have extensions

- Browser extension for “learn this repo” directly from GitHub pages.
- VS Code extension with inline learning mode.
- PR review tutor that explains a pull request in learning terms.
- Team onboarding packs.
- Architecture diagrams generated automatically from code relationships.
- Audio lessons or narrated walkthroughs.
- Interview prep mode focused on specific job descriptions.

## Final implementation guidance for Claude Code

Build this as a modular monorepo with a strong separation between user experience, repository ingestion, code understanding, retrieval, learning generation, and interview assessment. Optimize first for correctness, grounding, and reproducibility rather than visual polish. The best MVP is one that can ingest a real GitHub repository, produce a believable architecture summary, generate a useful step-by-step learning path, run repo-specific interview sessions, and answer repository-specific questions with references.

Prioritize the following order:

1. Public GitHub URL import.
2. Connected GitHub private repo import.
3. Repository parsing and understanding.
4. Grounded chat tutor.
5. Learning path generation.
6. Flashcards and quizzes.
7. Interview-mode engine (questions, scoring, integration).
8. Progress tracking and personal bot memory.
9. Mini-games and advanced polish.

## Build checklist

- [ ] Monorepo scaffolded.
- [ ] Frontend, API, worker, DB, and queue running locally.
- [ ] GitHub OAuth or GitHub App connected.
- [ ] Public repo URL import working.
- [ ] Repository snapshot storage working.
- [ ] File parsing and filtering working.
- [ ] Embeddings and retrieval working.
- [ ] Architecture summary generation working.
- [ ] Lesson generation working.
- [ ] Tutor grounded responses working.
- [ ] Flashcards and quiz generation working.
- [ ] Interview mode (questions, sessions, scoring) working.
- [ ] CLI and raw API interview flows implemented.
- [ ] Progress tracking working.
- [ ] Docker Compose and `.env.example` included.
- [ ] Basic tests included.
- [ ] Documentation included.