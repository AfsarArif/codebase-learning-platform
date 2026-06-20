/**
 * Prompt templates for the Codebase Learning Platform.
 * Each prompt is a function that takes structured input and returns a formatted prompt string.
 */

export interface RepoOverviewInput {
  repoName: string;
  description: string;
  language: string;
  fileTree: string;
  dependencies: string[];
  readme?: string;
}

export function repoOverviewPrompt(input: RepoOverviewInput): string {
  return `You are analyzing a codebase to help developers learn it. Provide a clear, structured overview.

## Repository: ${input.repoName}
## Primary Language: ${input.language}
## Description: ${input.description}

### Top-Level File Tree:
${input.fileTree}

### Key Dependencies:
${input.dependencies.join('\n')}

${input.readme ? `### README Excerpt:\n${input.readme.slice(0, 3000)}` : ''}

## Task:
Generate a comprehensive repository overview covering:
1. **Project Purpose** (1-2 paragraphs): What problem does this solve?
2. **Tech Stack Summary**: Languages, frameworks, build tools
3. **Entry Points**: How does the application start/run?
4. **Key Directories**: What does each major directory contain and do?
5. **Architecture Style**: MVC, microservices, monolith, layered, etc.
6. **Important Dependencies**: What key libraries shape the architecture?

Format your response as structured JSON. Be specific and grounded in what you observe — do not hallucinate.
`;
}

export interface FileSummaryInput {
  filePath: string;
  language: string;
  content: string;
}

export function fileSummaryPrompt(input: FileSummaryInput): string {
  return `Analyze the following source file and provide a clear summary.

**File:** ${input.filePath}
**Language:** ${input.language}

### Code:
\`\`\`${input.language}
${input.content.slice(0, 8000)}
\`\`\`

## Task:
Provide:
1. **Purpose** (1 sentence): What does this file do?
2. **Key exports/symbols**: Main classes, functions, interfaces defined
3. **Dependencies**: What other modules does this import and rely on?
4. **Role in architecture**: How this file fits into the larger system

Be concise and factual.
`;
}

export interface ArchitectureInput {
  repoName: string;
  fileSummaries: string[];
  dependencyGraph: string;
  configFiles: string[];
}

export function architecturePrompt(input: ArchitectureInput): string {
  return `You are analyzing the architecture of **${input.repoName}**.

### File Summaries:
${input.fileSummaries.slice(0, 50).join('\n---\n')}

### Dependency Graph:
${input.dependencyGraph}

### Config Files Found:
${input.configFiles.join('\n')}

## Task:
Generate an architecture breakdown:
1. **High-Level Architecture Style** with justification
2. **Component Map**: Each major component, its responsibility, key files
3. **Data Flow**: How data moves through the system (request lifecycle or event flow)
4. **Module Boundaries**: Where are the seams between components?
5. **Integration Points**: APIs, databases, external services
6. **Patterns Used**: MVC, repository, factory, observer, etc.

Ground everything in the provided file summaries and dependency graph.
`;
}

export interface LessonInput {
  repoName: string;
  conceptName: string;
  conceptDescription: string;
  relevantFiles: string[];
  difficulty: string;
  track: string;
}

export function lessonPrompt(input: LessonInput): string {
  return `Generate a learning lesson for the concept **${input.conceptName}** in the repository **${input.repoName}**.

**Concept Description:** ${input.conceptDescription}
**Difficulty Level:** ${input.difficulty}
**Learning Track:** ${input.track}
**Relevant Files:** ${input.relevantFiles.join(', ')}

## Lesson Structure:
1. **Title**: Clear, engaging title
2. **Why This Matters**: Why understanding this concept is important
3. **What You'll Learn**: Learning objectives
4. **Prerequisites**: What concepts should be understood first
5. **Step-by-Step Explanation**: Walk through the concept, referencing specific files
6. **Key Terms**: Important terminology
7. **Common Confusion Points**: Pitfalls or misunderstandings to avoid
8. **Practice Questions**: 2-3 questions to check understanding
9. **Suggested Next**: What to learn next

Format in Markdown. Be concrete and reference the actual codebase.
`;
}

export interface FlashcardInput {
  repoName: string;
  concepts: Array<{ name: string; description: string; files: string[] }>;
  count: number;
}

