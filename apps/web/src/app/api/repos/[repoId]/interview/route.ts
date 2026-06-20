import { NextRequest, NextResponse } from 'next/server';
import { interviewStartSchema } from '@codebase-learning/shared';

export async function POST(
  request: NextRequest,
  { params }: { params: { repoId: string } },
) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = interviewStartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid interview configuration', details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { mode, difficulty, questionCount } = parsed.data;
    const { repoId } = params;

    // TODO: In production, this would:
    // 1. Create an Interview record
    // 2. Query the concept graph for relevant concepts
    // 3. Generate interview questions using the LLM
    // 4. Return the first question

    const count = questionCount ?? 5;
    const mockQuestions = Array.from({ length: count }, (_, i) => ({
      id: `q_${Date.now()}_${i}`,
      questionType: i === 0 ? 'basic' : i < 3 ? 'intermediate' : 'advanced',
      promptText: `Sample ${mode} question ${i + 1} about the ${repoId} codebase. In production, this would be a real question grounded in the repository's code and architecture.`,
      difficulty: difficulty ?? 'intermediate',
      tags: ['architecture', 'api'],
      sourceFiles: ['src/index.ts', 'src/app.ts'],
      orderIndex: i,
    }));

    return NextResponse.json({
      success: true,
      interviewId: `interview_${Date.now()}`,
      data: {
        id: `interview_${Date.now()}`,
        mode,
        difficulty,
        status: 'in_progress',
        questions: mockQuestions,
      },
    });
  } catch (error) {
    console.error('Interview start error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start interview' },
      { status: 500 },
    );
  }
}
