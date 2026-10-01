from datetime import date

from fastapi import Query
from sqlalchemy import or_

from app.models import Deceased


class RecordFilters:
    def __init__(
        self,
        search: str = Query(default="", max_length=200),
        date_of_birth: date | None = None,
        date_of_death: date | None = None,
        burial_date: date | None = None,
        location: str = Query(default="", max_length=200),
    ):
        self.search = search.strip()
        self.date_of_birth = date_of_birth
        self.date_of_death = date_of_death
        self.burial_date = burial_date
        self.location = location.strip()

    def apply(self, statement):
        for word in self.search.split():
            statement = statement.where(or_(
                Deceased.full_name.icontains(word, autoescape=True),
                Deceased.known_as.icontains(word, autoescape=True),
            ))
        for field in ("date_of_birth", "date_of_death", "burial_date"):
            value = getattr(self, field)
            if value is not None:
                statement = statement.where(getattr(Deceased, field) == value)
        for word in self.location.split():
            statement = statement.where(or_(*(column.icontains(word, autoescape=True) for column in (
                Deceased.sector, Deceased.row, Deceased.grave_number,
            ))))
        return statement

    def descriptions(self):
        values = []
        if self.search:
            values.append(f"Nombre, apellidos o CC: {self.search}")
        for field, label in (("date_of_birth", "Nacimiento"), ("date_of_death", "Fallecimiento"), ("burial_date", "Sepultura")):
            value = getattr(self, field)
            if value:
                values.append(f"{label}: {value.strftime('%d/%m/%Y')}")
        if self.location:
            values.append(f"Ubicación: {self.location}")
        return values
