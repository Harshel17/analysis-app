from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
from io import StringIO
from datetime import datetime
import csv
import pytz
from pytz.exceptions import UnknownTimeZoneError

from app.database import get_db
from app.models import AnalysisResult, AnalysisParameter, User
from app.utils.auth_utils import get_current_manager

router = APIRouter()

@router.get("/manager/reports/financial")
def generate_financial_report(
    username: str = Query(None, description="Filter by username"),
    start_date: str = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(None, description="End date (YYYY-MM-DD)"),
    timezone: str = Query("UTC", description="Client timezone"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    try:
        print(f"🔍 Generating report for: username='{username}', start_date='{start_date}', end_date='{end_date}', timezone='{timezone}'")

        # ✅ Validate timezone
        try:
            tz = pytz.timezone(timezone)
        except UnknownTimeZoneError:
            raise HTTPException(status_code=400, detail="Invalid timezone provided.")

        # 🔍 Build query
        query = (
            db.query(AnalysisResult)
            .join(AnalysisResult.analysis)
            .join(AnalysisParameter.user)
            .filter(AnalysisResult.generated_at.isnot(None))
        )

        if username:
            query = query.filter(User.username.ilike(f"%{username}%"))

        if start_date:
            start_utc = tz.localize(datetime.strptime(start_date, "%Y-%m-%d")).astimezone(pytz.UTC)
            query = query.filter(AnalysisResult.generated_at >= start_utc)

        if end_date:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
            end_utc = tz.localize(end_dt.replace(hour=23, minute=59, second=59)).astimezone(pytz.UTC)
            query = query.filter(AnalysisResult.generated_at <= end_utc)

        results = query.all()
        print(f"✅ Found {len(results)} records for export")

        # 📦 Create CSV
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Username", "Description", "Principal", "Ending Balance", "Generated At"])

        results.sort(key=lambda x: (x.analysis.description if x.analysis else ""))  # sort by description
        last_description = None

        for r in results:
            if not r.analysis:
                continue

            current_desc = r.analysis.description

            # Add empty line between analysis groups
            if last_description and current_desc != last_description:
                writer.writerow([])

            # Convert time to user timezone
            if r.generated_at:
                aware_dt = r.generated_at
                if aware_dt.tzinfo is None:
                    aware_dt = pytz.UTC.localize(aware_dt)
                local_time = aware_dt.astimezone(tz)
                formatted_time = local_time.strftime("%Y-%m-%d %H:%M:%S")
            else:
                formatted_time = "-"

            writer.writerow([
                r.id,
                r.analysis.user.username if r.analysis.user else "-",
                current_desc,
                f"{r.analysis.principal:,.2f}",
                f"{r.ending_balance or 0:,.2f}",
                formatted_time
            ])

            last_description = current_desc

        output.seek(0)
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=financial_report.csv"}
        )

    except Exception as e:
        print("❌ Report generation error:", str(e))
        raise HTTPException(status_code=500, detail="Report generation failed.")
