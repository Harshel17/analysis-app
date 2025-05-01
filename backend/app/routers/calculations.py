from app import models

def recalculate_analysis(analysis: models.AnalysisParameter):
    results = []
    beginning_balance = analysis.principal

    for week in range(1, analysis.projection_period + 1):
        interest = beginning_balance * (analysis.interest_week / 100)
        profit = interest
        tax_deduction = profit * (analysis.tax_rate / 100)

        additional_deposit = analysis.additional_deposit if analysis.deposit_frequency and week % analysis.deposit_frequency == 0 else 0
        withdrawal = analysis.regular_withdrawal if analysis.withdrawal_frequency and week % analysis.withdrawal_frequency == 0 else 0

        ending_balance = beginning_balance + additional_deposit + profit - withdrawal - tax_deduction

        new_result = models.AnalysisResult(
            analysis_id=analysis.id,
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

    return results
