"""Embedding service — generates embeddings using Google Generative AI."""

from typing import List

from langchain_google_genai import GoogleGenerativeAIEmbeddings

from core.config import settings
from vector_store.faiss_index import faiss_index


class EmbeddingService:
    """Generates embeddings and stores them in FAISS."""

    def __init__(self):
        self.embeddings_model = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=settings.GOOGLE_API_KEY,
        )

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of text chunks."""
        return self.embeddings_model.embed_documents(texts)

    def embed_query(self, query: str) -> List[float]:
        """Generate an embedding for a single query."""
        return self.embeddings_model.embed_query(query)

    def ingest_document(
        self,
        file_id: str,
        chunks: List[str],
        timestamps: List[dict] = None,
    ) -> None:
        """
        Embed all chunks and store in FAISS with metadata.

        Args:
            file_id: UUID of the file
            chunks: list of text chunks
            timestamps: optional list of dicts with start_time/end_time per chunk
        """
        if not chunks:
            return

        embeddings = self.embed_texts(chunks)

        metadata = []
        for i, chunk in enumerate(chunks):
            meta = {"text": chunk, "file_id": file_id}
            if timestamps and i < len(timestamps):
                meta["start_time"] = timestamps[i].get("start_time")
                meta["end_time"] = timestamps[i].get("end_time")
            metadata.append(meta)

        faiss_index.add_embeddings(file_id, embeddings, metadata)

    def search_similar(
        self, file_id: str, query: str, top_k: int = 5
    ) -> List[dict]:
        """
        Embed a query and search for similar chunks in the file's index.
        """
        query_embedding = self.embed_query(query)
        return faiss_index.search(file_id, query_embedding, top_k)


# Singleton
embedding_service = EmbeddingService()
