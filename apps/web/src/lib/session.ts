import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface SessionUser {
  id: string;
  email: string;
  tier: string;
  credits: number;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const user = session.user as Record<string, unknown>;
  return {
    id: user.id as string,
    email: user.email as string,
    tier: (user.tier as string) ?? 'free',
    credits: (user.credits as number) ?? 3,
  };
}
