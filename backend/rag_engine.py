import os
import re
import pickle
import numpy as np
from dotenv import load_dotenv
from pypdf import PdfReader
from sklearn.feature_extraction.text import TfidfVectorizer
import faiss
from groq import Groq
from openai import OpenAI

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
DEEPINFRA_API_KEY = os.getenv("DEEPINFRA_API_KEY", "")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in environment variables.")

MODEL_NAME = os.getenv("MODEL_NAME", "llama-3.3-70b-versatile")

PDF_PATH = os.path.join(os.path.dirname(__file__), "data", "Pettikadai_RAG_KnowledgeBase.pdf")
INDEX_DIR = os.path.join(os.path.dirname(__file__), "faiss_index")

def sanitize_text(text: str) -> str:
    """Remove surrogate characters and problematic unicode."""
    cleaned = text.encode("utf-8", errors="replace").decode("utf-8")
    cleaned = re.sub(r'[\ud800-\udfff]', '', cleaned)
    return cleaned

def smart_chunk(text: str) -> list:
    """Split text by paragraphs/sections, then merge small ones and split big ones."""
    # Split by double newlines (paragraphs) or section headers
    raw_paragraphs = re.split(r'\n\s*\n|\n(?=\d+\.\d+\s)', text)
    raw_paragraphs = [p.strip() for p in raw_paragraphs if p.strip() and len(p.strip()) > 20]
    
    chunks = []
    current_chunk = ""
    
    for para in raw_paragraphs:
        # If adding this paragraph keeps us under 600 chars, merge
        if len(current_chunk) + len(para) < 600:
            current_chunk += "\n" + para
        else:
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
            # If single paragraph is too large, split it
            if len(para) > 800:
                words = para.split()
                sub_chunk = ""
                for word in words:
                    if len(sub_chunk) + len(word) < 600:
                        sub_chunk += " " + word
                    else:
                        if sub_chunk.strip():
                            chunks.append(sub_chunk.strip())
                        sub_chunk = word
                if sub_chunk.strip():
                    current_chunk = sub_chunk.strip()
                else:
                    current_chunk = ""
            else:
                current_chunk = para
    
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    return chunks

def expand_query(query: str) -> str:
    """Expand the user query with common synonyms/related terms for better TF-IDF matching."""
    expansions = {
        "history": "history story origin founded mission about background beginning brand",
        "company": "company brand business organization pettikadai shop",
        "ingredients": "ingredients composition made recipe contents material",
        "price": "price cost rate charge amount pricing",
        "delivery": "delivery shipping dispatch courier transport logistics",
        "order": "order purchase buy booking",
        "quality": "quality standard grade premium certification",
        "contact": "contact support help email phone reach",
        "location": "location address place city town area tirunelveli",
        "products": "products items menu snacks savory food collection range",
        "popular": "popular bestseller famous trending top favorite",
        "murukku": "murukku chakli crunchy spiral traditional",
        "mixture": "mixture chivda namkeen mix savory",
    }
    
    expanded = query
    for keyword, related in expansions.items():
        if keyword in query.lower():
            expanded += " " + related
    
    return expanded


