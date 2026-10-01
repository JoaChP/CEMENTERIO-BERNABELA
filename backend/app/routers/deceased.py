from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.dependencies import require_admin
from app.models import Deceased
from app.schemas import DeceasedInput, DeceasedPage, DeceasedResponse


router = APIRouter(prefix="/api/deceased", tags=["difuntos"], dependencies=[Depends(require_admin)])


@router.get("", response_model=DeceasedPage)
def list_deceased(
    search: str = Query(default="", max_length=200),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    session: Session = Depends(get_session),
) -> DeceasedPage:
    statement = select(Deceased)
    count_statement = select(func.count()).select_from(Deceased)
    normalized_search = search.strip()
    if normalized_search:
        matching_name = Deceased.full_name.contains(normalized_search, autoescape=True)
        statement = statement.where(matching_name)
        count_statement = count_statement.where(matching_name)
    total = session.scalar(count_statement) or 0
    items = session.scalars(
        statement.order_by(Deceased.full_name, Deceased.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return DeceasedPage(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=DeceasedResponse, status_code=status.HTTP_201_CREATED)
def create_deceased(
    data: DeceasedInput,
    session: Session = Depends(get_session),
) -> Deceased:
    record = Deceased(**data.model_dump())
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


@router.get("/{record_id}", response_model=DeceasedResponse)
def get_deceased(
    record_id: str,
    session: Session = Depends(get_session),
) -> Deceased:
    record = session.get(Deceased, record_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontró el registro solicitado.")
    return record


@router.put("/{record_id}", response_model=DeceasedResponse)
def update_deceased(
    record_id: str,
    data: DeceasedInput,
    session: Session = Depends(get_session),
) -> Deceased:
    record = session.get(Deceased, record_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontró el registro solicitado.")
    for field, value in data.model_dump().items():
        setattr(record, field, value)
    session.commit()
    session.refresh(record)
    return record
