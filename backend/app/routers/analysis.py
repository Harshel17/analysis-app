from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from typing import List
import logging
from pydantic import BaseModel
from app.utils.auth_utils import get_current_user
from app.models import User
from app.schemas import AnalysisCreate
from ..oauth import get_current_user
from datetime import datetime
import pytz

# ✅ Define Router
router = APIRouter()

# ✅ Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ✅ UPDATE Analysis Parameters (Editable fields)
class UpdateAnalysisParams(BaseModel):
    description: str
    principal: float
    interest_week: float
    projection_period: int
    tax_rate: float
    additional_deposit: float
    deposit_frequency: int
    regular_withdrawal: float
    withdrawal_frequency: int

# ✅ CREATE Analysis with user ID
@router.post("/analysis/")
def create_analysis(data: AnalysisCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        logger.info(f"Creating analysis for: {data.description} by user {current_user.id}")
        print(f"Creating analysis for: {data.description}")

        db_analysis = models.AnalysisParameter(**data.dict(), user_id=current_user.id)
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)

        print(f"✅ Analysis Created with ID: {db_analysis.id}")
        print("Calling save_analysis_results_to_staging now...")
        save_analysis_results_to_staging(db, db_analysis.id, data)
        print("✅ Finished calling save_analysis_results_to_staging")

        logger.info(f"✅ Analysis Created with ID: {db_analysis.id}")
        return {"id": db_analysis.id, "message": "Analysis successfully created"}

    except Exception as e:
        logger.error(f"🚨 Error creating analysis: {str(e)}")
        print(f"🚨 Error creating analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update-analysis/{analysis_id}")
