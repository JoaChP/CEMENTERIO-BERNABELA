from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.core.security import decode_access_token, session_version_matches
from app.models import Administrator


SESSION_COOKIE = "bernabela_session"


def require_admin(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE),
    session: Session = Depends(get_session),
) -> Administrator:
    if not session_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión no válida o expirada.")
    subject = decode_access_token(session_token)
    admin = session.get(Administrator, subject) if subject else None
    if admin is None or not admin.is_active or not session_version_matches(session_token, admin.session_version):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión no válida o expirada.")
    return admin


def require_manager(user: Administrator = Depends(require_admin)) -> Administrator:
    if user.role != 'administrator':
        raise HTTPException(403, 'Esta función está reservada a administradores.')
    return user
