import { NextRequest, NextResponse } from 'next/server';
import { chatRequestSchema } from '@codebase-learning/shared';

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
