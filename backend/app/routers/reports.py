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
    writer.writerow(["ID", "Username", "Principal", "Ending Balance", "Generated At"])

    for r in results:
        writer.writerow([
            r.id,
            r.analysis.user.username if r.analysis and r.analysis.user else "-",
            f"{r.analysis.principal:,.2f}" if r.analysis else "-",
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
@router.get("/reports", response_model=List[AnalysisResultSchema])
def get_reports(
    username: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    try:
        query = db.query(AnalysisResult).join(AnalysisResult.analysis).join(AnalysisParameter.user)

        if username:
            query = query.filter(User.username.ilike(f"%{username}%"))
        if start_date:
            query = query.filter(AnalysisResult.generated_at >= start_date)
        if end_date:
            query = query.filter(AnalysisResult.generated_at <= end_date)

        return query.all()

    except Exception as e:
        print("❌ Error fetching reports:", str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch reports.")
