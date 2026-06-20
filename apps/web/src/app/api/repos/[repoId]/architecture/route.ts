import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@codebase-learning/shared';
import { readFile } from 'fs/promises';

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

    // Load graph data if available
    let graphData = null;
    let communities: { name: string; count: number; id: number }[] = [];
    let godNodes: { id: string; label: string; degree: number }[] = [];
    let graphAvailable = false;

    if (snapshot?.graphJsonPath) {
      try {
        const raw = await readFile(snapshot.graphJsonPath, 'utf-8');
        graphData = JSON.parse(raw);
        graphAvailable = true;

        // Communities
        const communityMap = new Map<number, { name: string; count: number }>();
        (graphData.nodes || []).forEach((n: any) => {
          const c = n.community ?? 0;
          if (!communityMap.has(c)) {
            communityMap.set(c, { name: n.community_name || `Module ${c}`, count: 0 });
          }
          communityMap.get(c)!.count++;
        });
        communities = Array.from(communityMap.entries()).map(([id, val]) => ({ id, ...val }));

        // God nodes (top 5 by degree)
        const degree = new Map<string, number>();
        (graphData.links || []).forEach((l: any) => {
          degree.set(l.source, (degree.get(l.source) || 0) + 1);
          degree.set(l.target, (degree.get(l.target) || 0) + 1);
        });
        godNodes = Array.from(degree.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([id, deg]) => {
            const node = (graphData.nodes || []).find((n: any) => n.id === id);
            return { id, label: node?.label || id, degree: deg };
          });
      } catch {
        // graph file missing or corrupt
      }
    }

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
        graphData,
        graphAvailable,
        communities,
        godNodes,
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
