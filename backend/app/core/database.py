from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine_options = {"pool_pre_ping": True}
if settings.database_url.startswith("postgresql"):
    # Cap connections per function instance; transaction poolers do not support
    # prepared statements.
    engine_options.update(pool_size=1, max_overflow=0, pool_recycle=300)
    if settings.database_url.startswith("postgresql+psycopg:"):
        engine_options["connect_args"] = {"prepare_threshold": None}
engine = create_engine(settings.database_url, **engine_options)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
