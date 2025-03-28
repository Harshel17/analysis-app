from sqlalchemy.orm import Session
from app.models import AnalysisResult
from app.schemas import AnalysisCreate
from datetime import datetime

def calculate_analysis_results(db: Session, analysis: AnalysisCreate):
    results = []
    beginning_balance = analysis.principal
    tax_rate = analysis.tax_rate / 100  # Convert to decimal
    interest_rate = analysis.interest_week / 100  # Convert to decimal
    
    for week in range(1, analysis.projection_period + 1):
        interest = beginning_balance * interest_rate
        profit = interest
        tax = profit * tax_rate if tax_rate > 0 else 0
        additional_deposit = analysis.additional_deposit if (week % analysis.deposit_frequency == 0) else 0
        withdrawal = analysis.regular_withdrawal if (week % analysis.withdrawal_frequency == 0) else 0

        ending_balance = beginning_balance + additional_deposit + profit - withdrawal - tax
        
        # Store results in a list
        results.append({
            "week": week,
            "beginning_balance": beginning_balance,
            "additional_deposit": additional_deposit,
            "interest": interest,
            "profit": profit,
            "tax_deduction": tax,
            "withdrawal": withdrawal,
            "ending_balance": ending_balance
        })

        # Move to next week
        beginning_balance = ending_balance

    return results
def create_analysis(db: Session, analysis: AnalysisCreate):
    new_analysis = AnalysisParameter(
        description=analysis.description,
        principal=analysis.principal,
        interest_week=analysis.interest_week,
        projection_period=analysis.projection_period,
        tax_rate=analysis.tax_rate,
        additional_deposit=analysis.additional_deposit,
        deposit_frequency=analysis.deposit_frequency,
        regular_withdrawal=analysis.regular_withdrawal,
        withdrawal_frequency=analysis.withdrawal_frequency
    )
    db.add(new_analysis)
    db.commit()
    db.refresh(new_analysis)

    # Compute financial results
    results = calculate_analysis_results(db, analysis)
    
    # Store results in DB
    for result in results:
        db_result = AnalysisResult(
            analysis_id=new_analysis.id,
            week=result["week"],
            beginning_balance=result["beginning_balance"],
            additional_deposit=result["additional_deposit"],
            interest=result["interest"],
            profit=result["profit"],
            tax_deduction=result["tax_deduction"],
            withdrawal=result["withdrawal"],
            ending_balance=result["ending_balance"],
            generated_at=datetime.utcnow()
        )
        db.add(db_result)

    db.commit()
    
    return new_analysis