async def update_analysis(analysis_id: int, params: UpdateAnalysisParams, db: Session = Depends(get_db)):
    analysis = db.query(models.AnalysisParameter).filter(models.AnalysisParameter.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    analysis.description = params.description
    analysis.principal = params.principal
    analysis.interest_week = params.interest_week
    analysis.projection_period = params.projection_period
    analysis.tax_rate = params.tax_rate
    analysis.additional_deposit = params.additional_deposit
    analysis.deposit_frequency = params.deposit_frequency
    analysis.regular_withdrawal = params.regular_withdrawal
    analysis.withdrawal_frequency = params.withdrawal_frequency

    db.commit()
    db.refresh(analysis)

    updated_data = AnalysisCreate(
        description=analysis.description,
        principal=analysis.principal,
        interest_week=analysis.interest_week,
        projection_period=analysis.projection_period,
        tax_rate=analysis.tax_rate,
        additional_deposit=analysis.additional_deposit,
        deposit_frequency=analysis.deposit_frequency,
        regular_withdrawal=analysis.regular_withdrawal,
        withdrawal_frequency=analysis.withdrawal_frequency,
    )

    save_analysis_results_to_staging(db, analysis_id, updated_data)
    logger.info(f"✅ Analysis {analysis_id} updated successfully")

    return {
        "id": analysis.id,
        "description": analysis.description,
        "principal": analysis.principal,
        "interest_week": analysis.interest_week,
        "projection_period": analysis.projection_period,
        "tax_rate": analysis.tax_rate,
        "additional_deposit": analysis.additional_deposit,
        "deposit_frequency": analysis.deposit_frequency,
        "regular_withdrawal": analysis.regular_withdrawal,
        "withdrawal_frequency": analysis.withdrawal_frequency,
        "user_id": analysis.user_id
    }

@router.get("/analysis/{analysis_id}", response_model=schemas.AnalysisOut)
def get_analysis_by_id(analysis_id: int, db: Session = Depends(get_db)):
    analysis = db.query(models.AnalysisParameter).filter(models.AnalysisParameter.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis

@router.get("/results/{analysis_id}", response_model=List[schemas.AnalysisResultSchema])
def get_results(analysis_id: int, db: Session = Depends(get_db)):
    results = db.query(models.StagingResult).filter(models.StagingResult.analysis_id == analysis_id).all()
    if not results:
        logger.warning(f"No results found in STAGING TABLE for analysis ID {analysis_id}")
        raise HTTPException(status_code=404, detail="No results found for this analysis in staging table")
    return results

@router.get("/permanent-results/{analysis_id}", response_model=List[schemas.AnalysisResultSchema])
def get_permanent_results(analysis_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    analysis = db.query(models.AnalysisParameter).filter(models.AnalysisParameter.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    if not current_user.is_manager and analysis.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this analysis")

    results = db.query(models.AnalysisResult).filter(models.AnalysisResult.analysis_id == analysis_id).all()
    if not results:
        raise HTTPException(status_code=404, detail="No saved results found for this analysis")
    return results

@router.get("/saved-analysis", response_model=List[schemas.AnalysisOut])
def get_saved_analyses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.is_manager:
        return db.query(models.AnalysisParameter).all()
    return db.query(models.AnalysisParameter).filter(models.AnalysisParameter.user_id == current_user.id).all()

@router.post("/move-to-permanent/{analysis_id}")
def move_to_permanent(analysis_id: int, db: Session = Depends(get_db)):
    try:
        # ✅ 1. Fetch staging results
        staging_results = db.query(models.StagingResult).filter(models.StagingResult.analysis_id == analysis_id).all()
        if not staging_results:
            raise HTTPException(status_code=404, detail="No staging data found")

        # ✅ 2. Delete old permanent analysis results
        db.query(models.AnalysisResult).filter(models.AnalysisResult.analysis_id == analysis_id).delete()
        db.commit()

        # ✅ 3. Delete old permanent weekly breakdowns
        db.query(models.PermanentResult).filter(models.PermanentResult.analysis_id == analysis_id).delete()
        db.commit()

        # ✅ 4. Move analysis-level final result
        permanent_results = []
        for result in staging_results:
            permanent = models.AnalysisResult(
                analysis_id=result.analysis_id,
                week=result.week,
                beginning_balance=result.beginning_balance,
                additional_deposit=result.additional_deposit,
                interest=result.interest,
                profit=result.profit,
                withdrawal=result.withdrawal,
                tax_deduction=result.tax_deduction,
                ending_balance=result.ending_balance,
                generated_at=datetime.now(pytz.UTC)
            )
            permanent_results.append(permanent)

        db.bulk_save_objects(permanent_results)
        db.commit()

        # ✅ 5. Move weekly breakdown to permanent_results
        permanent_weekly = []
        for sr in staging_results:
            permanent_row = models.PermanentResult(
                analysis_id=sr.analysis_id,
                week=sr.week,
                beginning_balance=sr.beginning_balance,
                additional_deposit=sr.additional_deposit,
                profit=sr.profit,
                withdrawal=sr.withdrawal,
                tax_deduction=sr.tax_deduction,
                ending_balance=sr.ending_balance,
                generated_at=sr.generated_at,
            )
            permanent_weekly.append(permanent_row)

        db.bulk_save_objects(permanent_weekly)
        db.commit()

        # ✅ 6. Clean up staging table
        db.query(models.StagingResult).filter(models.StagingResult.analysis_id == analysis_id).delete()
        db.commit()

        logger.info(f"✅ Analysis {analysis_id} moved to permanent table (including weekly results)")
        return {"message": "Data successfully moved to permanent tables"}

    except Exception as e:
        db.rollback()
        logger.error(f"🚨 Failed to move data: {str(e)}")
        return {"error": f"Failed to move data: {str(e)}"}



def save_analysis_results_to_staging(db: Session, analysis_id: int, analysis: schemas.AnalysisCreate):
    try:
        print(f"🚀 Saving results to STAGING TABLE for analysis ID: {analysis_id}")
        logger.info(f"Saving results to STAGING TABLE for analysis ID: {analysis_id}")

        deleted_rows = db.query(models.StagingResult).filter(models.StagingResult.analysis_id == analysis_id).delete()
        print(f"🧹 Cleared {deleted_rows} old records from STAGING TABLE")
        logger.info(f"🧹 Cleared {deleted_rows} old records from STAGING TABLE")

        beginning_balance = analysis.principal
        results = []

        for week in range(1, analysis.projection_period + 1):
            print(f"DEBUG: Generating week {week}, balance: {beginning_balance}")

            interest = beginning_balance * (analysis.interest_week / 100)
            profit = interest
            tax_deduction = profit * (analysis.tax_rate / 100)
            additional_deposit = analysis.additional_deposit if week % analysis.deposit_frequency == 0 else 0
            withdrawal = analysis.regular_withdrawal if week % analysis.withdrawal_frequency == 0 else 0
            ending_balance = beginning_balance + additional_deposit + profit - withdrawal - tax_deduction

            print(f"Week {week}: Beginning: {beginning_balance}, Deposit: {additional_deposit}, Interest: {interest}, Withdrawal: {withdrawal}, Ending: {ending_balance}")

            new_result = models.StagingResult(
                analysis_id=analysis_id,
                week=week,
                beginning_balance=beginning_balance,
                additional_deposit=additional_deposit,
                interest=interest,
                profit=profit,
                withdrawal=withdrawal,
                tax_deduction=tax_deduction,
                ending_balance=ending_balance
            )

            results.append(new_result)
            beginning_balance = ending_balance

        print(f"✅ Attempting to save {len(results)} results to staging_results...")
        db.bulk_save_objects(results)
        db.flush()
        db.commit()

        staging_data = db.query(models.StagingResult).filter(models.StagingResult.analysis_id == analysis_id).all()
        print(f"DEBUG: Retrieved {len(staging_data)} records from STAGING TABLE")
        logger.info(f"✅ Successfully saved {len(results)} results to STAGING TABLE for analysis ID {analysis_id}")

    except Exception as e:
        db.rollback()
        logger.error(f"🚨 Error saving to STAGING TABLE: {str(e)}")
        print(f"🚨 Error saving to STAGING TABLE: {str(e)}")
        raise HTTPException(status_code=500, detail="Error saving to Staging Table")

@router.get("/manager/all-analyses", response_model=List[schemas.AnalysisWithUserOut])
def get_all_analyses_for_manager(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.is_manager:
        raise HTTPException(status_code=403, detail="Access denied")

    analyses = db.query(models.AnalysisParameter).all()
    return analyses
