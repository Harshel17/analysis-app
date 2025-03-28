from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.routers import analysis
from app.models import AnalysisParameter, AnalysisResult
from app.schemas import AnalysisCreate
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from app import models

# Load environment variables
load_dotenv()

# Define FastAPI app
app = FastAPI()

# CORS setup
origins = [
    "https://analysis-app-29on.onrender.com",  # your deployed frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
models.Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(analysis.router, prefix="/api")

# Health check route (keep only one)
@app.get("/")
def health():
    return {"status": "Backend is alive!"}

# Database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# DB health check
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    return {"status": "Database is connected"}

# API route to create new analysis
@app.post("/api/analysis/")
def create_analysis(analysis: AnalysisCreate, db: Session = Depends(get_db)):
    new_analysis = AnalysisParameter(**analysis.dict())
    db.add(new_analysis)
    db.commit()
    db.refresh(new_analysis)
    return {"analysis_id": new_analysis.id}

# API route to fetch results
@app.get("/api/results/{analysis_id}")
def get_results(analysis_id: int, db: Session = Depends(get_db)):
    results = db.query(AnalysisResult).filter(AnalysisResult.analysis_id == analysis_id).all()
    if not results:
        return {"message": "No results found for this analysis ID"}
    return results

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
