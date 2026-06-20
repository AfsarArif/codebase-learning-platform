'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Loader2, Send, FileCode, Brain } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{
    file: string;
    symbol?: string;
    lineStart?: number;
    lineEnd?: number;
    relevance: string;
  }>;
}

type TutorMode = 'explain' | 'beginner' | 'advanced' | 'quiz';

export default function TutorPage({ params }: { params: { repoId: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<TutorMode>('explain');
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`/api/repos/${params.repoId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          threadId,
          mode,
        }),
      });

      const data = await res.json();

      if (data.threadId) setThreadId(data.threadId);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message?.content ?? data.data?.content ?? 'Sorry, I could not process that.',
          citations: data.message?.citationsJson ?? data.data?.citations,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const modes: { value: TutorMode; label: string }[] = [
    { value: 'explain', label: 'Explain' },
    { value: 'beginner', label: 'Simple' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'quiz', label: 'Quiz Me' },
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/dashboard/${params.repoId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                mode === m.value
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-background'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 rounded-lg border bg-card p-4">
        {messages.length === 0 && (
          <div className="text-center py-20">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Repository Tutor</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Ask me anything about this codebase. I can explain architecture, walk
              through flows, or quiz you on concepts.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                'What does this project do?',
                'How is the architecture structured?',
                'Walk me through the authentication flow',
                'What are the main API routes?',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="px-3 py-1.5 text-xs rounded-full border hover:bg-accent transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  {msg.citations.map((c, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <FileCode className="h-3 w-3" />
                      <span>{c.file}</span>
                      {c.lineStart && <span>:{c.lineStart}</span>}
                      <span className="opacity-60">({c.relevance})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question about this codebase..."
          className="flex-1 px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
}
