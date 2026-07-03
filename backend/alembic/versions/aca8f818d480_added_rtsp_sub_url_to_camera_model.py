"""added rtsp sub url to camera model

Revision ID: aca8f818d480
Revises: eb5257c4b45e
Create Date: 2026-07-02 22:44:49.571164

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aca8f818d480'
down_revision: Union[str, Sequence[str], None] = 'eb5257c4b45e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
