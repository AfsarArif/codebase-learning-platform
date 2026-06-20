'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { BookOpen, Github, User, LogOut, Coins, CreditCard } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

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
            <Link
              href="/pricing"
              className={`text-sm ${
                pathname?.startsWith('/pricing')
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pricing
            </Link>
            <Link
              href="/settings"
              className={`text-sm ${
                pathname?.startsWith('/settings')
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Settings
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              {/* Credit badge */}
              <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                <Coins className="h-3 w-3" />
                {(session.user as Record<string, unknown>).credits as number ?? 0} credits
              </span>

              {/* Tier badge */}
              <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                <CreditCard className="h-3 w-3" />
                {(session.user as Record<string, unknown>).tier as string ?? 'free'}
              </span>

              {/* User menu */}
              <span className="text-sm hidden sm:inline text-muted-foreground">
                {session.user?.name || session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-1 px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm text-muted-foreground"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
              >
                Sign Up
              </Link>
              <button
                onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-accent transition-colors"
              >
                <Github className="h-4 w-4" />
                <span className="text-sm">GitHub</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
