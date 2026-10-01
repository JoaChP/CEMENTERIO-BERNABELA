from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_session
from app.core.security import create_access_token, verify_password
from app.dependencies import SESSION_COOKIE, require_admin
from app.models import Administrator
from app.schemas import AdminLogin, AdminResponse


router = APIRouter(prefix="/api/auth", tags=["autenticación"])


def admin_response(admin: Administrator) -> AdminResponse:
    return AdminResponse(id=admin.id, username=admin.username)


@router.post("/login", response_model=AdminResponse)
def login(credentials: AdminLogin, response: Response, session: Session = Depends(get_session)) -> AdminResponse:
    admin = session.scalar(select(Administrator).where(Administrator.username == credentials.username.strip()))
    if admin is None or not verify_password(credentials.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario o contraseña incorrectos.")

    response.set_cookie(
        key=SESSION_COOKIE,
        value=create_access_token(admin.id),
        max_age=settings.session_expire_hours * 60 * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/",
    )
    return admin_response(admin)


@router.get("/me", response_model=AdminResponse)
def current_admin(admin: Administrator = Depends(require_admin)) -> AdminResponse:
    return admin_response(admin)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> Response:
    response.delete_cookie(key=SESSION_COOKIE, path="/", httponly=True, secure=settings.cookie_secure, samesite=settings.cookie_samesite)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response
