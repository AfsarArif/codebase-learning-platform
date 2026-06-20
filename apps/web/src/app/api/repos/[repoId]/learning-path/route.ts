import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@codebase-learning/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: { repoId: string } },
) {
  try {
    const { repoId } = params;

    // Fetch lessons from the latest snapshot
    const repository = await prisma.repository.findUnique({
      where: { id: repoId },
      include: {
        snapshots: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
              include: {
                resources: true,
                concept: {
                  select: { id: true, name: true, description: true },
                },
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

    const snapshot = repository.snapshots[0];
    const lessons = snapshot?.lessons ?? [];

    const totalMinutes = lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0);
    const tracks = [...new Set(lessons.map((l) => l.track).filter(Boolean))];

    return NextResponse.json({
      success: true,
      data: {
        id: `path_${repoId}`,
        title: `Learning ${repository.fullName}`,
        description: `Step-by-step guide to understanding the ${repository.fullName} codebase.`,
        repositoryId: repoId,
        tracks,
        lessons: lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          orderIndex: lesson.orderIndex,
          difficulty: lesson.difficulty,
          estimatedMinutes: lesson.estimatedMinutes,
          track: lesson.track,
          concept: lesson.concept
            ? {
                id: lesson.concept.id,
                name: lesson.concept.name,
                description: lesson.concept.description,
              }
            : null,
          resources: lesson.resources.map((r) => ({
            id: r.id,
            type: r.resourceType,
            ref: r.resourceRef,
            title: r.displayTitle,
          })),
        })),
        estimatedTotalMinutes: totalMinutes,
      },
    });
  } catch (error) {
    console.error('Learning path error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load learning path' },
      { status: 500 },
    );
  }
}
