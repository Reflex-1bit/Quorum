from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routes.trading import router

load_dotenv()

app = FastAPI(
    title="QUORUM — Multi-Agent Hedge Fund API",
    description="5 AI agents trade against each other using real market data.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
def root():
    return {"status": "QUORUM backend running", "docs": "/docs"}
