from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from typing import List
import logging
from pydantic import BaseModel

# ✅ Define Router
router = APIRouter()

# ✅ Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ✅ UPDATE Analysis Parameters (Editable fields)
class UpdateAnalysisParams(BaseModel):
    additional_deposit: float
    interest_week: float
    regular_withdrawal: float

@router.post("/update-analysis/{analysis_id}")
async def update_analysis(analysis_id: int, params: UpdateAnalysisParams, db: Session = Depends(get_db)):
    """ Update analysis parameters and regenerate results in staging. """
    # Retrieve the existing analysis
    analysis = db.query(models.AnalysisParameter).filter(models.AnalysisParameter.id == analysis_id).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # ✅ Update fields
    analysis.additional_deposit = params.additional_deposit
    analysis.interest_week = params.interest_week
    analysis.regular_withdrawal = params.regular_withdrawal

    # ✅ Commit changes to the database
    db.commit()
    db.refresh(analysis)

    # ✅ Recalculate results after update
    save_analysis_results_to_staging(db, analysis_id, analysis)

    logger.info(f"✅ Analysis {analysis_id} updated successfully")

    return {"message": "Analysis updated successfully", "id": analysis.id}


# ✅ CREATE Analysis with ID in Response
@router.post("/analysis/")
def create_analysis(analysis: schemas.AnalysisCreate, db: Session = Depends(get_db)):
    try:
        logger.info(f"Creating analysis for: {analysis.description}")
        print(f"Creating analysis for: {analysis.description}")  # ✅ Debugging Print

        db_analysis = models.AnalysisParameter(**analysis.dict())
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)

        print(f"✅ Analysis Created with ID: {db_analysis.id}")  # ✅ Debugging Print

        # ✅ Call function to save staging results
        print("Calling save_analysis_results_to_staging now...")  
        save_analysis_results_to_staging(db, db_analysis.id, analysis)
        print("✅ Finished calling save_analysis_results_to_staging")  

        logger.info(f"✅ Analysis Created with ID: {db_analysis.id}")
        return {"id": db_analysis.id, "message": "Analysis successfully created"}

    except Exception as e:
        logger.error(f"🚨 Error creating analysis: {str(e)}")
        print(f"🚨 Error creating analysis: {str(e)}")  # ✅ Debugging Print
        raise HTTPException(status_code=500, detail=str(e))


# ✅ GET Analysis Results by ID (Fetching from STAGING)
@router.get("/results/{analysis_id}", response_model=List[schemas.AnalysisResultSchema])
def get_results(analysis_id: int, db: Session = Depends(get_db)):
    results = db.query(models.StagingResult).filter(models.StagingResult.analysis_id == analysis_id).all()

    if not results:
        logger.warning(f"No results found in STAGING TABLE for analysis ID {analysis_id}")
        raise HTTPException(status_code=404, detail="No results found for this analysis in staging table")

    return results


# ✅ Move Data from Staging to Permanent Table
@router.post("/move-to-permanent/{analysis_id}")
def move_to_permanent(analysis_id: int, db: Session = Depends(get_db)):
    try:
        staging_results = db.query(models.StagingResult).filter(models.StagingResult.analysis_id == analysis_id).all()
        if not staging_results:
            raise HTTPException(status_code=404, detail="No staging data found")

        # ✅ Move staging data to permanent table
        permanent_results = [
            models.AnalysisResult(
                analysis_id=result.analysis_id,
                week=result.week,
                beginning_balance=result.beginning_balance,
                additional_deposit=result.additional_deposit,
                interest=result.interest,
                profit=result.profit,
                withdrawal=result.withdrawal,
                tax_deduction=result.tax_deduction,
                ending_balance=result.ending_balance
            ) for result in staging_results
        ]

        db.bulk_save_objects(permanent_results)
        db.commit()

        # ✅ Delete from Staging Table
        db.query(models.StagingResult).filter(models.StagingResult.analysis_id == analysis_id).delete()
        db.commit()

        logger.info(f"✅ Analysis {analysis_id} moved to permanent table")
        return {"message": "Data successfully moved to permanent table"}

    except Exception as e:
        db.rollback()
        logger.error(f"🚨 Failed to move data: {str(e)}")
        return {"error": f"Failed to move data: {str(e)}"}


# ✅ GET Only Saved (Permanent) Results
@router.get("/permanent-results/{analysis_id}", response_model=List[schemas.AnalysisResultSchema])
def get_permanent_results(analysis_id: int, db: Session = Depends(get_db)):
    results = db.query(models.AnalysisResult).filter(models.AnalysisResult.analysis_id == analysis_id).all()

    if not results:
        raise HTTPException(status_code=404, detail="No saved results found for this analysis")

    return results

def save_analysis_results_to_staging(db: Session, analysis_id: int, analysis: schemas.AnalysisCreate):
    try:
        print(f"🚀 Saving results to STAGING TABLE for analysis ID: {analysis_id}")  # ✅ Debugging Print
        logger.info(f"Saving results to STAGING TABLE for analysis ID: {analysis_id}")

        # 🧹 Delete any existing results for this analysis_id
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

            # ✅ Print values to ensure calculations are happening
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
            beginning_balance = ending_balance  # Update for next week

        # ✅ Print how many results are being saved
        print(f"✅ Attempting to save {len(results)} results to staging_results...")

        db.bulk_save_objects(results)
        db.flush()  # Ensure all objects are staged
        db.commit()

        # ✅ Verify data is inserted
        staging_data = db.query(models.StagingResult).filter(models.StagingResult.analysis_id == analysis_id).all()
        print(f"DEBUG: Retrieved {len(staging_data)} records from STAGING TABLE")

        logger.info(f"✅ Successfully saved {len(results)} results to STAGING TABLE for analysis ID {analysis_id}")

    except Exception as e:
        db.rollback()
        logger.error(f"🚨 Error saving to STAGING TABLE: {str(e)}")
        print(f"🚨 Error saving to STAGING TABLE: {str(e)}")
        raise HTTPException(status_code=500, detail="Error saving to Staging Table")

# ✅ Save Analysis Results to Staging Table

@router.get("/analysis/{analysis_id}", response_model=schemas.AnalysisCreate)
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