export function flashcardPrompt(input: FlashcardInput): string {
  return `Generate ${input.count} flashcards for learning the codebase **${input.repoName}**.

### Available Concepts:
${input.concepts.map((c) => `- **${c.name}**: ${c.description} (files: ${c.files.join(', ')})`).join('\n')}

Generate flashcards covering:
- File → Responsibility mappings
- Concept → Implementation location
- Endpoint → Flow mappings
- Term → Definition

Each flashcard should have a front (question/term) and back (answer/explanation).
Format as a JSON array of {frontText, backText, tags, difficulty}.
`;
}

export interface QuizInput {
  repoName: string;
  concepts: Array<{ name: string; description: string }>;
  count: number;
  difficulty: string;
}

export function quizPrompt(input: QuizInput): string {
  return `Generate a quiz with ${input.count} questions about **${input.repoName}** at **${input.difficulty}** difficulty.

### Concepts to cover:
${input.concepts.map((c) => `- ${c.name}: ${c.description}`).join('\n')}

Mix question types: multiple-choice, true/false, matching, and ordering.
For each question, provide: the question text, type, options (if applicable), correct answer, and explanation.
Tie every question to the actual codebase structure — do NOT create generic programming questions.

Format as a JSON object with a "questions" array.
`;
}

export interface TutorInput {
  repoName: string;
  question: string;
  context: string;
  mode: 'explain' | 'beginner' | 'advanced' | 'quiz';
}

export function tutorPrompt(input: TutorInput): string {
  const modeInstructions: Record<string, string> = {
    explain: 'Provide a clear, balanced explanation with code references.',
    beginner: 'Explain simply. Avoid jargon. Use analogies. Start from fundamentals.',
    advanced: 'Provide deep technical detail. Discuss tradeoffs, patterns, and architecture implications.',
    quiz: 'Instead of answering directly, ask guiding questions that help the learner discover the answer.',
  };

  return `You are a codebase tutor for **${input.repoName}**. ${modeInstructions[input.mode] ?? modeInstructions.explain}

### Available Context (from the repository):
${input.context}

### Learner's Question:
${input.question}

## Instructions:
- Answer grounded ONLY in the provided context.
- Cite specific files and symbols.
- If the context is insufficient, say so clearly.
- Mark uncertain inferences with [confidence: low/medium/high].
- Suggest follow-up questions the learner might find helpful.
`;
}

export interface InterviewQuestionInput {
  repoName: string;
  conceptName: string;
  conceptDescription: string;
  mode: string;
  difficulty: string;
  relevantFiles: string[];
}

export function interviewQuestionPrompt(input: InterviewQuestionInput): string {
  return `Generate an interview question about **${input.repoName}** based on this concept:

**Concept:** ${input.conceptName}
**Description:** ${input.conceptDescription}
**Interview Mode:** ${input.mode} (conceptual/implementation/debug/system_design)
**Difficulty:** ${input.difficulty}
**Relevant Files:** ${input.relevantFiles.join(', ')}

## Task:
1. Generate a question that tests understanding of this specific concept in this specific codebase.
2. Provide a reference/model answer grounded in the actual files.
3. The question should be appropriate for an ${input.difficulty}-level ${input.mode} interview.

For conceptual mode: ask about architecture, design decisions, tradeoffs.
For implementation mode: ask to walk through specific flows, explain functions.
For debug mode: present a scenario and ask what could go wrong.
For system_design mode: ask how to extend or modify the system.

Format as JSON: {promptText, referenceAnswer, difficulty, tags, sourceFiles}.
`;
}

export interface InterviewEvalInput {
  question: string;
  referenceAnswer: string;
  learnerAnswer: string;
  difficulty: string;
}

export function interviewEvalPrompt(input: InterviewEvalInput): string {
  return `Evaluate the following interview answer.

**Question:** ${input.question}
**Difficulty:** ${input.difficulty}

**Reference Answer:**
${input.referenceAnswer}

**Learner's Answer:**
${input.learnerAnswer}

## Task:
Score the answer on a scale of 0-100 considering:
- Accuracy relative to the codebase
- Depth of understanding
- Clarity of explanation
- Coverage of key points from the reference answer

Provide:
1. A numeric score (0-100)
2. Brief, constructive feedback
3. Whether the answer is correct (score >= 60)
4. Suggested files/concepts to review if score < 80

Format as JSON: {score, feedbackText, isCorrect, suggestedReview}.
`;
}
