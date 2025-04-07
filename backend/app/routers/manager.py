from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas
from app.database import get_db
from app.oauth import get_current_user

router = APIRouter()

# ✅ 1. Return all analyses (no ending_balance here)
@router.get("/all-analyses", response_model=List[schemas.AnalysisOut])
def get_all_analyses_for_manager(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_manager:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden")

    return db.query(models.AnalysisParameter).all()


# ✅ 2. Return latest ending_balance for a specific analysis
@router.get("/ending-balance/{analysis_id}")
def get_latest_ending_balance(
    analysis_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_manager:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden")

    last_result = (
        db.query(models.AnalysisResult)
        .filter(models.AnalysisResult.analysis_id == analysis_id)
        .order_by(models.AnalysisResult.week.desc())
        .first()
    )

    if not last_result:
        raise HTTPException(status_code=404, detail="No results found for this analysis")

    return {
        "analysis_id": analysis_id,
        "ending_balance": float(last_result.ending_balance)
    }
