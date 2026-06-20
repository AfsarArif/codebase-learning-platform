import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { prisma } from '@codebase-learning/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: { repoId: string } },
) {
  try {
    const repo = await prisma.repository.findUnique({
      where: { id: params.repoId },
      include: { snapshots: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!repo?.snapshots[0]?.graphJsonPath) {
      return NextResponse.json({ success: false, error: 'No knowledge graph available' }, { status: 404 });
    }

    const raw = await readFile(repo.snapshots[0].graphJsonPath, 'utf-8');
    const graph = JSON.parse(raw);
    const nodes: any[] = graph.nodes || [];
    const links: any[] = graph.links || [];

    // Degree computation
    const inDegree = new Map<string, number>();
    const outDegree = new Map<string, number>();
    links.forEach((l: any) => {
      outDegree.set(l.source, (outDegree.get(l.source) || 0) + 1);
      inDegree.set(l.target, (inDegree.get(l.target) || 0) + 1);
    });

    const allNodeIds = new Set<string>();
    nodes.forEach((n: any) => allNodeIds.add(n.id));
    links.forEach((l: any) => { allNodeIds.add(l.source); allNodeIds.add(l.target); });

    const degreeList = Array.from(allNodeIds).map((id) => ({
      id,
      label: nodes.find((n: any) => n.id === id)?.label || id,
      inDegree: inDegree.get(id) || 0,
      outDegree: outDegree.get(id) || 0,
      total: (inDegree.get(id) || 0) + (outDegree.get(id) || 0),
    }));

    // God nodes (top 10 by degree)
    const godNodes = degreeList.sort((a, b) => b.total - a.total).slice(0, 10);

    // High fan-in (heavily depended on, top 5)
    const highFanIn = [...degreeList].sort((a, b) => b.inDegree - a.inDegree).slice(0, 5);

    // High fan-out (depends on many, top 5)
    const highFanOut = [...degreeList].sort((a, b) => b.outDegree - a.outDegree).slice(0, 5);

    // Orphan nodes (no edges at all)
    const orphans = degreeList.filter((d) => d.total === 0).slice(0, 20);

    // Community stats
    const communityMap = new Map<number, { name: string; count: number }>();
    nodes.forEach((n: any) => {
      const c = n.community ?? -1;
      if (!communityMap.has(c)) {
        communityMap.set(c, { name: n.community_name || `Module ${c}`, count: 0 });
      }
      communityMap.get(c)!.count++;
    });

    return NextResponse.json({
      success: true,
      data: {
        totalNodes: nodes.length,
        totalEdges: links.length,
        communities: Array.from(communityMap.entries()).map(([id, val]) => ({ id, ...val })),
        godNodes,
        highFanIn,
        highFanOut,
        orphans: orphans.map((o) => ({ id: o.id, label: o.label })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Insights failed' }, { status: 500 });
  }
}
