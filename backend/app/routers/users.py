from datetime import date, datetime, time, timedelta, timezone
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.database import get_session
from app.core.security import hash_password, verify_password
from app.dependencies import require_admin, require_manager
from app.models import Administrator, AuditLog
from app.audit import log_action, user_snapshot

router = APIRouter(prefix='/api/users', tags=['usuarios'])


class UserInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    full_name: str = Field(min_length=1, max_length=200)
    username: str = Field(min_length=3, max_length=80, pattern=r'^[a-zA-Z0-9._-]+$')
    role: Literal['administrator', 'operator'] = 'operator'
    is_active: bool = True


class UserCreate(UserInput):
    password: str = Field(min_length=8, max_length=256)


class PasswordInput(BaseModel):
    password: str = Field(min_length=8, max_length=256)


class OwnPasswordInput(PasswordInput):
    current_password: str


def find_user(session, user_id):
    user = session.get(Administrator, user_id)
    if not user:
        raise HTTPException(404, 'No se encontró el usuario.')
    return user


def save(session):
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(409, 'Ese nombre de usuario ya existe.') from None


@router.get('')
def list_users(actor=Depends(require_manager), session: Session = Depends(get_session)):
    return [dict(id=user.id, **user_snapshot(user)) for user in session.scalars(select(Administrator).order_by(Administrator.username))]


@router.post('', status_code=201)
def create_user(data: UserCreate, actor=Depends(require_manager), session: Session = Depends(get_session)):
    user = Administrator(**data.model_dump(exclude={'password'}), password_hash=hash_password(data.password))
    session.add(user)
    try:
        session.flush()
    except IntegrityError:
        session.rollback()
        raise HTTPException(409, 'Ese nombre de usuario ya existe.') from None
    log_action(session, actor, 'user.create', 'user', user.id, user.username, after=user_snapshot(user))
    save(session)
    return dict(id=user.id, **user_snapshot(user))


@router.put('/me/password', status_code=204)
def change_own_password(data: OwnPasswordInput, actor=Depends(require_admin), session: Session = Depends(get_session)):
    if not verify_password(data.current_password, actor.password_hash):
        raise HTTPException(400, 'La contraseña actual es incorrecta.')
    actor.password_hash = hash_password(data.password)
    actor.session_version += 1
    log_action(session, actor, 'user.password_change', 'user', actor.id, actor.username)
    session.commit()


@router.put('/{user_id}')
def update_user(user_id: str, data: UserInput, actor=Depends(require_manager), session: Session = Depends(get_session)):
    # Serialize administrator changes so concurrent requests cannot remove the final administrator.
    session.execute(select(Administrator).where(Administrator.role == 'administrator').with_for_update()).scalars().all()
    user = find_user(session, user_id)
    if user.id == actor.id and (not data.is_active or data.role != 'administrator'):
        raise HTTPException(400, 'No podés desactivar tu propia cuenta ni quitarte el rol de administrador.')
    if user.role == 'administrator' and user.is_active and (not data.is_active or data.role != 'administrator'):
        total = session.scalar(select(func.count()).select_from(Administrator).where(Administrator.role == 'administrator', Administrator.is_active.is_(True)))
        if total <= 1:
            raise HTTPException(400, 'Debe permanecer al menos un administrador activo.')
    before = user_snapshot(user)
    for key, value in data.model_dump().items():
        setattr(user, key, value)
    if before != user_snapshot(user):
        user.session_version += 1
        log_action(session, actor, 'user.update', 'user', user.id, user.username, before, user_snapshot(user))
    save(session)
    return dict(id=user.id, **user_snapshot(user))


@router.put('/{user_id}/password', status_code=204)
def reset_password(user_id: str, data: PasswordInput, actor=Depends(require_manager), session: Session = Depends(get_session)):
    user = find_user(session, user_id)
    user.password_hash = hash_password(data.password)
    user.session_version += 1
    log_action(session, actor, 'user.password_reset', 'user', user.id, user.username)
    session.commit()


audit_router = APIRouter(prefix='/api/audit', tags=['auditoría'], dependencies=[Depends(require_manager)])


@audit_router.get('')
def list_audit(actor: str = Query(default='', max_length=80), action: str = Query(default='', max_length=40),
    start_date: date | None = None, end_date: date | None = None, page: int = Query(default=1, ge=1), session: Session = Depends(get_session)):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(400, 'La fecha inicial debe ser anterior a la fecha final.')
    statement = select(AuditLog)
    if actor:
        statement = statement.where(AuditLog.actor_username.icontains(actor, autoescape=True))
    if action:
        statement = statement.where(AuditLog.action == action)
    cr = timezone(timedelta(hours=-6))
    if start_date:
        statement = statement.where(AuditLog.created_at >= datetime.combine(start_date, time.min, cr))
    if end_date:
        statement = statement.where(AuditLog.created_at < datetime.combine(end_date + timedelta(days=1), time.min, cr))
    total = session.scalar(select(func.count()).select_from(statement.subquery()))
    items = session.scalars(statement.order_by(AuditLog.created_at.desc(), AuditLog.id).offset((page-1)*20).limit(20)).all()
    return {'total': total, 'items': [dict(id=item.id, actor_username=item.actor_username, action=item.action,
        entity_type=item.entity_type, entity_name=item.entity_name, before=item.before, after=item.after,
        created_at=item.created_at.replace(tzinfo=timezone.utc) if item.created_at.tzinfo is None else item.created_at) for item in items]}
