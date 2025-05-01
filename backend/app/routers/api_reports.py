from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AnalysisParameter, AnalysisResult, User
from typing import List
from datetime import datetime
from app.oauth import get_current_manager
import pytz

# ✅ Correct Router Setup
router = APIRouter(
    prefix="/manager",
    tags=["Manager Reports"]
)

@router.get("/reports")
def get_grouped_reports(
    username: str = Query(None),
    start_date: str = Query(None),
    end_date: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)  # ✅ Manager only access
):
    try:
        query = db.query(AnalysisParameter).join(AnalysisParameter.user)

        if username:
            query = query.filter(User.username.ilike(f"%{username}%"))
        if start_date:
            query = query.filter(AnalysisParameter.created_at >= datetime.strptime(start_date, "%Y-%m-%d"))
        if end_date:
            query = query.filter(AnalysisParameter.created_at <= datetime.strptime(end_date, "%Y-%m-%d"))

        analyses = query.order_by(AnalysisParameter.created_at.desc()).all()

        results = []

        for analysis in analyses:
            # ✅ Fetch the final (permanent) results for this analysis
            final_results = db.query(AnalysisResult).filter(
                AnalysisResult.analysis_id == analysis.id
            ).order_by(AnalysisResult.week).all()

            results.append({
                "id": analysis.id,
                "username": analysis.user.username if analysis.user else "-",
                "description": analysis.description,
                "principal": analysis.principal,
                "ending_balance": analysis.final_result.ending_balance if hasattr(analysis, 'final_result') and analysis.final_result else None,
                "created_at": analysis.created_at.astimezone(pytz.UTC).isoformat() if analysis.created_at else None,

                "weekly_breakdown": [
                    {
                        "week": r.week,
                        "beginning_balance": r.beginning_balance,
                        "additional_deposit": r.additional_deposit,
                        "profit": r.profit,
                        "withdrawal": r.withdrawal,
                        "tax_deduction": r.tax_deduction,
                        "ending_balance": r.ending_balance,
                        "generated_at": r.generated_at.isoformat() if r.generated_at else None
                    }
                    for r in final_results
                ]
            })

        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
