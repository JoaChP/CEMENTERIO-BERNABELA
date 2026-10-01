"""Create administrator and deceased tables.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-10-01
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "administrators",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("username", sa.String(length=80), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_administrators_username", "administrators", ["username"], unique=True)
    op.create_table(
        "deceased",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("date_of_death", sa.Date(), nullable=False),
        sa.Column("burial_date", sa.Date(), nullable=False),
        sa.Column("sector", sa.String(length=120), nullable=False),
        sa.Column("row", sa.String(length=120), nullable=True),
        sa.Column("grave_number", sa.String(length=120), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_deceased_full_name", "deceased", ["full_name"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_deceased_full_name", table_name="deceased")
    op.drop_table("deceased")
    op.drop_index("ix_administrators_username", table_name="administrators")
    op.drop_table("administrators")
