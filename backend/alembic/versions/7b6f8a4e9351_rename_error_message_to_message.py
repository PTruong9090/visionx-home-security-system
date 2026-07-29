"""rename error_message to message

Revision ID: 7b6f8a4e9351
Revises: 49b4e55015e7
Create Date: 2026-07-26 11:15:17.835813

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7b6f8a4e9351'
down_revision: Union[str, Sequence[str], None] = '49b4e55015e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('camera_health_checks', "error_message", new_column_name="message")
    pass


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('camera_health_checks', "message", new_column_name="error_message")
    pass
