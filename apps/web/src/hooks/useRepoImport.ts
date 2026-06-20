'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function useRepoImport() {
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
      } else {
        throw new Error('Import succeeded but no repository ID returned');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return { url, setUrl, loading, error, handleImport };
}
