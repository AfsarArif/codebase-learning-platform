'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Github, User } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <BookOpen className="h-6 w-6 text-primary" />
            <span>CodebaseLearn</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className={`text-sm ${
                pathname?.startsWith('/dashboard')
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/repos"
              className={`text-sm ${
                pathname?.startsWith('/repos')
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Repositories
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-accent transition-colors">
            <Github className="h-4 w-4" />
            <span className="text-sm hidden sm:inline">Connect GitHub</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors">
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
