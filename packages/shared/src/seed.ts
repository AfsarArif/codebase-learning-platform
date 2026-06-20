/**
 * Database seed script for local development and demo.
 *
 * Seeds:
 * - Demo user
 * - Sample public repositories
 * - Sample repository snapshots
 * - Sample concepts and lessons
 * - Sample flashcards and quizzes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Demo User ─────────────────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      avatarUrl: null,
      authProvider: 'github',
      githubUserId: 12345,
    },
  });
  console.log('Created demo user:', user.email);

  // ─── Sample Repositories ───────────────────────────────────────────────
  const repos = [
    {
      owner: 'expressjs',
      name: 'express',
      fullName: 'expressjs/express',
      description: 'Fast, unopinionated, minimalist web framework for Node.js',
      sourceType: 'public_url' as const,
      defaultBranch: 'master',
      visibility: 'public' as const,
      language: 'JavaScript',
      topics: ['web', 'framework', 'nodejs', 'server'],
      cloneUrl: 'https://github.com/expressjs/express.git',
      createdByUserId: user.id,
    },
    {
      owner: 'django',
      name: 'django',
      fullName: 'django/django',
      description: 'The Web framework for perfectionists with deadlines',
      sourceType: 'public_url' as const,
      defaultBranch: 'main',
      visibility: 'public' as const,
      language: 'Python',
      topics: ['web', 'framework', 'python', 'orm'],
      cloneUrl: 'https://github.com/django/django.git',
      createdByUserId: user.id,
    },
  ];

  for (const repo of repos) {
    const created = await prisma.repository.upsert({
      where: { id: `repo_${repo.owner}_${repo.name}` },
      update: repo,
      create: {
        id: `repo_${repo.owner}_${repo.name}`,
        ...repo,
      },
    });

    // Create a snapshot for each
    const snapshot = await prisma.repositorySnapshot.upsert({
      where: { id: `snap_${created.id}_v1` },
      update: {},
      create: {
        id: `snap_${created.id}_v1`,
        repositoryId: created.id,
        commitSha: 'abc123def456',
        branch: repo.defaultBranch,
        indexedStatus: 'completed',
        manifestJson: { files: 100, languages: { [repo.language.toLowerCase()]: 80 } },
      },
    });

    // Create sample concepts
    const concepts = [
      { name: 'Routing', conceptType: 'module' as const, description: 'HTTP request routing and middleware system', difficulty: 'beginner' as const, tags: ['routing', 'http'] },
      { name: 'Middleware', conceptType: 'pattern' as const, description: 'Request/response middleware pipeline', difficulty: 'intermediate' as const, tags: ['middleware', 'pipeline'] },
      { name: 'Request Handling', conceptType: 'flow' as const, description: 'How requests are received, processed, and responded to', difficulty: 'beginner' as const, tags: ['request', 'lifecycle'] },
      { name: 'Error Handling', conceptType: 'pattern' as const, description: 'Error propagation and handling strategies', difficulty: 'intermediate' as const, tags: ['error', 'exception'] },
      { name: 'Testing', conceptType: 'module' as const, description: 'Test structure and testing strategies', difficulty: 'intermediate' as const, tags: ['testing', 'quality'] },
    ];

    const createdConcepts = [];
    for (const concept of concepts) {
      const c = await prisma.concept.create({
        data: {
          snapshotId: snapshot.id,
          ...concept,
        },
      });
      createdConcepts.push(c);
    }

    // Create concept relations
    if (createdConcepts[1] && createdConcepts[0]) {
      await prisma.conceptRelation.create({
        data: {
          fromConceptId: createdConcepts[1].id,
          toConceptId: createdConcepts[0].id,
          relationType: 'depends_on',
        },
      });
    }
    if (createdConcepts[2] && createdConcepts[0]) {
      await prisma.conceptRelation.create({
        data: {
          fromConceptId: createdConcepts[2].id,
          toConceptId: createdConcepts[0].id,
          relationType: 'depends_on',
        },
      });
    }

    // Create sample lessons
    await prisma.lesson.createMany({
      data: [
        {
          snapshotId: snapshot.id,
          conceptId: createdConcepts[0]?.id,
          title: 'Getting Started: Project Overview',
          description: 'Understand what this project does and how it is organized.',
          orderIndex: 1,
          difficulty: 'beginner',
          estimatedMinutes: 15,
          lessonContentMarkdown: '# Getting Started\n\nThis project is a web framework...',
          track: 'newcomer',
        },
        {
          snapshotId: snapshot.id,
          conceptId: createdConcepts[0]?.id,
          title: 'Understanding the Routing System',
          description: 'Deep dive into how routing works.',
          orderIndex: 2,
          difficulty: 'beginner',
          estimatedMinutes: 20,
          lessonContentMarkdown: '# Routing System\n\nThe routing system...',
          track: 'backend',
        },
        {
          snapshotId: snapshot.id,
          conceptId: createdConcepts[1]?.id,
          title: 'Middleware Pipeline',
          description: 'How middleware processes requests and responses.',
          orderIndex: 3,
          difficulty: 'intermediate',
          estimatedMinutes: 25,
          lessonContentMarkdown: '# Middleware Pipeline\n\nMiddleware...',
          track: 'backend',
        },
      ],
    });

    // Create sample flashcards
    await prisma.flashcard.createMany({
      data: [
        { snapshotId: snapshot.id, frontText: 'What is the main entry point of the application?', backText: 'The main entry point is typically the file that sets up the server and middleware chain.', tags: ['entry-point', 'architecture'], difficulty: 'beginner' },
        { snapshotId: snapshot.id, frontText: 'How does routing work in this project?', backText: 'Routes map HTTP methods and URL patterns to handler functions.', tags: ['routing', 'http'], difficulty: 'beginner' },
        { snapshotId: snapshot.id, frontText: 'What is middleware?', backText: 'Middleware are functions that have access to the request and response objects and can modify them or end the request-response cycle.', tags: ['middleware', 'pattern'], difficulty: 'intermediate' },
        { snapshotId: snapshot.id, frontText: 'How are errors handled?', backText: 'Errors propagate through middleware chain. Error-handling middleware catches and formats errors.', tags: ['error', 'middleware'], difficulty: 'intermediate' },
      ],
    });

    // Create sample quiz
    await prisma.quiz.create({
      data: {
        snapshotId: snapshot.id,
        title: `${repo.name} Architecture Basics`,
        quizType: 'multiple_choice',
        payloadJson: {
          questions: [
            {
              id: 'q1',
              text: 'What is the primary purpose of this project?',
              type: 'multiple_choice',
              options: ['Web framework', 'Database', 'Testing tool', 'Build tool'],
              correctAnswer: 'Web framework',
              explanation: 'This project is a web framework for building server-side applications.',
              difficulty: 'beginner',
            },
            {
              id: 'q2',
              text: 'Where are route definitions typically located?',
              type: 'multiple_choice',
              options: ['/lib/', '/test/', '/routes/ or app file', '/docs/'],
              correctAnswer: '/routes/ or app file',
              explanation: 'Routes are defined in dedicated route files or the main application file.',
              difficulty: 'beginner',
            },
          ],
        },
      },
    });

    console.log(`Seeded repository: ${repo.fullName}`);
  }

  // ─── Create Personal Bot ───────────────────────────────────────────────
  const repo = await prisma.repository.findFirst();
  if (repo) {
    await prisma.personalBot.upsert({
      where: {
        userId_repositoryId: {
          userId: user.id,
          repositoryId: repo.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        repositoryId: repo.id,
        name: 'Code Tutor',
        personaConfig: {
          tone: 'friendly',
          verbosity: 'detailed',
          teachingStyle: 'guided',
        },
        memoryConfig: {
          rememberWeakAreas: true,
          trackProgress: true,
          adaptiveDifficulty: true,
          spacedRepetition: true,
        },
      },
    });
    console.log('Created personal bot for user');
  }

  console.log('Seeding complete!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