class RAGEngine:
    def __init__(self):
        self.groq_client = Groq(api_key=GROQ_API_KEY)
        self.deepinfra_client = OpenAI(
            api_key=DEEPINFRA_API_KEY,
            base_url="https://api.deepinfra.com/v1/openai"
        )
        self.vectorizer = None
        self.index = None
        self.chunks = []
        self.load_or_create_index()

    def load_or_create_index(self):
        index_file = os.path.join(INDEX_DIR, "index.faiss")
        meta_file = os.path.join(INDEX_DIR, "meta.pkl")

        if os.path.exists(index_file) and os.path.exists(meta_file):
            print("Loading existing FAISS index...")
            self.index = faiss.read_index(index_file)
            with open(meta_file, "rb") as f:
                meta = pickle.load(f)
            self.chunks = meta["chunks"]
            self.vectorizer = meta["vectorizer"]
            print(f"Loaded {len(self.chunks)} chunks.")
        else:
            print("Creating new FAISS index from PDF...")
            self.create_index()

    def create_index(self):
        if not os.path.exists(PDF_PATH):
            raise FileNotFoundError(f"Knowledge base PDF not found at {PDF_PATH}")

        # Extract text from PDF
        reader = PdfReader(PDF_PATH)
        full_text = ""
        for page in reader.pages:
            page_text = page.extract_text() or ""
            full_text += sanitize_text(page_text) + "\n\n"

        # Smart paragraph-based chunking
        self.chunks = smart_chunk(full_text)
        print(f"Created {len(self.chunks)} chunks from PDF.")
        
        # Print first few chunks for debugging
        for i, chunk in enumerate(self.chunks[:5]):
            print(f"  Chunk {i}: {chunk[:80]}...")

        # Build TF-IDF vectors with bigrams
        self.vectorizer = TfidfVectorizer(max_features=1024, ngram_range=(1, 2), sublinear_tf=True)
        tfidf_matrix = self.vectorizer.fit_transform(self.chunks)
        vectors = tfidf_matrix.toarray().astype("float32")

        # Build FAISS index
        dim = vectors.shape[1]
        self.index = faiss.IndexFlatL2(dim)
        self.index.add(vectors)

        # Save
        os.makedirs(INDEX_DIR, exist_ok=True)
        faiss.write_index(self.index, os.path.join(INDEX_DIR, "index.faiss"))
        with open(os.path.join(INDEX_DIR, "meta.pkl"), "wb") as f:
            pickle.dump({"chunks": self.chunks, "vectorizer": self.vectorizer}, f)
        print("FAISS index created and saved.")

    def get_response(self, query: str, model_id: str = None, provider: str = None):
        if not self.index or not self.vectorizer:
            return "I'm sorry, my knowledge base is not ready yet. Please try again later."

        # Default to Groq Llama 3.3 if not specified
        target_model = model_id or MODEL_NAME
        target_provider = provider or "groq"

        # Expand query for better TF-IDF matching
        expanded_query = expand_query(sanitize_text(query))
        print(f"Original query: {query}")
        print(f"Target Model: {target_model} via {target_provider}")

        # Vectorize the expanded query
        query_vec = self.vectorizer.transform([expanded_query]).toarray().astype("float32")

        # Search FAISS - retrieve top 5 chunks
        k = min(5, self.index.ntotal)
        distances, indices = self.index.search(query_vec, k)
        relevant_chunks = [self.chunks[i] for i in indices[0] if i < len(self.chunks)]
        
        # Print retrieved chunks for debugging
        for i, idx in enumerate(indices[0]):
            if idx < len(self.chunks):
                print(f"  Retrieved chunk {idx} (dist={distances[0][i]:.3f}): {self.chunks[idx][:80]}...")
        
        context = "\n\n".join(relevant_chunks)

        prompt = f"""You are a friendly and enthusiastic marketing representative for Pettikadai, a traditional South Indian savory shop. You love the brand and talk about it with warmth and pride.

Rules:
- Keep your response to 3-4 sentences if needed to be thorough about products, but remain concise.
- Sound like a friendly person chatting, not a formal document.
- Use a warm, excited tone with occasional emojis (but don't overdo it).
- ALWAYS mention the price and a brief description when a specific product is mentioned or asked about.
- Prices should be formatted clearly (e.g., Rs. 210 for 250 gms).
- Do NOT mention section numbers, references, or document sources.
- If you don't know the answer, cheerfully suggest they contact support@pettikadai.in.

Context:
{context}

Customer asks: {query}

Your friendly response:"""

        try:
            if target_provider == "deepinfra":
                response = self.deepinfra_client.chat.completions.create(
                    model=target_model,
                    messages=[{"role": "user", "content": sanitize_text(prompt)}]
                )
            else:
                response = self.groq_client.chat.completions.create(
                    model=target_model,
                    messages=[{"role": "user", "content": sanitize_text(prompt)}]
                )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error calling {target_provider}: {e}")
            return f"I'm sorry, I encountered an error while talking to my {target_provider} brain ({target_model}). Error: {str(e)}"


if __name__ == "__main__":
    engine = RAGEngine()
    print("\n--- Test Query ---")
    print(engine.get_response("What is the company history?"))
