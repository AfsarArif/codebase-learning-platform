-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "auth_provider" TEXT NOT NULL DEFAULT 'github',
    "github_user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider_type" TEXT NOT NULL DEFAULT 'oauth',
    "github_user_id" INTEGER NOT NULL,
    "access_token_encrypted" TEXT NOT NULL,
    "refresh_token_encrypted" TEXT,
    "installation_id" INTEGER,
    "scopes" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repositories" (
    "id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "source_type" TEXT NOT NULL DEFAULT 'public_url',
    "github_repo_id" INTEGER,
    "default_branch" TEXT NOT NULL DEFAULT 'main',
    "current_commit_sha" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "clone_url_or_api_url" TEXT,
    "description" TEXT,
    "language" TEXT,
    "topics" TEXT[],
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repository_snapshots" (
    "id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "commit_sha" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "archive_path" TEXT,
    "manifest_json" JSONB,
    "indexed_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repository_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "language" TEXT,
    "size_bytes" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "summary" TEXT,
    "is_ignored" BOOLEAN NOT NULL DEFAULT false,
    "raw_storage_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symbols" (
    "id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol_type" TEXT NOT NULL,
    "signature" TEXT,
    "start_line" INTEGER NOT NULL,
    "end_line" INTEGER NOT NULL,
    "summary" TEXT,

    CONSTRAINT "symbols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concepts" (
    "id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "concept_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'beginner',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concepts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concept_relations" (
    "id" TEXT NOT NULL,
    "from_concept_id" TEXT NOT NULL,
    "to_concept_id" TEXT NOT NULL,
    "relation_type" TEXT NOT NULL,

    CONSTRAINT "concept_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "concept_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'beginner',
    "estimated_minutes" INTEGER NOT NULL,
    "lesson_content_markdown" TEXT NOT NULL,
    "track" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_resources" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_ref" TEXT NOT NULL,
    "display_title" TEXT NOT NULL,

    CONSTRAINT "lesson_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcards" (
    "id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "lesson_id" TEXT,
    "concept_id" TEXT,
    "front_text" TEXT NOT NULL,
    "back_text" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "difficulty" TEXT NOT NULL DEFAULT 'beginner',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "lesson_id" TEXT,
    "title" TEXT NOT NULL,
    "quiz_type" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_threads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Chat',
    "mode" TEXT NOT NULL DEFAULT 'explain',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutor_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "citations_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutor_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "difficulty_profile" TEXT NOT NULL DEFAULT 'intermediate',
    "focus_areas_json" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "current_question_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_questions" (
    "id" TEXT NOT NULL,
    "interview_id" TEXT NOT NULL,
    "concept_id" TEXT,
    "question_type" TEXT NOT NULL,
    "prompt_text" TEXT NOT NULL,
    "reference_answer" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'intermediate',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source_files_json" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_responses" (
    "id" TEXT NOT NULL,
    "interview_question_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "answer_text" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "feedback_text" TEXT,
    "rubric_json" JSONB,
    "evaluated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "concept_id" TEXT,
    "lesson_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "mastery_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concept_mastery_metrics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "concept_id" TEXT NOT NULL,
    "last_interview_score" DOUBLE PRECISION,
    "average_interview_score" DOUBLE PRECISION,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_assessed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concept_mastery_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_bots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Code Tutor',
    "persona_config_json" JSONB NOT NULL DEFAULT '{}',
    "memory_config_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personal_bots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_github_user_id_key" ON "users"("github_user_id");

-- CreateIndex
CREATE INDEX "github_connections_user_id_idx" ON "github_connections"("user_id");

-- CreateIndex
CREATE INDEX "repositories_full_name_idx" ON "repositories"("full_name");

-- CreateIndex
CREATE INDEX "repositories_created_by_user_id_idx" ON "repositories"("created_by_user_id");

-- CreateIndex
CREATE INDEX "repository_snapshots_repository_id_commit_sha_idx" ON "repository_snapshots"("repository_id", "commit_sha");

-- CreateIndex
CREATE INDEX "files_snapshot_id_path_idx" ON "files"("snapshot_id", "path");

-- CreateIndex
CREATE INDEX "symbols_file_id_idx" ON "symbols"("file_id");

-- CreateIndex
CREATE INDEX "symbols_name_symbol_type_idx" ON "symbols"("name", "symbol_type");

-- CreateIndex
CREATE INDEX "concepts_snapshot_id_idx" ON "concepts"("snapshot_id");

-- CreateIndex
CREATE UNIQUE INDEX "concept_relations_from_concept_id_to_concept_id_relation_ty_key" ON "concept_relations"("from_concept_id", "to_concept_id", "relation_type");

-- CreateIndex
CREATE INDEX "lessons_snapshot_id_order_index_idx" ON "lessons"("snapshot_id", "order_index");

-- CreateIndex
CREATE INDEX "flashcards_snapshot_id_idx" ON "flashcards"("snapshot_id");

-- CreateIndex
CREATE INDEX "quizzes_snapshot_id_idx" ON "quizzes"("snapshot_id");

-- CreateIndex
CREATE INDEX "tutor_threads_user_id_repository_id_idx" ON "tutor_threads"("user_id", "repository_id");

-- CreateIndex
CREATE INDEX "tutor_messages_thread_id_created_at_idx" ON "tutor_messages"("thread_id", "created_at");

-- CreateIndex
CREATE INDEX "interviews_user_id_repository_id_idx" ON "interviews"("user_id", "repository_id");

-- CreateIndex
CREATE INDEX "interview_questions_interview_id_order_index_idx" ON "interview_questions"("interview_id", "order_index");

-- CreateIndex
CREATE INDEX "interview_responses_interview_question_id_idx" ON "interview_responses"("interview_question_id");

-- CreateIndex
CREATE INDEX "interview_responses_user_id_idx" ON "interview_responses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_user_id_repository_id_concept_id_key" ON "user_progress"("user_id", "repository_id", "concept_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_user_id_repository_id_lesson_id_key" ON "user_progress"("user_id", "repository_id", "lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "concept_mastery_metrics_user_id_repository_id_concept_id_key" ON "concept_mastery_metrics"("user_id", "repository_id", "concept_id");

-- CreateIndex
CREATE UNIQUE INDEX "personal_bots_user_id_repository_id_key" ON "personal_bots"("user_id", "repository_id");

-- AddForeignKey
ALTER TABLE "github_connections" ADD CONSTRAINT "github_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_snapshots" ADD CONSTRAINT "repository_snapshots_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "repository_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symbols" ADD CONSTRAINT "symbols_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "repository_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_relations" ADD CONSTRAINT "concept_relations_from_concept_id_fkey" FOREIGN KEY ("from_concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_relations" ADD CONSTRAINT "concept_relations_to_concept_id_fkey" FOREIGN KEY ("to_concept_id") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "repository_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_resources" ADD CONSTRAINT "lesson_resources_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "repository_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "repository_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_threads" ADD CONSTRAINT "tutor_threads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_threads" ADD CONSTRAINT "tutor_threads_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_messages" ADD CONSTRAINT "tutor_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "tutor_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_responses" ADD CONSTRAINT "interview_responses_interview_question_id_fkey" FOREIGN KEY ("interview_question_id") REFERENCES "interview_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_responses" ADD CONSTRAINT "interview_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_mastery_metrics" ADD CONSTRAINT "concept_mastery_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_mastery_metrics" ADD CONSTRAINT "concept_mastery_metrics_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_bots" ADD CONSTRAINT "personal_bots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_bots" ADD CONSTRAINT "personal_bots_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
