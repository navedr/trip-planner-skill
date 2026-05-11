"""Scraping provider — add users.scraping_provider column.

Revision ID: 003_scraping_provider
Revises: 002_push_notifications
Create Date: 2026-05-09
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003_scraping_provider"
down_revision: Union[str, None] = "002_push_notifications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("scraping_provider", sa.Text(), nullable=True, server_default="selenium"),
    )


def downgrade() -> None:
    op.drop_column("users", "scraping_provider")
