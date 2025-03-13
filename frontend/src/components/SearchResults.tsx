'use client'

import React from 'react'
import { SearchResult, RerankResult } from '../types'

interface Props {
  vectorResults: SearchResult[];
  rerankedResults: RerankResult[];
  loading: boolean;
}

const SearchResults = ({ vectorResults, rerankedResults, loading }: Props) => {
  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
        <p className="mt-2">Searching...</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Vector Results */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Vector Search Results</h3>
        <div className="space-y-4">
          {vectorResults.map((result, index) => (
            <div key={result.id} className="p-4 border rounded-lg">
              <p className="text-sm text-gray-500">Result {index + 1}</p>
              <p className="mt-2">
                <span className="font-medium">Score:</span> {(result.score * 100).toFixed(1)}%
              </p>
              <p className="mt-2 text-sm">{result.metadata.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reranked Results */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Reranked Results</h3>
        <div className="space-y-4">
          {rerankedResults.map((result, index) => (
            <div key={result.id} className="p-4 border rounded-lg">
              <p className="text-sm text-gray-500">Result {index + 1}</p>
              <p className="mt-2">
                <span className="font-medium">Score:</span> {(result.rerank_score * 100).toFixed(1)}%
              </p>
              <p className="mt-2 text-sm">{result.metadata.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchResults; 