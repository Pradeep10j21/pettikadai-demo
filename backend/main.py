from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import traceback

app = FastAPI()

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy initialization - engine created on first request
rag_engine = None

def get_engine():
    global rag_engine
    if rag_engine is None:
        from rag_engine import RAGEngine
        rag_engine = RAGEngine()
    return rag_engine

class ChatRequest(BaseModel):
    query: str
    model: str = None
    provider: str = None

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        engine = get_engine()
        answer = engine.get_response(request.query, model_id=request.model, provider=request.provider)
        return {"answer": answer}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok", "engine_ready": rag_engine is not None}

if __name__ == "__main__":
    # Try eager load to surface errors immediately
    try:
        get_engine()
        print("RAG Engine initialized successfully!")
    except Exception as e:
        print(f"Warning: RAG Engine failed to initialize: {e}")
        traceback.print_exc()
    
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
