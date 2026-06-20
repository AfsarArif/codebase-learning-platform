import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@codebase-learning/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: { repoId: string } },
) {
  try {
    const { repoId } = params;

    // Fetch repository with latest snapshot concepts
    const repository = await prisma.repository.findUnique({
      where: { id: repoId },
      include: {
        snapshots: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            concepts: {
              include: {
                fromRelations: true,
                toRelations: true,
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
    const concepts = snapshot?.concepts ?? [];
    const relations = concepts.flatMap((c) => [...c.fromRelations, ...c.toRelations]);

    return NextResponse.json({
      success: true,
      data: {
        projectPurpose: repository.description ?? 'No description available.',
        techStack: {
          languages: repository.language ? [repository.language] : [],
          frameworks: [],
          buildTools: [],
          packageManager: 'unknown',
          databases: [],
          deployment: [],
        },
        architecture: {
          style: 'Repository under analysis',
          description: `Architecture analysis for ${repository.fullName}. ${concepts.length} concepts identified.`,
          serviceBoundaries: concepts.map((c) => c.name),
        },
        dataFlow: {
          description: 'Data flow analysis in progress.',
          steps: [],
        },
        keyComponents: concepts.map((c) => ({
          name: c.name,
          responsibility: c.description,
          path: c.name.toLowerCase(),
          keyFiles: [],
          dependencies: [],
        })),
        entryPoints: [],
        concepts: concepts.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.conceptType,
          description: c.description,
          difficulty: c.difficulty,
          tags: c.tags,
          relations: relations
            .filter((r) => r.fromConceptId === c.id || r.toConceptId === c.id)
            .map((r) => ({
              type: r.relationType,
              fromId: r.fromConceptId,
              toId: r.toConceptId,
            })),
        })),
      },
    });
  } catch (error) {
    console.error('Architecture error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load architecture' },
      { status: 500 },
    );
  }
}
