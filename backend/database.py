from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.pool import NullPool
from contextlib import contextmanager
from backend.config import DATABASE_URL, DATABASE_URL_READ

is_sqlite = DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {"options": "-c timezone=utc"}

engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,
    echo=False,
    connect_args=connect_args
)

read_engine = create_engine(
    DATABASE_URL_READ if DATABASE_URL_READ else DATABASE_URL,
    poolclass=NullPool,
    echo=False,
    connect_args=connect_args
)

SessionLocal = sessionmaker(bind=engine, class_=Session, expire_on_commit=False)
ReadSessionLocal = sessionmaker(bind=read_engine, class_=Session, expire_on_commit=False)

Base = declarative_base()


@contextmanager
def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@contextmanager
def get_read_db() -> Session:
    db = ReadSessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    if not is_sqlite:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
            conn.commit()
    try:
        import backend.models.detection  # noqa: F401
    except Exception:
        pass
    Base.metadata.create_all(bind=engine)

init_db()