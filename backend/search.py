from sentence_transformers import SentenceTransformer, CrossEncoder
from pinecone import Pinecone
import os
from typing import List, Dict
from dotenv import load_dotenv
from pathlib import Path
import asyncio
from pinecone.openapi_support.exceptions import ServiceException

# Load .env.local from project root
root_dir = Path(__file__).parent.parent
env_path = root_dir / '.env.local'
load_dotenv(dotenv_path=env_path)

class SearchClient:
    def __init__(self):
        self.pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        self.index = self.pc.Index(os.getenv("PINECONE_INDEX_NAME"))
        self.max_retries = 3
        self.retry_delay = 1  # seconds

    async def _retry_operation(self, operation, *args, **kwargs):
        for attempt in range(self.max_retries):
            try:
                result = operation(*args, **kwargs)
                return result
            except ServiceException as e:
                if attempt == self.max_retries - 1:
                    raise
                await asyncio.sleep(self.retry_delay * (attempt + 1))
                continue

    async def embed_query(self, text):
        embeddings = await self._retry_operation(
            lambda: self.pc.inference.embed(
                model=os.getenv("PINECONE_EMBEDDING_MODEL"),
                inputs=[text],
                parameters={"input_type": "passage", "truncate": "END"}
            )
        )
        return embeddings.data[0].values

    async def rerank_results(self, query, documents, top_k=None):
        results = await self._retry_operation(
            lambda: self.pc.inference.rerank(
                model=os.getenv("PINECONE_RERANK_MODEL"),
                query=query,
                documents=[{"text": doc.metadata["text"]} for doc in documents],
                top_n=top_k if top_k else len(documents)
            )
        )
        return [documents[item.index] for item in results.data]

    async def search(self, query: str, top_k: int = 10) -> Dict:
        # Get embeddings
        query_embedding = await self.embed_query(query)
        
        # Vector search with retry - get top_k results
        vector_results = await self._retry_operation(
            lambda: self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True
            )
        )

        # Convert vector results to serializable format
        vector_matches = [
            {
                "id": match.id,
                "score": float(match.score),
                "metadata": match.metadata
            }
            for match in vector_results.matches
        ]

        # Only take top 3 for vector results to be sent to LLM
        vector_for_llm = vector_matches[:3]
        
        # Rerank all results but only return top 3
        reranked = await self.rerank_results(query, vector_results.matches, top_k=3)
        
        # Convert reranked results to serializable format
        reranked_matches = [
            {
                "id": match.id,
                "score": float(match.score),
                "metadata": match.metadata
            }
            for match in reranked
        ]

        return {
            "vector_results": vector_for_llm,  # Only top 3 for LLM
            "reranked_results": reranked_matches,
            "all_vector_results": vector_matches,  # Keep all results for UI if needed
            "latency": float(vector_results.latency) if vector_results.latency is not None else 0.0
        } 