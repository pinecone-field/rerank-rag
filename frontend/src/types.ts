export interface SearchResult {
  id: string;
  score: number;
  metadata: {
    text: string;
  };
}

export interface RerankResult extends SearchResult {
  rerank_score: number;
  score_spread: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  vectorResponse: string;
  rerankedResponse: string;
} 