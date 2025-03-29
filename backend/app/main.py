from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.routers import analysis
from app.models import AnalysisParameter, AnalysisResult
from app.schemas import AnalysisCreate
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os  # ✅ Correct import
from app import models
from app.database import SessionLocal


# ✅ Load environment variables
load_dotenv()

# ✅ Define FastAPI app
app = FastAPI()
import logging
logging.warning("App started successfully")

origins = [
    "https://analysis-app-29on.onrender.com",  # ✅ your frontend domain
]

# ✅ CORS Middleware (Avoid duplicate calls)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust based on your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Ensure tables are created
models.Base.metadata.create_all(bind=engine)

# ✅ Include Routers (Ensure this is AFTER app initialization)
app.include_router(analysis.router, prefix="/api")

@app.get("/")
def home():
    return {"message": "API is working!"}
@app.get("/")
def read_root():
    return {"message": "API is working!"}

# ✅ Dependency for DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """ Check if the database connection is alive """
    return {"status": "Database is connected"}

@app.post("/api/analysis/")
def create_analysis(analysis: AnalysisCreate, db: Session = Depends(get_db)):
    """ Create a new analysis and return its unique ID """
    new_analysis = AnalysisParameter(**analysis.dict())  # Create new entry
    db.add(new_analysis)  # Add to database
    db.commit()  # Save changes
    db.refresh(new_analysis)  # Refresh object to get new ID
    return {"analysis_id": new_analysis.id}  # Return only the analysis ID

@app.get("/api/results/{analysis_id}")
def get_results(analysis_id: int, db: Session = Depends(get_db)):
    """ Fetch results based on the given unique analysis_id """
    results = db.query(AnalysisResult).filter(AnalysisResult.analysis_id == analysis_id).all()
    if not results:
        return {"message": "No results found for this analysis ID"}
    return results  # Return filtered results 
@app.get("/")
def health():
    return {"status": "Backend is alive!"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)