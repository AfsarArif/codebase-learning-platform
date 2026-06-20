import { NextRequest, NextResponse } from 'next/server';
import { GitHubUrlParser, GitHubApiClient } from '@codebase-learning/github';
import { prisma, importRepoUrlSchema } from '@codebase-learning/shared';
import { rateLimit } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 imports per minute per IP
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
    const { allowed, remaining, resetAt } = rateLimit({
      key: `import:${ip}`,
      limit: 10,
      windowMs: 60_000,
    });

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) },
        },
      );
    }

    const body = await request.json();

    // Zod validation
    const validationResult = importRepoUrlSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0]?.message ?? 'Invalid request body' },
        { status: 400 },
      );
    }
    const { url, branch } = validationResult.data;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Repository URL is required' },
        { status: 400 },
      );
    }

    // Parse and validate the GitHub URL
    const parsed = GitHubUrlParser.parse(url);
    if (!parsed) {
      return NextResponse.json(
        { success: false, error: 'Invalid GitHub repository URL' },
        { status: 400 },
      );
    }

    const { owner, repo } = parsed;
    const fullName = `${owner}/${repo}`;
    const targetBranch = branch ?? parsed.branch ?? 'main';

    // Check if repo already exists in DB (uses findUnique thanks to @unique on fullName)
    const existingRepo = await prisma.repository.findUnique({
      where: { fullName },
      include: {
        snapshots: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (existingRepo) {
      return NextResponse.json({
        success: true,
        repoId: existingRepo.id,
        data: {
          owner,
          repo,
          fullName,
          branch: targetBranch,
          message: 'Repository already imported.',
        },
      });
    }

    // Fetch metadata from GitHub API
    let metadata;
    try {
      const githubClient = new GitHubApiClient();
      metadata = await githubClient.getRepoMetadata(owner, repo);
    } catch (ghError) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Repository not found or inaccessible on GitHub. If this is a private repository, connect your GitHub account first.',
        },
        { status: 404 },
      );
    }

    // Create Repository record with real CUID
    const repository = await prisma.repository.create({
      data: {
        owner,
        name: repo,
        fullName,
        sourceType: 'public_url',
        githubRepoId: metadata.id,
        defaultBranch: metadata.defaultBranch,
        visibility: metadata.visibility,
        cloneUrl: metadata.cloneUrl,
        description: metadata.description,
        language: metadata.language,
        topics: metadata.topics,
      },
    });

    // Create RepositorySnapshot
    const snapshot = await prisma.repositorySnapshot.create({
      data: {
        repositoryId: repository.id,
        commitSha: 'pending',
        branch: targetBranch,
        indexedStatus: 'pending',
      },
    });

    // Snapshot is created with indexedStatus="pending"
    // The DB-polling worker (polling_worker.py) will pick it up automatically
    console.log(`[import] Snapshot created: ${snapshot.id} for ${fullName} (status: pending)`);
    console.log(`[import] Polling worker will detect and process within ~${5}s`);

    return NextResponse.json({
      success: true,
      repoId: repository.id,
      data: {
        owner,
        repo,
        fullName,
        branch: targetBranch,
        message: 'Repository import initiated. Analysis will begin shortly.',
      },
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import repository' },
      { status: 500 },
    );
  }
}
