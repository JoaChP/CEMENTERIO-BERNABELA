"""Add optional conocido como to deceased records."""
from alembic import op
import sqlalchemy as sa

revision = "0002_known_as"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("deceased", sa.Column("known_as", sa.String(200), nullable=True))


def downgrade():
    op.drop_column("deceased", "known_as")
