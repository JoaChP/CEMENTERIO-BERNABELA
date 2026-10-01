from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class AdminLogin(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=256)


class AdminResponse(BaseModel):
    id: str
    username: str


class DeceasedInput(BaseModel):
    full_name: str = Field(min_length=1, max_length=200)
    date_of_birth: date | None = None
    date_of_death: date
    burial_date: date
    sector: str = Field(min_length=1, max_length=120)
    row: str | None = Field(default=None, max_length=120)
    grave_number: str = Field(min_length=1, max_length=120)
    notes: str | None = None

    @field_validator("full_name", "sector", "grave_number", mode="before")
    @classmethod
    def required_text_is_not_blank(cls, value: object) -> object:
        if isinstance(value, str):
            value = value.strip()
            if not value:
                raise ValueError("Este campo es obligatorio.")
        return value

    @field_validator("row", "notes", mode="before")
    @classmethod
    def normalize_optional_text(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip() or None
        return value

    @model_validator(mode="after")
    def validate_date_order(self) -> "DeceasedInput":
        if self.date_of_birth and self.date_of_birth > self.date_of_death:
            raise ValueError("La fecha de nacimiento no puede ser posterior al fallecimiento.")
        if self.burial_date < self.date_of_death:
            raise ValueError("La fecha de sepultura no puede ser anterior al fallecimiento.")
        return self


class DeceasedResponse(DeceasedInput):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class DeceasedPage(BaseModel):
    items: list[DeceasedResponse]
    total: int
    page: int
    page_size: int
