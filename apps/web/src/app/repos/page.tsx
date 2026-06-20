'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Github, Loader2 } from 'lucide-react';

export default function ReposPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/repos/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import repository');
      }

      if (data.repoId) {
        router.push(`/dashboard/${data.repoId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Add Repository</h1>
      <p className="text-muted-foreground mb-8">
        Import a public GitHub repository to start learning its codebase.
      </p>

      {/* Public URL Import */}
      <div className="rounded-lg border bg-card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Import from Public URL</h2>
        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label htmlFor="repo-url" className="block text-sm font-medium mb-2">
              GitHub Repository URL
            </label>
            <input
              id="repo-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={loading}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {loading ? 'Importing...' : 'Import Repository'}
          </button>
        </form>
      </div>

      {/* GitHub Connect */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Connect GitHub Account</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your GitHub account to access private repositories and keep learning
          content in sync.
        </p>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-accent transition-colors">
          <Github className="h-4 w-4" />
          Connect GitHub
        </button>
      </div>
    </div>
  );
}
