import { NextRequest, NextResponse } from 'next/server';
import { prisma, dispatchCeleryTask } from '@codebase-learning/shared';
import { GitHubUrlParser } from '@codebase-learning/github';

export async function POST(
  request: NextRequest,
  { params }: { params: { repoId: string } },
) {
  try {
    const body = await request.json();
    const { force, branch } = body;

    const repository = await prisma.repository.findUnique({
      where: { id: params.repoId },
    });

    if (!repository) {
      return NextResponse.json(
        { success: false, error: 'Repository not found' },
        { status: 404 },
      );
    }

    // Create new snapshot
    const snapshot = await prisma.repositorySnapshot.create({
      data: {
        repositoryId: repository.id,
        commitSha: 'pending',
        branch: branch ?? repository.defaultBranch,
        indexedStatus: 'pending',
      },
    });

    // Dispatch re-index task
    dispatchCeleryTask({
      task: 'src.tasks.indexing.resync_repository',
      args: [
        repository.id,
        repository.cloneUrl ?? GitHubUrlParser.buildCloneUrl(repository.owner, repository.name),
        repository.owner,
        repository.name,
        repository.defaultBranch,
        force ?? false,
      ],
      kwargs: { snapshot_id: snapshot.id },
    }).catch((err) => {
      console.error('Failed to dispatch resync task:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Resync initiated',
      data: { repoId: params.repoId, snapshotId: snapshot.id },
    });
  } catch (error) {
    console.error('Resync error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resync repository' },
      { status: 500 },
    );
  }
}
