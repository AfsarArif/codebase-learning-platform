import { prisma } from '@codebase-learning/shared';

export async function getTier(
  userId: string,
): Promise<{ tier: string; credits: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, credits: true },
  });
  return { tier: user?.tier ?? 'free', credits: user?.credits ?? 3 };
}

export async function checkAndDeductCredits(
  userId: string,
  action: string,
  cost: number,
): Promise<{ allowed: boolean; remaining: number; usedOwnKey: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, credits: true },
  });
  if (!user) return { allowed: false, remaining: 0, usedOwnKey: false };

  const tier = user.tier;
  const credits = user.credits;

  // Check if user has their own API key configured
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const hasOwnKey =
    settings &&
    ((settings.llmProvider === 'openai' && settings.openaiApiKey) ||
      (settings.llmProvider === 'anthropic' && settings.anthropicApiKey) ||
      (settings.llmProvider === 'deepseek' && settings.deepseekApiKey));

  // Free tier: only block on repo_import (3 repos max)
  if (tier === 'free') {
    if (action === 'repo_import') {
      const repoCount = await prisma.repository.count({
        where: { createdByUserId: userId },
      });
      if (repoCount >= 3) {
        return { allowed: false, remaining: 0, usedOwnKey: false };
      }
    }
    // Free tier: track usage but always allow non-import actions
    await recordUsage(userId, action, 0, hasOwnKey, { tier: 'free' });
    return { allowed: true, remaining: 3 - (action === 'repo_import' ? 1 : 0), usedOwnKey: hasOwnKey };
  }

  // Premium tier: deduct credits
  // Own-key users skip credit deduction for LLM actions (chat, interview)
  const llmActions = ['chat_message', 'interview_session'];
  if (hasOwnKey && llmActions.includes(action)) {
    await recordUsage(userId, action, 0, true, { tier: 'premium', note: 'own key' });
    return { allowed: true, remaining: credits, usedOwnKey: true };
  }

  if (credits < cost) {
    return { allowed: false, remaining: credits, usedOwnKey: hasOwnKey };
  }

  // Atomic deduction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: cost } },
    }),
    prisma.usageRecord.create({
      data: {
        userId,
        action,
        creditsUsed: cost,
        usedOwnKey: hasOwnKey,
        metadata: { tier: 'premium' },
      },
    }),
  ]);

  return { allowed: true, remaining: credits - cost, usedOwnKey: hasOwnKey };
}

export async function recordUsage(
  userId: string,
  action: string,
  creditsUsed: number,
  usedOwnKey: boolean,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await prisma.usageRecord.create({
    data: { userId, action, creditsUsed, usedOwnKey, metadata: metadata ?? {} },
  });
}
