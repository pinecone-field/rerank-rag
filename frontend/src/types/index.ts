export interface SearchResult {
  id: string;
  score: number;
  metadata: {
    text: string;
    source?: string;
    title?: string;
  };
}

export interface RerankResult extends SearchResult {
  rerank_score: number;
  score_spread: number;
}

export interface SearchResponse {
  vector_results: SearchResult[];
  reranked_results: RerankResult[];
  latency: number;
} 