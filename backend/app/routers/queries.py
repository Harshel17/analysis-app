from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
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
        db.query(AnalysisResult, AnalysisParameter, User)
        .join(AnalysisParameter, AnalysisResult.analysis_id == AnalysisParameter.id)
        .join(User, AnalysisParameter.user_id == User.id)
        .order_by(desc(AnalysisResult.generated_at))
    )

    if username:
        query = query.filter(User.username.ilike(f"%{username}%"))
    if description_contains:
        query = query.filter(AnalysisParameter.description.ilike(f"%{description_contains}%"))
    if principal_gt is not None:
        query = query.filter(AnalysisParameter.principal >= principal_gt)
    if principal_lt is not None:
        query = query.filter(AnalysisParameter.principal <= principal_lt)
    if ending_balance_gt is not None:
        query = query.filter(AnalysisResult.ending_balance >= ending_balance_gt)
    if ending_balance_lt is not None:
        query = query.filter(AnalysisResult.ending_balance <= ending_balance_lt)
    if start_date:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        query = query.filter(AnalysisResult.generated_at >= start_dt)
    if end_date:
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        query = query.filter(AnalysisResult.generated_at <= end_dt)

    seen_ids = set()
    response = []

    for result, param, user in query.all():
        if result.analysis_id in seen_ids:
            continue
        seen_ids.add(result.analysis_id)

        response.append({
            "id": result.analysis_id,
            "username": user.username,
            "description": param.description,
            "principal": param.principal,
            "ending_balance": result.ending_balance,
            "generated_at": result.generated_at.isoformat() if result.generated_at else None
        })

    return response

@router.get("/test")
def test_route():
    return {"message": "Queries route is active"}
