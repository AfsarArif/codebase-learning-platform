// ─── Core domain types for the Codebase Learning Platform ─────────────────────

// ─── Repository ──────────────────────────────────────────────────────────────

export type SourceType = 'github_connected' | 'public_url';
export type RepositoryVisibility = 'public' | 'private';
export type IndexedStatus = 'pending' | 'indexing' | 'completed' | 'failed';

export interface Repository {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  sourceType: SourceType;
  githubRepoId?: number;
  defaultBranch: string;
  currentCommitSha?: string;
  visibility: RepositoryVisibility;
  cloneUrl?: string;
  description?: string;
  language?: string;
  topics: string[];
  createdByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RepositorySnapshot {
  id: string;
  repositoryId: string;
  commitSha: string;
  branch: string;
  archivePath?: string;
  manifestJson?: Record<string, unknown>;
  indexedStatus: IndexedStatus;
  createdAt: Date;
}

// ─── Code Analysis ───────────────────────────────────────────────────────────

export type SymbolType = 'function' | 'class' | 'interface' | 'export' | 'import' | 'route' | 'decorator';

export interface FileInfo {
  id: string;
  snapshotId: string;
  path: string;
  language?: string;
  sizeBytes: number;
  hash: string;
  summary?: string;
  isIgnored: boolean;
  rawStoragePath?: string;
}

export interface SymbolInfo {
  id: string;
  fileId: string;
  name: string;
  symbolType: SymbolType;
  signature?: string;
  startLine: number;
  endLine: number;
  summary?: string;
}

// ─── Concepts & Learning Graph ───────────────────────────────────────────────

export type ConceptType = 'module' | 'feature' | 'pattern' | 'flow' | 'architectural_component';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type RelationType = 'depends_on' | 'contains' | 'uses' | 'precedes' | 'relates_to';

export interface Concept {
  id: string;
  snapshotId: string;
  name: string;
  conceptType: ConceptType;
  description: string;
  difficulty: Difficulty;
  tags: string[];
}

export interface ConceptRelation {
  id: string;
  fromConceptId: string;
  toConceptId: string;
  relationType: RelationType;
}

export interface LearningGraph {
  nodes: Concept[];
  edges: ConceptRelation[];
}

// ─── Lessons ─────────────────────────────────────────────────────────────────

export type LearningTrack = 'newcomer' | 'frontend' | 'backend' | 'fullstack' | 'testing' | 'deployment' | 'interview';

export interface Lesson {
  id: string;
  snapshotId: string;
  conceptId?: string;
  title: string;
  description: string;
  orderIndex: number;
  difficulty: Difficulty;
  estimatedMinutes: number;
  lessonContentMarkdown: string;
  track?: LearningTrack;
  resources: LessonResource[];
}

export interface LessonResource {
  id: string;
  lessonId: string;
  resourceType: 'file' | 'symbol' | 'concept' | 'url' | 'diagram';
  resourceRef: string;
  displayTitle: string;
}

// ─── Study Materials ─────────────────────────────────────────────────────────

export type QuizType = 'multiple_choice' | 'short_answer' | 'true_false' | 'ordering' | 'matching';

export interface Flashcard {
  id: string;
  snapshotId: string;
  lessonId?: string;
  conceptId?: string;
  frontText: string;
  backText: string;
  tags: string[];
  difficulty: Difficulty;
}

export interface Quiz {
  id: string;
  snapshotId: string;
  lessonId?: string;
  title: string;
  quizType: QuizType;
  payloadJson: QuizPayload;
}

export interface QuizPayload {
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: QuizType;
  options?: string[];
  correctAnswer: string | string[] | number[];
  explanation: string;
  difficulty: Difficulty;
}

// ─── Chat Tutor ──────────────────────────────────────────────────────────────

export type TutorMode = 'explain' | 'quiz' | 'interview' | 'beginner' | 'advanced';
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Citation {
  file: string;
  symbol?: string;
  lineStart?: number;
  lineEnd?: number;
  relevance: string;
}

export interface TutorThread {
  id: string;
  userId: string;
  repositoryId: string;
  title: string;
  mode: TutorMode;
  createdAt: Date;
  updatedAt: Date;
}

export interface TutorMessage {
  id: string;
  threadId: string;
  role: MessageRole;
  content: string;
  citationsJson?: Citation[];
  createdAt: Date;
}

// ─── Interview Engine ────────────────────────────────────────────────────────

export type InterviewMode = 'conceptual' | 'implementation' | 'debug' | 'system_design';
export type InterviewStatus = 'in_progress' | 'completed' | 'abandoned';
export type QuestionType = 'basic' | 'intermediate' | 'advanced' | 'framework_specific';
export type FocusArea = 'api' | 'database' | 'frontend' | 'backend' | 'testing' | 'infrastructure' | 'security' | 'architecture';

export interface Interview {
  id: string;
  repositoryId: string;
  userId: string;
  mode: InterviewMode;
  difficultyProfile: Difficulty | 'mixed';
  focusAreas: FocusArea[];
  status: InterviewStatus;
  currentQuestionIndex: number;
  questions?: InterviewQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewQuestion {
  id: string;
  interviewId: string;
  conceptId?: string;
  questionType: QuestionType;
  promptText: string;
  referenceAnswer: string;
  difficulty: Difficulty;
  tags: string[];
  sourceFiles: string[];
  orderIndex: number;
}

export interface InterviewResponse {
  id: string;
  interviewQuestionId: string;
  userId: string;
  answerText: string;
  score?: number;
  feedbackText?: string;
  rubricJson?: ScoringRubric;
  evaluatedAt?: Date;
}

export interface ScoringRubric {
  dimensions: RubricDimension[];
  maxScore: number;
  passingThreshold: number;
}

export interface RubricDimension {
  name: string;
  description: string;
  maxPoints: number;
  weight: number;
}

// ─── Progress & Personalization ──────────────────────────────────────────────

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'mastered';

export interface UserProgress {
  id: string;
  userId: string;
  repositoryId: string;
  conceptId?: string;
  lessonId?: string;
  status: ProgressStatus;
  masteryScore: number;
  lastReviewedAt?: Date;
}

export interface ConceptMasteryMetric {
  id: string;
  userId: string;
  repositoryId: string;
  conceptId: string;
  lastInterviewScore?: number;
  averageInterviewScore?: number;
  attempts: number;
  lastAssessedAt?: Date;
}

// ─── Personal Bot ────────────────────────────────────────────────────────────

export interface PersonalBot {
  id: string;
  userId: string;
  repositoryId: string;
  name: string;
  personaConfig: BotPersonaConfig;
  memoryConfig: BotMemoryConfig;
}

export interface BotPersonaConfig {
  tone: 'friendly' | 'professional' | 'socratic';
  verbosity: 'concise' | 'detailed';
  teachingStyle: 'guided' | 'direct' | 'exploratory';
}

export interface BotMemoryConfig {
  rememberWeakAreas: boolean;
  trackProgress: boolean;
  adaptiveDifficulty: boolean;
  spacedRepetition: boolean;
}

// ─── API Types ───────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ImportRepoRequest {
  url: string;
  branch?: string;
}

export interface ChatRequest {
  threadId?: string;
  message: string;
  mode?: TutorMode;
}

export interface ChatResponse {
  threadId: string;
  message: TutorMessage;
  suggestedFollowups?: string[];
}

export interface InterviewStartRequest {
  mode: InterviewMode;
  difficulty?: Difficulty | 'mixed';
  focusAreas?: FocusArea[];
  questionCount?: number;
}

export interface InterviewAnswerRequest {
  questionId: string;
  answer: string;
}

export interface InterviewAnswerResponse {
  score: number;
  feedback: string;
  isCorrect: boolean;
  suggestedReview?: string[];
  nextQuestion?: InterviewQuestion;
}

export interface GenerateStudyMaterialRequest {
  type: 'flashcards' | 'quiz' | 'all';
  count?: number;
  difficulty?: Difficulty;
  focusAreas?: FocusArea[];
}

export interface ArchitectureSummary {
  projectPurpose: string;
  techStack: TechStackInfo;
  architecture: ArchitectureInfo;
  dataFlow: DataFlowInfo;
  keyComponents: ComponentInfo[];
  entryPoints: EntryPoint[];
}

export interface TechStackInfo {
  languages: string[];
  frameworks: string[];
  buildTools: string[];
  packageManager: string;
  databases: string[];
  deployment: string[];
}

export interface ArchitectureInfo {
  style: string; // MVC, layered, microservices, etc.
  description: string;
  serviceBoundaries: string[];
}

export interface DataFlowInfo {
  description: string;
  steps: FlowStep[];
}

export interface FlowStep {
  order: number;
  component: string;
  action: string;
  dataInvolved: string;
}

export interface ComponentInfo {
  name: string;
  responsibility: string;
  path: string;
  keyFiles: string[];
  dependencies: string[];
}

export interface EntryPoint {
  type: 'http' | 'cli' | 'worker' | 'event_handler';
  path: string;
  description: string;
}

export interface LearningPath {
  id: string;
  repositoryId: string;
  title: string;
  description: string;
  tracks: LearningTrack[];
  lessons: Lesson[];
  estimatedTotalMinutes: number;
}

export interface RepoDashboardData {
  repository: Repository;
  snapshot: RepositorySnapshot;
  summary: ArchitectureSummary;
  learningPath?: LearningPath;
  stats: RepoStats;
}

export interface RepoStats {
  totalFiles: number;
  totalSymbols: number;
  totalConcepts: number;
  totalLessons: number;
  totalFlashcards: number;
  totalQuizzes: number;
  indexingProgress: number; // 0-100
}
