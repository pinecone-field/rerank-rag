from sentence_transformers import SentenceTransformer, CrossEncoder
from pinecone import Pinecone
import os
from typing import List, Dict
from dotenv import load_dotenv
from pathlib import Path
import asyncio
from pinecone.openapi_support.exceptions import ServiceException
import logging

# Load .env.local from project root
root_dir = Path(__file__).parent.parent
env_path = root_dir / '.env.local'
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger(__name__)

class SearchClient:
    def __init__(self):
        logger.info("Initializing SearchClient")
        api_key = os.getenv("PINECONE_API_KEY")
        index_name = os.getenv("PINECONE_INDEX_NAME")
        environment = os.getenv("PINECONE_ENVIRONMENT")
        
        logger.info(f"Using Pinecone index: {index_name}")
        logger.info(f"Using environment: {environment}")
        
        if not all([api_key, index_name, environment]):
            raise ValueError("Missing required Pinecone configuration")
        
        self.pc = Pinecone(api_key=api_key)
        # Create index with namespace
        self.index = self.pc.Index(index_name)
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
                parameters={
                    "input_type": "passage", 
                    "truncate": "END"
                }
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
        logger.info(f"Generating embeddings for query: {query}")
        logger.info(f"Using embedding model: {os.getenv('PINECONE_EMBEDDING_MODEL')}")
        query_embedding = await self.embed_query(query)
        
        # Vector search with namespace
        logger.info(f"Performing vector search with top_k={top_k} in namespace='nvidia-blog'")
        vector_results = await self._retry_operation(
            lambda: self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                namespace="nvidia-blog"  # Only need namespace here for index operations
            )
        )
        
        # Log raw results
        logger.info("Search results:")
        for i, match in enumerate(vector_results.matches):
            logger.info(f"Result {i+1}:")
            logger.info(f"ID: {match.id}")
            logger.info(f"Score: {match.score}")
            logger.info(f"Text: {match.metadata.get('text', 'No text')[:200]}...")
            logger.info(f"Title: {match.metadata.get('title', 'No title')}")
            logger.info("---")

        # Convert to serializable format
        vector_matches = [
            {
                "id": match.id,
                "score": float(match.score),
                "metadata": match.metadata
            }
            for match in vector_results.matches
        ]

        # Get reranked results
        reranked = await self.rerank_results(query, vector_results.matches, top_k=3)
        reranked_matches = [
            {
                "id": match.id,
                "score": float(match.score),
                "metadata": match.metadata
            }
            for match in reranked
        ]

        return {
            "vector_results": vector_matches[:3],  # Top 3 for LLM
            "reranked_results": reranked_matches,  # Top 3 reranked for LLM
            "all_vector_results": vector_matches,  # ALL vector results
            "latency": float(vector_results.latency) if vector_results.latency is not None else 0.0
        } 