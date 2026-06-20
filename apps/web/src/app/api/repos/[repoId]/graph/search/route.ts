import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { prisma } from '@codebase-learning/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: { repoId: string } },
) {
  try {
    const relation = request.nextUrl.searchParams.get('relation');
    const target = request.nextUrl.searchParams.get('target');

    const repo = await prisma.repository.findUnique({
      where: { id: params.repoId },
      include: { snapshots: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!repo?.snapshots[0]?.graphJsonPath) {
      return NextResponse.json({ success: false, error: 'No knowledge graph available' }, { status: 404 });
    }

    const raw = await readFile(repo.snapshots[0].graphJsonPath, 'utf-8');
    const graph = JSON.parse(raw);
    const nodes = graph.nodes || [];
    const links = graph.links || [];

    // Filter edges by relation type and/or target name pattern
    let matchedEdges = links;
    if (relation) {
      matchedEdges = matchedEdges.filter(
        (l: any) => (l.relation || '').toLowerCase().includes(relation.toLowerCase()),
      );
    }
    if (target) {
      matchedEdges = matchedEdges.filter(
        (l: any) =>
          (l.target || '').toLowerCase().includes(target.toLowerCase()),
      );
    }

    // Collect source nodes of matched edges
    const matchedNodeIds = new Set<string>();
    matchedEdges.forEach((l: any) => {
      matchedNodeIds.add(l.source);
      matchedNodeIds.add(l.target);
    });

    const matchedNodes = nodes.filter((n: any) => matchedNodeIds.has(n.id));

    return NextResponse.json({
      success: true,
      data: {
        query: { relation, target },
        matchedNodes: matchedNodes.length,
        matchedEdges: matchedEdges.length,
        nodes: matchedNodes,
        edges: matchedEdges,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Search failed' }, { status: 500 });
  }
}
