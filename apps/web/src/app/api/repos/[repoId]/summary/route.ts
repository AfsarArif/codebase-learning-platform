import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@codebase-learning/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: { repoId: string } },
) {
  try {
    const { repoId } = params;

    // Fetch repository from the database
    const repository = await prisma.repository.findUnique({
      where: { id: repoId },
      include: {
        snapshots: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            _count: {
              select: {
                files: true,
                concepts: true,
                lessons: true,
                flashcards: true,
                quizzes: true,
              },
            },
          },
        },
      },
    });

    if (!repository) {
      return NextResponse.json(
        { success: false, error: 'Repository not found' },
        { status: 404 },
      );
    }

    const latestSnapshot = repository.snapshots[0];
    const counts = latestSnapshot?._count ?? {
      files: 0,
      concepts: 0,
      lessons: 0,
      flashcards: 0,
      quizzes: 0,
    };

    const indexingProgress =
      latestSnapshot?.indexedStatus === 'completed'
        ? 100
        : latestSnapshot?.indexedStatus === 'indexing'
          ? 50
          : 0;

    return NextResponse.json({
      success: true,
      data: {
        repository: {
          id: repository.id,
          fullName: repository.fullName,
          description: repository.description,
          language: repository.language,
          defaultBranch: repository.defaultBranch,
          visibility: repository.visibility,
          sourceType: repository.sourceType,
          topics: repository.topics,
          currentCommitSha: repository.currentCommitSha,
          createdAt: repository.createdAt,
          updatedAt: repository.updatedAt,
        },
        snapshot: latestSnapshot
          ? {
              id: latestSnapshot.id,
              commitSha: latestSnapshot.commitSha,
              branch: latestSnapshot.branch,
              indexedStatus: latestSnapshot.indexedStatus,
              createdAt: latestSnapshot.createdAt,
            }
          : null,
        stats: {
          totalFiles: counts.files,
          totalConcepts: counts.concepts,
          totalLessons: counts.lessons,
          totalFlashcards: counts.flashcards,
          totalQuizzes: counts.quizzes,
          indexingProgress,
        },
      },
    });
  } catch (error) {
    console.error('Summary error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load repository summary' },
      { status: 500 },
    );
  }
}
