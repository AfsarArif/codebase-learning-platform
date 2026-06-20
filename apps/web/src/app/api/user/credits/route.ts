import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@codebase-learning/shared';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tier: true, credits: true },
    });

    const recentUsage = await prisma.usageRecord.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: {
        tier: dbUser?.tier ?? 'free',
        credits: dbUser?.credits ?? 3,
        recentUsage: recentUsage.map((r) => ({
          action: r.action,
          creditsUsed: r.creditsUsed,
          usedOwnKey: r.usedOwnKey,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Credits error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load credits' }, { status: 500 });
  }
}
