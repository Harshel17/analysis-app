from sqlalchemy import Column, Integer, String, ForeignKey, Float, TIMESTAMP, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_manager = Column(Integer, default=0)  # 0 for user, 1 for manager


class AnalysisParameter(Base):
    __tablename__ = "analysis_parameters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))  # 🔗 Link to user
    description = Column(String, nullable=False)
    principal = Column(Float, nullable=False)
    interest_week = Column(Float, nullable=False)
    projection_period = Column(Integer, nullable=False)
    tax_rate = Column(Float, nullable=True, default=0.0)
    additional_deposit = Column(Float, nullable=True, default=0.0)
    deposit_frequency = Column(Integer, nullable=True, default=1)
    regular_withdrawal = Column(Float, nullable=True, default=0.0)
    withdrawal_frequency = Column(Integer, nullable=True, default=1)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    staging_results = relationship("StagingResult", back_populates="analysis", cascade="all, delete-orphan")
    user = relationship("User")


class StagingResult(Base):
    __tablename__ = "staging_results"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analysis_parameters.id"))
    week = Column(Integer, nullable=False)
    beginning_balance = Column(Float, nullable=False)
    additional_deposit = Column(Float, nullable=True, default=0.0)
    interest = Column(Float, nullable=True, default=0.0)
    profit = Column(Float, nullable=True, default=0.0)
    withdrawal = Column(Float, nullable=True, default=0.0)
    tax_deduction = Column(Float, nullable=True, default=0.0)
    ending_balance = Column(Float, nullable=False)
    generated_at = Column(TIMESTAMP, server_default=func.now())

    analysis = relationship("AnalysisParameter", back_populates="staging_results")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analysis_parameters.id"))
    week = Column(Integer, nullable=False)
    beginning_balance = Column(Float, nullable=False)
    additional_deposit = Column(Float, default=0.0)
    interest = Column(Float, nullable=False)
    profit = Column(Float, nullable=False)
    withdrawal = Column(Float, default=0.0)
    tax_deduction = Column(Float, default=0.0)
    ending_balance = Column(Float, nullable=False)
    generated_at = Column(TIMESTAMP, server_default=func.now())

    analysis = relationship("AnalysisParameter")
