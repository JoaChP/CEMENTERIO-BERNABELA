from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.core.config import settings


password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def create_access_token(subject: str, version: int = 0) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.session_expire_hours)
    return jwt.encode({"sub": subject, "exp": expires_at, "version": version}, settings.jwt_secret, algorithm="HS256")


def session_version_matches(token: str, version: int) -> bool:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=['HS256']).get('version', 0) == version
    except jwt.PyJWTError:
        return False


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    subject = payload.get("sub")
    return subject if isinstance(subject, str) else None
