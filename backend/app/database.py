from dotenv import load_dotenv
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.base import Base

# Load .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

# Fetch DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in the environment variables")

# SQLAlchemy Setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Function to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
