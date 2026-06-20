import Link from 'next/link';
import { BookOpen, Brain, MessageSquare, Trophy } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Learning Dashboard</h1>
        <Link
          href="/repos"
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          Add Repository
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: BookOpen, label: 'Repositories', value: '0' },
          { icon: Brain, label: 'Lessons Completed', value: '0' },
          { icon: MessageSquare, label: 'Chat Threads', value: '0' },
          { icon: Trophy, label: 'Interview Score', value: '--' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-lg border bg-card">
            <stat.icon className="h-5 w-5 text-muted-foreground mb-2" />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Repositories */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Repositories</h2>
        <div className="rounded-lg border bg-card p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No repositories yet</h3>
          <p className="text-muted-foreground mb-4">
            Add a GitHub repository URL or connect your GitHub account to get started.
          </p>
          <Link
            href="/repos"
            className="inline-flex px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          >
            Add Your First Repository
          </Link>
        </div>
      </div>
    </div>
  );
}
