'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [provider, setProvider] = useState('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [currentProvider, setCurrentProvider] = useState<string | null>(null);
  const [maskedKey, setMaskedKey] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setProvider(d.data.llmProvider);
          setCurrentProvider(d.data.llmProvider);
          setMaskedKey(d.data.maskedKey);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          llmProvider: provider,
          apiKey: apiKey || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ Settings saved. Keys are encrypted at rest.');
        setCurrentProvider(provider);
        setMaskedKey(apiKey ? apiKey.slice(0, 4) + '...' + apiKey.slice(-4) : null);
        setApiKey('');
      } else {
        setMessage('❌ ' + (data.error || 'Failed to save'));
      }
    } catch {
      setMessage('❌ Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-muted-foreground mb-8">
        Configure your LLM provider and API keys. Keys are encrypted with AES-256-GCM before
        storage.
      </p>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">LLM Configuration</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background"
            >
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="openai">OpenAI (GPT)</option>
              <option value="deepseek">DeepSeek</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                maskedKey ? `Currently saved: ${maskedKey}` : 'Enter your API key'
              }
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              <Shield className="h-3 w-3 inline mr-1" />
              Keys are encrypted with AES-256-GCM before storage.
            </p>
          </div>

          {currentProvider && currentProvider !== provider && (
            <p className="text-sm text-amber-600">
              Switching from {currentProvider} to {provider}. Enter your {provider} API key
              above.
            </p>
          )}

          {message && (
            <p
              className={`text-sm ${
                message.startsWith('✅') ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
