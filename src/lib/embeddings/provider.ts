export interface EmbeddingProvider {
  embedText(input: string): Promise<number[]>;
}

export const embeddingProvider: EmbeddingProvider = {
  async embedText() {
    // TODO: Plug Gemini Embedding 2 here once we decide on the persistence shape.
    // This should return a dense vector for CV snapshots, roadmap memories, and skill clusters.
    return [];
  },
};
