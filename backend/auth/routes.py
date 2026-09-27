from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from passlib.context import CryptContext
from backend.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from backend.database import SessionLocal
from backend.auth.hashing import hash_password, verify_password
from backend.auth.deps import create_access_token, get_current_user, get_current_admin
from backend.auth.models import User, Department, Role

router = APIRouter(prefix="/api/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register")
def register(username: str, email: str, full_name: str, password: str, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed = pwd_context.hash(password)
    user = User(username=username, email=email, full_name=full_name, hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User created", "user": user.to_dict()}


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user.to_dict()}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user.to_dict()


@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    return [d.to_dict() for d in db.query(Department).all()]


@router.get("/roles")
def get_roles(db: Session = Depends(get_db)):
    return [r.to_dict() for r in db.query(Role).all()]


@router.get("/users")
def get_users(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return [u.to_dict() for u in db.query(User).all()]


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from backend.auth.models import Token as TokenModel
    from datetime import datetime, timezone
    token = TokenModel(
        user_id=current_user.id,
        token="",
        token_type="access",
        expires_at=datetime.now(timezone.utc),
        is_revoked=True,
    )
    db.add(token)
    db.commit()
    return {"message": "Logged out"}