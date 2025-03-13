from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging
import os
from search import SearchClient
from openai import AsyncOpenAI

app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SearchRequest(BaseModel):
    query: str
    top_k: int = 10

search_client = SearchClient()
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ... existing CORS setup ...

class ChatRequest(BaseModel):
    message: str
    top_k: Optional[int] = 5

@app.post("/api/search")
async def search(request: SearchRequest):
    try:
        results = await search_client.search(request.query, request.top_k)
        return results
    except Exception as e:
        logger.error(f"Search error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        search_results = await search_client.search(request.message, request.top_k)
        
        # First define the context formatting function and create contexts
        def format_context(results):
            return "\n".join(
                f"- {r['metadata']['text']}\n  [{i+1}] Title: {r['metadata'].get('title', 'No title')}\n  URL: {r['metadata']['source']}"
                for i, r in enumerate(results)
            )
        
        vector_context = format_context(search_results["vector_results"])
        rerank_context = format_context(search_results["reranked_results"])
        
        # Then define the shared instructions and prompts
        shared_instructions = """
        Don't refer to 'the context' or 'the provided information'.
        Don't use general knowledge to answer the question. Only use the provided context.

        CRITICAL CITATION RULES:
        1. Each individual fact or claim MUST have its own citation immediately after it
        2. Citations in text must be in this exact format: [[N]](#N)
        3. Never combine multiple claims under a single citation
        4. Never make claims without citations

        Examples:
        CORRECT:
        "MONAI is a medical imaging framework [[1]](#1). It is being used by AWS HealthImaging [[2]](#2)."

        INCORRECT (multiple claims, one citation):
        "MONAI is a medical imaging framework and is being used by AWS HealthImaging [[1]](#1)."

        INCORRECT (citation not immediately after claim):
        "MONAI is a medical imaging framework. It is being used by AWS HealthImaging. [[1]](#1)"

        At the end of your response, list your sources in this exact format. Be sure to include the markdown links:

        Sources:
        [[1]](#1) [Exact Title from Source](Complete URL)

        For each source, you MUST include:
        - The exact number used in your citations
        - The exact title from the source metadata
        - The complete URL from the source metadata
        """

        vector_prompt = f"""You are a careful and precise AI assistant. Be direct and concise in your responses.
        If you're not sure about something, say so clearly but conversationally.
        Keep a professional but friendly tone.

        {shared_instructions}
        
        Use this context to help answer the question:
        {vector_context}
        """
        
        rerank_prompt = f"""You are an enthusiastic and insightful AI assistant. Be engaging and conversational.
        Share information with excitement when you find something interesting.
        If you spot interesting connections or details, point them out.
        Use exclamation points and positive language when appropriate.

        {shared_instructions}
        
        Use this context to help answer the question:
        {rerank_context}
        """
        
        # Get responses from OpenAI with different personalities
        vector_response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": vector_prompt},
                {"role": "user", "content": request.message}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        rerank_response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": rerank_prompt},
                {"role": "user", "content": request.message}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        return {
            "vectorResponse": vector_response.choices[0].message.content,
            "rerankedResponse": rerank_response.choices[0].message.content
        }
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    try:
        import uvicorn
        uvicorn.run(app, host="127.0.0.1", port=5328) 
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received, shutting down...")
        raise SystemExit(0)
    except Exception as e:
        logger.error(f"App startup error: {str(e)}", exc_info=True)
        raise SystemExit(1)