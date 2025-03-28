from sqlalchemy import Column, Integer, String, ForeignKey, Float, TIMESTAMP,DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
from datetime import datetime
from app.database import SessionLocal
from app.routers import analysis
from app import models  # Ensure models are imported correctly
from app.schemas import AnalysisCreate  # Ensure schema exists
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)


class StagingResult(Base):
    __tablename__ = "staging_results"  # Ensure this matches your DB

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


class AnalysisParameter(Base):
    __tablename__ = "analysis_parameters"  # ✅ Must match DB

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False)
    principal = Column(Float, nullable=False)
    interest_week = Column(Float, nullable=False)
    projection_period = Column(Integer, nullable=False)
    tax_rate = Column(Float, nullable=True, default=0.0)
    additional_deposit = Column(Float, nullable=True, default=0.0)
    deposit_frequency = Column(Integer, nullable=True, default=1)
    regular_withdrawal = Column(Float, nullable=True, default=0.0)
    withdrawal_frequency = Column(Integer, nullable=True, default=1)

    staging_results = relationship("StagingResult", back_populates="analysis", cascade="all, delete-orphan")


from sqlalchemy.sql import func

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
    generated_at = Column(TIMESTAMP, server_default=func.now())  # ✅ FIXED

    analysis = relationship("AnalysisParameter")
