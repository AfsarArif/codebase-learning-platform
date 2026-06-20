import Link from 'next/link';
import { ArrowRight, BookOpen, Brain, Code2, FileSearch, Gamepad2, MessageSquare, Zap } from 'lucide-react';

const features = [
  {
    icon: FileSearch,
    title: 'Codebase Analysis',
    description: 'Deep structural and semantic analysis of any GitHub repository.',
  },
  {
    icon: BookOpen,
    title: 'Learning Paths',
    description: 'Step-by-step curriculum generated from real code, not generic tutorials.',
  },
  {
    icon: MessageSquare,
    title: 'Repository Tutor',
    description: 'Ask questions and get answers grounded in the actual codebase with file references.',
  },
  {
    icon: Brain,
    title: 'Flashcards & Quizzes',
    description: 'Auto-generated study materials tailored to the repository architecture.',
  },
  {
    icon: Gamepad2,
    title: 'Mini-Games',
    description: 'Learn by playing: file matching, request ordering, architecture reveal.',
  },
  {
    icon: Zap,
    title: 'Interview Prep',
    description: 'Simulated technical interviews with questions about the specific codebase.',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Understand Any Codebase
          <br />
          <span className="text-primary">in Minutes, Not Months</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Paste a GitHub URL and get an AI-powered interactive learning experience built
          from the actual code. Step-by-step lessons, chat tutor, flashcards, quizzes, and
          interview practice — all grounded in real repository code.
        </p>

        {/* URL Input */}
        <div className="max-w-xl mx-auto flex gap-3">
          <input
            type="url"
            placeholder="https://github.com/owner/repo"
            className="flex-1 px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Link
            href="/repos"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Start Learning
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          No sign-in required for public repositories
        </p>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything You Need to Master a Codebase
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow"
            >
              <feature.icon className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-secondary/50 rounded-2xl px-8 mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { step: '1', title: 'Connect a Repo', description: 'Paste a public GitHub URL or connect your GitHub account for private repos.' },
            { step: '2', title: 'Analysis & Indexing', description: 'Our engine parses the codebase, builds a knowledge graph, and generates learning content.' },
            { step: '3', title: 'Learn Interactively', description: 'Follow lessons, chat with the tutor, practice with flashcards, and test yourself.' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-16">
        <h2 className="text-3xl font-bold mb-4">Ready to learn your codebase?</h2>
        <p className="text-muted-foreground mb-8">
          Start with any public GitHub repository. No account needed.
        </p>
        <Link
          href="/repos"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-primary text-primary-foreground font-medium text-lg hover:opacity-90 transition-opacity"
        >
          <Code2 className="h-5 w-5" />
          Get Started Free
        </Link>
      </section>
    </div>
  );
}
