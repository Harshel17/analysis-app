# app/routers/reports.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
from typing import Optional, List
from datetime import datetime
from io import StringIO
import csv
import pytz
from pytz.exceptions import UnknownTimeZoneError

from app.database import get_db
from app.models import AnalysisResult, AnalysisParameter, User
from app.schemas import AnalysisResultSchema
from app.utils.auth_utils import get_current_manager

router = APIRouter()

# ✅ 1. Download CSV Report
@router.get("/manager/reports/financial")
def generate_financial_report(
    username: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    timezone: str = Query("UTC"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    try:
        tz = pytz.timezone(timezone)
    except UnknownTimeZoneError:
        raise HTTPException(status_code=400, detail="Invalid timezone.")

    query = db.query(AnalysisResult).join(AnalysisResult.analysis).join(AnalysisParameter.user)

    if username:
        query = query.filter(User.username.ilike(f"%{username}%"))
    if start_date:
        start_utc = tz.localize(datetime.strptime(start_date, "%Y-%m-%d")).astimezone(pytz.UTC)
        query = query.filter(AnalysisResult.generated_at >= start_utc)
    if end_date:
        end_utc = tz.localize(datetime.strptime(end_date, "%Y-%m-%d")).astimezone(pytz.UTC)
        query = query.filter(AnalysisResult.generated_at <= end_utc)

    results = query.all()

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Username", "Principal", "Interest / Week", "Deposit Freq",
        "Withdrawal Freq", "Description", "Created At", "Ending Balance", "Generated At"
    ])

    for r in results:
        param = r.analysis
        writer.writerow([
    r.id,
    param.user.username if param and param.user else "-",
    f"{param.principal:,.2f}" if param else "-",
    f"{param.interest_week}%" if param else "-",
    param.deposit_frequency if param else "-",
    param.withdrawal_frequency if param else "-",
    param.description if param else "-",
    param.created_at.strftime("%Y-%m-%d %H:%M:%S") if param and param.created_at else "-",
    f"{r.ending_balance or 0:,.2f}",
    r.generated_at.strftime("%Y-%m-%d %H:%M:%S") if r.generated_at else "-"
])


    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=financial_report.csv"}
    )

# ✅ 2. Fetch Reports (Table view)
@router.get("/manager/reports")
def get_reports(
    username: Optional[str] = Query(None),
    analysis_id: Optional[int] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    try:
        query = db.query(AnalysisParameter, AnalysisResult) \
            .outerjoin(AnalysisResult, AnalysisResult.analysis_id == AnalysisParameter.id) \
            .join(AnalysisParameter.user)

        if username:
            query = query.filter(User.username.ilike(f"%{username}%"))
        if start_date:
            query = query.filter(AnalysisParameter.created_at >= start_date)
        if end_date:
            query = query.filter(AnalysisParameter.created_at <= end_date)
        if analysis_id:
            query = query.filter(AnalysisParameter.id == analysis_id)

        parameters = query.all()

        response = []

        for param, result in parameters:
            report = {
                "id": param.id,
                "username": param.user.username,
                "description": param.description,
                "principal": param.principal,
                "interest_week": param.interest_week,
                "tax_rate": param.tax_rate,
                "projection_period": param.projection_period,
                "deposit_frequency": param.deposit_frequency,
                "additional_deposit": param.additional_deposit,
                "withdrawal_frequency": param.withdrawal_frequency,
                "regular_withdrawal": param.regular_withdrawal,
                "ending_balance": result.ending_balance if result else None,
                "generated_at": result.generated_at if result else None,
                "created_at": param.created_at,
                "weekly_breakdown": [
                    {
                        "week": r.week,
                        "beginning_balance": r.beginning_balance,
                        "additional_deposit": r.additional_deposit,
                        "profit": r.profit,
                        "withdrawal": r.withdrawal,
                        "tax_deduction": r.tax_deduction,
                        "ending_balance": r.ending_balance,
                        "generated_at": r.generated_at,
                    }
                    for r in param.staging_results
                ]
            }

            response.append(report)

        print("🔍 Sample report:", response[0] if response else "No data")

        return response

    except Exception as e:
        print("❌ Internal Server Error:", str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch report data.")

