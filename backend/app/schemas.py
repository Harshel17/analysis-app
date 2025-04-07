from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    is_manager: int

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
    
class AnalysisOut(BaseModel):
    id: int
    description: str
    principal: float
    interest_week: float
    projection_period: int
    tax_rate: float
    additional_deposit: Optional[float]
    deposit_frequency: Optional[int]
    regular_withdrawal: Optional[float]
    withdrawal_frequency: Optional[int]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    user: UserOut

class AnalysisWithUserOut(BaseModel):
    id: int
    description: str
    principal: float
    interest_week: float
    projection_period: int
    tax_rate: float
    additional_deposit: Optional[float]
    deposit_frequency: Optional[int]
    regular_withdrawal: Optional[float]
    withdrawal_frequency: Optional[int]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    ending_balance: Optional[float]=None 
    user: Optional[UserOut]
     
    
    class Config:
        from_attributes = True



