from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from fastapi.responses import Response

from app.core.database import get_session
from app.dependencies import require_admin
from app.models import Deceased
from app.schemas import DeceasedInput, DeceasedPage, DeceasedResponse
from app.record_filters import RecordFilters
from app.records_pdf import build_records_pdf


router = APIRouter(prefix="/api/deceased", tags=["difuntos"], dependencies=[Depends(require_admin)])


@router.get("", response_model=DeceasedPage)
def list_deceased(
    filters: RecordFilters = Depends(),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    session: Session = Depends(get_session),
) -> DeceasedPage:
    statement = filters.apply(select(Deceased))
    count_statement = filters.apply(select(func.count()).select_from(Deceased))
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


@router.get("/export/pdf")
def export_records_pdf(filters: RecordFilters = Depends(), session: Session = Depends(get_session)):
    records = session.scalars(filters.apply(select(Deceased)).order_by(Deceased.full_name, Deceased.id)).all()
    content = build_records_pdf(records, filters)
    return Response(content, media_type="application/pdf", headers={
        "Content-Disposition": 'attachment; filename="registros-campo-santo.pdf"',
        "Cache-Control": "no-store",
    })


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


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deceased(record_id: str, session: Session = Depends(get_session)) -> Response:
    record = session.get(Deceased, record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="No se encontró el registro solicitado.")
    session.delete(record)
    session.commit()
    return Response(status_code=204)
