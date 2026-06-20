/**
 * Retrieval and vector search abstraction for the Codebase Learning Platform.
 * Provider-agnostic interface for embedding generation and similarity search.
 */

export interface EmbeddingProvider {
  /**
   * Generate embeddings for a list of text chunks.
   */
  embedTexts(texts: string[]): Promise<number[][]>;

  /**
   * Generate a single embedding for a query text.
   */
  embedQuery(query: string): Promise<number[]>;
}

export interface VectorStore {
  /**
   * Index documents with their embeddings and metadata.
   */
  index(documents: IndexDocument[]): Promise<void>;

  /**
   * Search for similar documents given a query embedding.
   */
  search(queryEmbedding: number[], topK: number, filters?: SearchFilter): Promise<SearchResult[]>;

  /**
   * Delete all documents for a given snapshot.
   */
  deleteBySnapshot(snapshotId: string): Promise<void>;

  /**
   * Get document count for a snapshot.
   */
  count(snapshotId: string): Promise<number>;
}

export interface IndexDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  snapshotId: string;
  filePath?: string;
  symbolName?: string;
  conceptId?: string;
  chunkType?: string;
  startLine?: number;
  endLine?: number;
}

export interface SearchFilter {
  snapshotId?: string;
  filePath?: string;
  chunkType?: string;
  conceptId?: string;
}

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: DocumentMetadata;
}

export class RetrievalService {
  constructor(
    private embedder: EmbeddingProvider,
    private store: VectorStore,
  ) {}

  /**
   * Index a code file with its chunks.
   */
  async indexFile(
    snapshotId: string,
    filePath: string,
    chunks: Array<{ content: string; type: string; startLine: number; endLine: number }>,
  ): Promise<void> {
    const texts = chunks.map((c) => c.content);
    const embeddings = await this.embedder.embedTexts(texts);

    const documents: IndexDocument[] = chunks.map((chunk, i) => ({
      id: `${snapshotId}:${filePath}:${chunk.startLine}`,
      content: chunk.content,
      embedding: embeddings[i] ?? [],
      metadata: {
        snapshotId,
        filePath,
        chunkType: chunk.type,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
      },
    }));

    await this.store.index(documents);
  }

  /**
   * Search for relevant code chunks given a query.
   */
  async search(
    query: string,
    snapshotId: string,
    topK = 5,
    additionalFilters?: Partial<SearchFilter>,
  ): Promise<SearchResult[]> {
    const queryEmbedding = await this.embedder.embedQuery(query);
    return this.store.search(queryEmbedding, topK, {
      snapshotId,
      ...additionalFilters,
    });
  }

  /**
   * Build retrieval context from search results for use in prompts.
   */
  buildContext(results: SearchResult[]): string {
    return results
      .map((r) => {
        const header = `[${r.metadata.filePath ?? 'unknown'}${r.metadata.startLine ? `:${r.metadata.startLine}` : ''}] (score: ${r.score.toFixed(3)})`;
        return `${header}\n${r.content.slice(0, 2000)}`;
      })
      .join('\n\n---\n\n');
  }
}

export { EmbeddingProvider, VectorStore };
