from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
from datetime import datetime, timedelta

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "mysecret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    is_manager: int = 0

class UserLogin(BaseModel):
    email: str
    password: str

def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = pwd_context.hash(user.password)
    db_user = User(username=user.username, email=user.email, hashed_password=hashed_pw, is_manager=user.is_manager)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"message": "User registered successfully"}

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    
    if not db_user or not pwd_context.verify(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    print("✅ Fetched User from DB:", db_user.username)

    # ✅ ADD username to JWT
    access_token = create_access_token(
        data={
            "sub": db_user.email,
            "user_id": db_user.id,
            "is_manager": db_user.is_manager,
            "username": db_user.username     # ✅ Ensure this is here!
        },
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
