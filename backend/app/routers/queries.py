from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AnalysisResult, AnalysisParameter, User
from typing import Optional
from datetime import datetime

router = APIRouter(tags=["Queries"])

@router.get("/analyses")
def query_analyses(
    username: Optional[str] = Query(None),
    description_contains: Optional[str] = Query(None),
    principal_gt: Optional[float] = Query(None),
    principal_lt: Optional[float] = Query(None),
    ending_balance_gt: Optional[float] = Query(None),
    ending_balance_lt: Optional[float] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = (
        db.query(AnalysisResult)
        .join(AnalysisResult.analysis)
        .join(AnalysisParameter.user)
    )

    if username:
        query = query.filter(User.username.ilike(f"%{username}%"))
    if description_contains:
        query = query.filter(AnalysisParameter.description.ilike(f"%{description_contains}%"))
    if principal_gt is not None:
        query = query.filter(AnalysisParameter.principal > principal_gt)
    if principal_lt is not None:
        query = query.filter(AnalysisParameter.principal < principal_lt)
    if ending_balance_gt is not None:
        query = query.filter(AnalysisResult.ending_balance > ending_balance_gt)
    if ending_balance_lt is not None:
        query = query.filter(AnalysisResult.ending_balance < ending_balance_lt)
    if start_date:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        query = query.filter(AnalysisResult.generated_at >= start_dt)
    if end_date:
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        query = query.filter(AnalysisResult.generated_at <= end_dt)

    results = query.all()

    response = []
    for r in results:
        response.append({
            "id": r.id,
            "username": r.analysis.user.username if r.analysis and r.analysis.user else "-",
            "description": r.analysis.description if r.analysis else "-",
            "principal": r.analysis.principal if r.analysis else 0,
            "ending_balance": r.ending_balance,
            "generated_at": r.generated_at.isoformat() if r.generated_at else None
        })

    return response

@router.get("/test")
def test_route():
    return {"message": "Queries route is active"}
