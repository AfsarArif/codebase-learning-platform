import { NextRequest, NextResponse } from 'next/server';
import { interviewAnswerSchema } from '@codebase-learning/shared';

export async function POST(
  request: NextRequest,
  { params }: { params: { repoId: string } },
) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = interviewAnswerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid answer submission', details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { questionId, answer } = parsed.data;

    // TODO: In production, this would:
    // 1. Fetch the question and reference answer
    // 2. Call the LLM evaluator to score the answer
    // 3. Save InterviewResponse
    // 4. Update Interview.currentQuestionIndex
    // 5. Update ConceptMasteryMetrics
    // 6. Return score, feedback, and next question (if any)

    // Mock scoring
    const score = Math.floor(Math.random() * 40) + 60; // 60-100
    const isCorrect = score >= 60;

    return NextResponse.json({
      success: true,
      score,
      isCorrect,
      feedback: isCorrect
        ? 'Good answer! You demonstrated solid understanding of the concept. Consider reviewing the specific implementation details in the source files for even deeper knowledge.'
        : 'Your answer needs more detail. Review the relevant source files and try again. Focus on the specific implementation patterns used in this codebase.',
      suggestedReview: isCorrect
        ? []
        : ['src/index.ts', 'src/app.ts'],
    });
  } catch (error) {
    console.error('Interview answer error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process answer' },
      { status: 500 },
    );
  }
}
