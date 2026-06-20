import { NextRequest, NextResponse } from 'next/server';
import { prisma, encrypt, decrypt } from '@codebase-learning/shared';
import { getSessionUser } from '@/lib/session';
import { z } from 'zod';

const settingsSchema = z.object({
  llmProvider: z.enum(['anthropic', 'openai', 'deepseek']).optional(),
  apiKey: z.string().min(1).max(500).optional(),
});

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings) {
      return NextResponse.json({ success: true, data: null });
    }

    let maskedKey: string | null = null;
    try {
      let rawKey: string | null = null;
      if (settings.llmProvider === 'openai' && settings.openaiApiKey)
        rawKey = await decrypt(settings.openaiApiKey);
      else if (settings.llmProvider === 'anthropic' && settings.anthropicApiKey)
        rawKey = await decrypt(settings.anthropicApiKey);
      else if (settings.llmProvider === 'deepseek' && settings.deepseekApiKey)
        rawKey = await decrypt(settings.deepseekApiKey);

      if (rawKey) maskedKey = rawKey.slice(0, 4) + '...' + rawKey.slice(-4);
    } catch {
      // decryption failed
    }

    return NextResponse.json({
      success: true,
      data: { llmProvider: settings.llmProvider, maskedKey },
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid settings', details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { llmProvider, apiKey } = parsed.data;
    const updateData: Record<string, string> = {};

    if (llmProvider) updateData.llmProvider = llmProvider;
    if (apiKey && llmProvider) {
      const encryptedKey = await encrypt(apiKey);
      if (llmProvider === 'openai') updateData.openaiApiKey = encryptedKey;
      else if (llmProvider === 'anthropic') updateData.anthropicApiKey = encryptedKey;
      else if (llmProvider === 'deepseek') updateData.deepseekApiKey = encryptedKey;
    }

    await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...updateData },
      update: updateData,
    });

    return NextResponse.json({ success: true, data: { message: 'Settings saved' } });
  } catch (error) {
    console.error('Settings save error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}
