"""Add satellite image positions and make grave number optional."""
from alembic import op
import sqlalchemy as sa

revision = '0003_satellite_locations'
down_revision = '0002_known_as'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('deceased') as batch:
        batch.alter_column('grave_number', existing_type=sa.String(120), nullable=True)
        batch.add_column(sa.Column('map_x', sa.Float(), nullable=True))
        batch.add_column(sa.Column('map_y', sa.Float(), nullable=True))


def downgrade():
    op.execute(sa.text("UPDATE deceased SET grave_number = '' WHERE grave_number IS NULL"))
    with op.batch_alter_table('deceased') as batch:
        batch.drop_column('map_x')
        batch.drop_column('map_y')
        batch.alter_column('grave_number', existing_type=sa.String(120), nullable=False)
