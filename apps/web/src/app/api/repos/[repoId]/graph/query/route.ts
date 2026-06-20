import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from '@codebase-learning/shared';

const execAsync = promisify(exec);

export async function GET(
  request: NextRequest,
  { params }: { params: { repoId: string } },
) {
  try {
    const q = request.nextUrl.searchParams.get('q');
    const budget = request.nextUrl.searchParams.get('budget') ?? '2000';
    if (!q) {
      return NextResponse.json({ success: false, error: 'Query parameter "q" required' }, { status: 400 });
    }

    const repo = await prisma.repository.findUnique({
      where: { id: params.repoId },
      include: { snapshots: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!repo || !repo.snapshots[0]) {
      return NextResponse.json({ success: false, error: 'Repository not found' }, { status: 404 });
    }

    const graphPath = repo.snapshots[0].graphJsonPath;
    if (!graphPath) {
      return NextResponse.json({ success: false, error: 'No knowledge graph available for this repository' }, { status: 404 });
    }

    const safeQ = q.replace(/"/g, '\\"');
    const { stdout } = await execAsync(
      `graphify query "${safeQ}" --budget ${budget} --graph "${graphPath}"`,
      { timeout: 15000 },
    );

    return NextResponse.json({ success: true, data: { query: q, result: stdout.trim() } });
  } catch (error: any) {
    if (error.killed) {
      return NextResponse.json({ success: false, error: 'Query timed out' }, { status: 504 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Query failed' }, { status: 500 });
  }
}
