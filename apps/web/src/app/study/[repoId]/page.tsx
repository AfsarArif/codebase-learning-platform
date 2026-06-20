'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Loader2, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Lesson {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  difficulty: string;
  estimatedMinutes: number;
  track?: string;
}

export default function StudyPage({ params }: { params: { repoId: string } }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLessons() {
      try {
        const res = await fetch(`/api/repos/${params.repoId}/learning-path`);
        const data = await res.json();
        setLessons(data.data?.lessons ?? data.lessons ?? []);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchLessons();
  }, [params.repoId]);

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/dashboard/${params.repoId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-2">Learning Path</h1>
      <p className="text-muted-foreground mb-8">
        Step-by-step lessons generated from the codebase structure.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-20 rounded-lg border bg-card">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No lessons yet</h3>
          <p className="text-muted-foreground">
            Lessons are generated after repository analysis completes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow cursor-pointer"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{lesson.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{lesson.description}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="px-2 py-0.5 rounded-full bg-secondary">
                  {lesson.difficulty}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lesson.estimatedMinutes}m
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
