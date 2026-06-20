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
    const node = request.nextUrl.searchParams.get('node');
    if (!node) {
      return NextResponse.json({ success: false, error: 'Parameter "node" required' }, { status: 400 });
    }

    const repo = await prisma.repository.findUnique({
      where: { id: params.repoId },
      include: { snapshots: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!repo?.snapshots[0]?.graphJsonPath) {
      return NextResponse.json({ success: false, error: 'No knowledge graph available' }, { status: 404 });
    }

    const { stdout } = await execAsync(
      `graphify explain "${node.replace(/"/g, '\\"')}" --graph "${repo.snapshots[0].graphJsonPath}"`,
      { timeout: 15000 },
    );

    return NextResponse.json({ success: true, data: { node, explanation: stdout.trim() } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Explain failed' }, { status: 500 });
  }
}
