from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AnalysisCreate(BaseModel):
    description: str
    principal: float
    interest_week: float
    projection_period: int
    tax_rate: float
    additional_deposit: Optional[float] = None
    deposit_frequency: Optional[int] = None
    regular_withdrawal: Optional[float] = None
    withdrawal_frequency: Optional[int] = None
class AnalysisResultSchema(BaseModel):
    id: int
    analysis_id: int
    week: int
    beginning_balance: float
    additional_deposit: float
    interest: float
    profit: float
    withdrawal: float
    tax_deduction: float
    ending_balance: float
    generated_at: Optional[datetime]  # ✅ FIXED: Make it Optional

    class Config:
        from_attributes = True
