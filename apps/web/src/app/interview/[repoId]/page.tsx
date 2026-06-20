'use client';

import { useState } from 'react';
import { ArrowLeft, Loader2, Trophy, Check, X, FileCode } from 'lucide-react';
import Link from 'next/link';

type InterviewMode = 'conceptual' | 'implementation' | 'debug' | 'system_design';
type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'mixed';

interface InterviewQuestion {
  id: string;
  questionType: string;
  promptText: string;
  difficulty: string;
  tags: string[];
  sourceFiles: string[];
}

interface InterviewState {
  id: string;
  status: 'setup' | 'in_progress' | 'completed';
  mode: InterviewMode;
  difficulty: Difficulty;
  questionCount: number;
  questions: InterviewQuestion[];
  currentIndex: number;
  answers: Map<string, string>;
  scores: Map<string, number>;
  feedbacks: Map<string, string>;
}

export default function InterviewPage({ params }: { params: { repoId: string } }) {
  const [state, setState] = useState<InterviewState>({
    id: '',
    status: 'setup',
    mode: 'conceptual',
    difficulty: 'intermediate',
    questionCount: 5,
    questions: [],
    currentIndex: 0,
    answers: new Map(),
    scores: new Map(),
    feedbacks: new Map(),
  });
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/repos/${params.repoId}/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: state.mode,
          difficulty: state.difficulty,
          questionCount: state.questionCount,
        }),
      });
      const data = await res.json();
      setState((prev) => ({
        ...prev,
        id: data.interviewId ?? data.data?.id,
        status: 'in_progress',
        questions: data.questions ?? data.data?.questions ?? [],
        currentIndex: 0,
      }));
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || submitting) return;

    const question = state.questions[state.currentIndex];
    if (!question) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/repos/${params.repoId}/interview/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          answer: currentAnswer.trim(),
        }),
      });
      const data = await res.json();

      const newAnswers = new Map(state.answers);
      newAnswers.set(question.id, currentAnswer.trim());

      const newScores = new Map(state.scores);
      newScores.set(question.id, data.score ?? 0);

      const newFeedbacks = new Map(state.feedbacks);
      newFeedbacks.set(question.id, data.feedback ?? '');

      const nextIndex = state.currentIndex + 1;
      setState((prev) => ({
        ...prev,
        answers: newAnswers,
        scores: newScores,
        feedbacks: newFeedbacks,
        currentIndex: nextIndex,
        status: nextIndex >= prev.questions.length ? 'completed' : 'in_progress',
      }));
      setCurrentAnswer('');
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  };

  if (state.status === 'setup') {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/dashboard/${params.repoId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-2">Interview Mode</h1>
        <p className="text-muted-foreground mb-8">
          Test your understanding of this codebase with AI-generated interview questions.
        </p>

        <div className="space-y-6 rounded-lg border bg-card p-6">
          <div>
            <label className="block text-sm font-medium mb-2">Interview Mode</label>
            <select
              value={state.mode}
              onChange={(e) => setState((p) => ({ ...p, mode: e.target.value as InterviewMode }))}
              className="w-full px-3 py-2 rounded-md border border-input bg-background"
            >
              <option value="conceptual">Conceptual</option>
              <option value="implementation">Implementation</option>
              <option value="debug">Debug / Diagnostic</option>
              <option value="system_design">System Design</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <select
              value={state.difficulty}
              onChange={(e) => setState((p) => ({ ...p, difficulty: e.target.value as Difficulty }))}
              className="w-full px-3 py-2 rounded-md border border-input bg-background"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Questions (5-20)</label>
            <input
              type="number"
              min={5}
              max={20}
              value={state.questionCount}
              onChange={(e) => setState((p) => ({ ...p, questionCount: parseInt(e.target.value) || 5 }))}
              className="w-full px-3 py-2 rounded-md border border-input bg-background"
            />
          </div>

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Start Interview'}
          </button>
        </div>
      </div>
    );
  }

  if (state.status === 'completed') {
    const totalScore = Array.from(state.scores.values()).reduce((a, b) => a + b, 0);
    const avgScore = state.scores.size > 0 ? totalScore / state.scores.size : 0;

    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Interview Complete</h1>
        <div className="rounded-lg border bg-card p-8 text-center mb-8">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <div className="text-4xl font-bold mb-2">{avgScore.toFixed(0)}%</div>
          <p className="text-muted-foreground">Average Score</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Question Review</h2>
          {state.questions.map((q, i) => (
            <div key={q.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Question {i + 1}</span>
                <span className={`inline-flex items-center gap-1 text-sm ${
                  (state.scores.get(q.id) ?? 0) >= 60 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(state.scores.get(q.id) ?? 0) >= 60 ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  Score: {state.scores.get(q.id)?.toFixed(0) ?? '--'}%
                </span>
              </div>
              <p className="text-sm mb-2">{q.promptText}</p>
              {state.feedbacks.get(q.id) && (
                <p className="text-xs text-muted-foreground bg-secondary p-2 rounded">
                  {state.feedbacks.get(q.id)}
                </p>
              )}
              {q.sourceFiles.length > 0 && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <FileCode className="h-3 w-3" />
                  {q.sourceFiles.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-8">
          <Link
            href={`/dashboard/${params.repoId}`}
            className="flex-1 py-2 rounded-md border text-center hover:bg-accent transition-colors"
          >
            Back to Dashboard
          </Link>
          <button
            onClick={() => {
              setState((prev) => ({
                ...prev,
                status: 'setup',
                questions: [],
                currentIndex: 0,
                answers: new Map(),
                scores: new Map(),
                feedbacks: new Map(),
              }));
              setCurrentAnswer('');
            }}
            className="flex-1 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            New Interview
          </button>
        </div>
      </div>
    );
  }

  // In-progress
  const currentQuestion = state.questions[state.currentIndex];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Interview</h1>
        <span className="text-sm text-muted-foreground">
          Question {state.currentIndex + 1} of {state.questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-secondary rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(state.currentIndex / state.questions.length) * 100}%` }}
        />
      </div>

      {currentQuestion && (
        <div className="rounded-lg border bg-card p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 text-xs rounded-full bg-secondary">
              {currentQuestion.difficulty}
            </span>
            {currentQuestion.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-accent text-accent-foreground">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-lg mb-2">{currentQuestion.promptText}</p>
          {currentQuestion.sourceFiles.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileCode className="h-3 w-3" />
              Relevant files: {currentQuestion.sourceFiles.join(', ')}
            </div>
          )}
        </div>
      )}

      <textarea
        value={currentAnswer}
        onChange={(e) => setCurrentAnswer(e.target.value)}
        placeholder="Type your answer here..."
        rows={6}
        className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-4 resize-none"
        disabled={submitting}
      />

      <button
        onClick={handleSubmitAnswer}
        disabled={submitting || !currentAnswer.trim()}
        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
        ) : state.currentIndex === state.questions.length - 1 ? (
          'Finish Interview'
        ) : (
          'Submit Answer'
        )}
      </button>
    </div>
  );
}
