"""AI service — LLM calls for chat, summarization, and RAG responses."""

import json
from typing import AsyncGenerator, List, Dict, Any, Optional

from langchain_google_genai import ChatGoogleGenerativeAI

from core.config import settings


class AIService:
    """Handles all LLM interactions — chat, summarization, RAG."""

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=settings.GOOGLE_API_KEY,
            streaming=True,
        )
        self.llm_sync = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=settings.GOOGLE_API_KEY,
            streaming=False,
        )

    async def chat_stream(
        self, question: str, context_chunks: List[Dict[str, Any]]
    ) -> AsyncGenerator[str, None]:
        """
        Stream a RAG-based answer. Yields chunks of text for SSE.
        Includes timestamp references when context has timestamps.
        """
        context_parts = []
        has_timestamps = False

        for chunk in context_chunks:
            text = chunk.get("text", "")
            start = chunk.get("start_time")
            end = chunk.get("end_time")
            if start is not None and end is not None:
                has_timestamps = True
                context_parts.append(f"[{start:.1f}s - {end:.1f}s]: {text}")
            else:
                context_parts.append(text)

        context_text = "\n\n".join(context_parts)

        timestamp_instruction = ""
        if has_timestamps:
            timestamp_instruction = (
                "\nWhen your answer references information from the source, "
                "include the relevant timestamp in the format [MM:SS] so the user "
                "can jump to that part of the audio/video. "
            )

        prompt = f"""You are a helpful assistant that answers questions based on the provided context.
Use ONLY the context below to answer. If the context doesn't contain the answer, say so.
{timestamp_instruction}
Context:
{context_text}

Question: {question}

Answer:"""

        async for chunk in self.llm.astream(prompt):
            if chunk.content:
                yield chunk.content

    async def chat_no_context(self, question: str) -> AsyncGenerator[str, None]:
        """Stream answer without RAG context (general question)."""
        async for chunk in self.llm.astream(question):
            if chunk.content:
                yield chunk.content

    async def summarize(self, text: str) -> str:
        """Generate a summary of the given text."""
        prompt = f"""Provide a comprehensive but concise summary of the following content.
Organize the summary with clear sections and key points.

Content:
{text}

Summary:"""

        response = await self.llm_sync.ainvoke(prompt)
        return response.content

    async def summarize_stream(self, text: str) -> AsyncGenerator[str, None]:
        """Stream a summary of the given text."""
        prompt = f"""Provide a comprehensive but concise summary of the following content.
Organize the summary with clear sections and key points.

Content:
{text}

Summary:"""

        async for chunk in self.llm.astream(prompt):
            if chunk.content:
                yield chunk.content


# Singleton
ai_service = AIService()
