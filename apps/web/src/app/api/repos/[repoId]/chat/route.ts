import { NextRequest, NextResponse } from 'next/server';
import { chatRequestSchema, prisma } from '@codebase-learning/shared';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(
  request: NextRequest,
  { params }: { params: { repoId: string } },
) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { message, threadId, mode } = parsed.data;
    const { repoId } = params;

    // TODO: In production, this would:
    // 1. Retrieve repository context from vector store
    // 2. Build grounded prompt with codebase context
    // 3. Call LLM for response
    // 4. Save message to TutorThread/TutorMessage
    // 5. Return with citations

    const mockThreadId = threadId ?? `thread_${Date.now()}`;

    // Try to get graph context for token-efficient answers
    let graphContext: string | null = null;
    try {
      const repo = await prisma.repository.findUnique({
        where: { id: repoId },
        include: { snapshots: { orderBy: { createdAt: 'desc' }, take: 1 } },
      });
      const gPath = repo?.snapshots[0]?.graphJsonPath;
      if (gPath) {
        const { stdout } = await execAsync(
          `graphify query "${message.replace(/"/g, '\\"')}" --budget 2000 --graph "${gPath}"`,
          { timeout: 10000 },
        );
        graphContext = stdout.trim();
      }
    } catch {
      // graph unavailable — fall through
    }

    return NextResponse.json({
      success: true,
      threadId: mockThreadId,
      message: {
        id: `msg_${Date.now()}`,
        threadId: mockThreadId,
        role: 'assistant',
        content: `This is a mock tutor response for repository \`${repoId}\`. In production, this would be a grounded answer based on the actual codebase analysis. Your question was: "${message}" (mode: ${mode ?? 'explain'}).`,
        citationsJson: [],
        createdAt: new Date().toISOString(),
      },
      graphContext,
      suggestedFollowups: [
        'What is the overall architecture?',
        'How does the data flow work?',
        'What are the main entry points?',
      ],
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat message' },
      { status: 500 },
    );
  }
}
