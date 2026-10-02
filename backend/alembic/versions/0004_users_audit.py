"""User roles, account status and administrative audit trail."""
from alembic import op
import sqlalchemy as sa
revision = '0004_users_audit'
down_revision = '0003_satellite_locations'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('administrators', sa.Column('full_name', sa.String(200), nullable=False, server_default=''))
    op.add_column('administrators', sa.Column('role', sa.String(20), nullable=False, server_default='administrator'))
    op.add_column('administrators', sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column('administrators', sa.Column('session_version', sa.Integer(), nullable=False, server_default='0'))
    op.create_table('audit_logs', sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('actor_id', sa.String(36), nullable=False), sa.Column('actor_username', sa.String(80), nullable=False),
        sa.Column('action', sa.String(40), nullable=False), sa.Column('entity_type', sa.String(20), nullable=False),
        sa.Column('entity_id', sa.String(36), nullable=False), sa.Column('entity_name', sa.String(200), nullable=False),
        sa.Column('before', sa.JSON(), nullable=True), sa.Column('after', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False))
    for column in ['actor_id', 'action', 'created_at']:
        op.create_index(f'ix_audit_logs_{column}', 'audit_logs', [column])


def downgrade():
    op.drop_table('audit_logs')
    for column in ['session_version', 'is_active', 'role', 'full_name']:
        op.drop_column('administrators', column)
