'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Brain,
  FileCode,
  Gamepad2,
  GitBranch,
  Loader2,
  MessageSquare,
  RefreshCw,
  Trophy,
} from 'lucide-react';

interface RepoDashboardData {
  repository: {
    id: string;
    fullName: string;
    description?: string;
    language?: string;
    defaultBranch: string;
    topics?: string[];
  };
  snapshot: {
    id: string;
    indexedStatus: 'pending' | 'indexing' | 'completed' | 'failed';
    commitSha: string;
  } | null;
  stats: {
    totalFiles: number;
    totalConcepts: number;
    totalLessons: number;
    totalFlashcards: number;
    totalQuizzes: number;
    indexingProgress: number;
  };
}

export default function RepoDashboardPage({
  params,
}: {
  params: { repoId: string };
}) {
  const [data, setData] = useState<RepoDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/repos/${params.repoId}/summary`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('NOT_FOUND');
          throw new Error('Failed to load');
        }
        const json = await res.json();
        const status = json.data?.snapshot?.indexedStatus;

        setData(json.data);

        // Stop polling if completed or failed
        if (status === 'completed' || status === 'failed') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error loading repo';
        setError(msg);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Poll every 5 seconds for pending/indexing repos
    pollingRef.current = setInterval(fetchData, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [params.repoId]);

  const handleResync = async () => {
    try {
      setLoading(true);
      await fetch(`/api/repos/${params.repoId}/resync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      // Re-enable polling
      pollingRef.current = setInterval(() => {
        fetch(`/api/repos/${params.repoId}/summary`)
          .then((r) => r.json())
          .then((j) => {
            setData(j.data);
            const s = j.data?.snapshot?.indexedStatus;
            if (s === 'completed' || s === 'failed') {
              if (pollingRef.current) clearInterval(pollingRef.current);
            }
          });
      }, 5000);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Initial loading
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error: repo not found
  if (error === 'NOT_FOUND') {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold mb-2">Repository Not Found</h2>
        <p className="text-muted-foreground mb-4">
          This repository has not been imported yet. Paste a GitHub URL to get started.
        </p>
        <Link href="/repos" className="text-primary hover:underline">
          ← Import a repository
        </Link>
      </div>
    );
  }

  // Generic error
  if (error || !data) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold mb-2">Failed to load repository</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Link href="/repos" className="text-primary hover:underline">
          ← Back to repositories
        </Link>
      </div>
    );
  }

  const { repository, snapshot, stats } = data;
  const indexedStatus = snapshot?.indexedStatus ?? 'pending';
  const isPending = indexedStatus === 'pending';
  const isIndexing = indexedStatus === 'indexing';
  const isFailed = indexedStatus === 'failed';

  // Pending / Indexing state
  if (isPending || isIndexing) {
    return (
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{repository.fullName}</h1>
          {repository.description && (
            <p className="text-muted-foreground mb-2">{repository.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {repository.language && <span>{repository.language}</span>}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-8 text-center mb-8">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {isPending ? 'Repository Imported' : 'Analyzing Repository'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {isPending
              ? 'Your repository has been queued for analysis. This typically takes 1-3 minutes.'
              : 'We are analyzing your codebase — extracting concepts, structure, and generating learning materials.'}
          </p>
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{stats.indexingProgress}%</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-700"
                style={{
                  width: `${Math.max(stats.indexingProgress, isPending ? 5 : 35)}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-40 pointer-events-none">
          {[
            { icon: MessageSquare, title: 'Chat Tutor', desc: 'Coming soon...', color: 'text-blue-600' },
            { icon: BookOpen, title: 'Learning Path', desc: 'Coming soon...', color: 'text-green-600' },
            { icon: Brain, title: 'Flashcards', desc: 'Coming soon...', color: 'text-purple-600' },
            { icon: FileCode, title: 'Quizzes', desc: 'Coming soon...', color: 'text-orange-600' },
            { icon: Trophy, title: 'Interview Mode', desc: 'Coming soon...', color: 'text-red-600' },
            { icon: Gamepad2, title: 'Mini-Games', desc: 'Coming soon...', color: 'text-teal-600' },
            { icon: GitBranch, title: 'Dependency Graph', desc: 'Coming soon...', color: 'text-indigo-600' },
          ].map((mod) => (
            <div key={mod.title} className="p-6 rounded-lg border bg-card">
              <mod.icon className={`h-8 w-8 ${mod.color} mb-4`} />
              <h3 className="font-semibold mb-1">{mod.title}</h3>
              <p className="text-sm text-muted-foreground">{mod.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Failed state
  if (isFailed) {
    return (
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{repository.fullName}</h1>
          {repository.description && (
            <p className="text-muted-foreground mb-2">{repository.description}</p>
          )}
        </div>

        <div className="rounded-lg border bg-destructive/10 p-8 text-center mb-8">
          <h2 className="text-xl font-semibold mb-2">Analysis Failed</h2>
          <p className="text-muted-foreground mb-4">
            Something went wrong during repository analysis. This can happen with very large
            repositories or if there was a network issue.
          </p>
          <button
            onClick={handleResync}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Completed state — existing full dashboard
  const modules = [
    {
      href: `/tutor/${params.repoId}`,
      icon: MessageSquare,
      title: 'Chat Tutor',
      description: 'Ask questions about the codebase',
      color: 'text-blue-600',
    },
    {
      href: `/study/${params.repoId}`,
      icon: BookOpen,
      title: 'Learning Path',
      description: `Step-by-step lessons (${stats.totalLessons} available)`,
      color: 'text-green-600',
    },
    {
      href: `/study/${params.repoId}/flashcards`,
      icon: Brain,
      title: 'Flashcards',
      description: `${stats.totalFlashcards} cards to review`,
      color: 'text-purple-600',
    },
    {
      href: `/study/${params.repoId}/quiz`,
      icon: FileCode,
      title: 'Quizzes',
      description: `${stats.totalQuizzes} quizzes available`,
      color: 'text-orange-600',
    },
    {
      href: `/interview/${params.repoId}`,
      icon: Trophy,
      title: 'Interview Mode',
      description: 'Test your understanding',
      color: 'text-red-600',
    },
    {
      href: `/study/${params.repoId}/games`,
      icon: Gamepad2,
      title: 'Mini-Games',
      description: 'Learn by playing',
      color: 'text-teal-600',
    },
    {
      href: `/dashboard/${params.repoId}/graph`,
      icon: GitBranch,
      title: 'Dependency Graph',
      description: 'Interactive code structure visualization',
      color: 'text-indigo-600',
    },
  ];

  return (
    <div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{repository.fullName}</h1>
        {repository.description && (
          <p className="text-muted-foreground mb-2">{repository.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {repository.language && <span>{repository.language}</span>}
          <span>Branch: {repository.defaultBranch}</span>
          <span>{stats.totalFiles} files analyzed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => (
          <Link
            key={mod.title}
            href={mod.href}
            className="p-6 rounded-lg border bg-card hover:shadow-md transition-shadow group"
          >
            <mod.icon className={`h-8 w-8 ${mod.color} mb-4`} />
            <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
              {mod.title}
            </h3>
            <p className="text-sm text-muted-foreground">{mod.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
