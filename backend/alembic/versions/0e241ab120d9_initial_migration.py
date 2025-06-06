"""Initial migration

Revision ID: 0e241ab120d9
Revises: 
Create Date: 2025-03-20 13:13:42.119596

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0e241ab120d9'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('analysis_parameters',
    sa.Column('analysis_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('parameter_1', sa.String(), nullable=True),
    sa.Column('parameter_2', sa.String(), nullable=True),
    sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
    sa.PrimaryKeyConstraint('analysis_id')
    )
    op.create_index(op.f('ix_analysis_parameters_analysis_id'), 'analysis_parameters', ['analysis_id'], unique=False)
    op.create_table('analysis_results',
    sa.Column('result_id', sa.Integer(), nullable=False),
    sa.Column('analysis_id', sa.Integer(), nullable=True),
    sa.Column('result_1', sa.String(), nullable=True),
    sa.Column('result_2', sa.String(), nullable=True),
    sa.Column('generated_at', sa.TIMESTAMP(), nullable=False),
    sa.ForeignKeyConstraint(['analysis_id'], ['analysis_parameters.analysis_id'], ),
    sa.PrimaryKeyConstraint('result_id')
    )
    op.create_index(op.f('ix_analysis_results_result_id'), 'analysis_results', ['result_id'], unique=False)
    op.drop_table('users')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('users',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('name', sa.VARCHAR(length=100), autoincrement=False, nullable=False),
    sa.Column('email', sa.VARCHAR(length=100), autoincrement=False, nullable=False),
    sa.Column('created_at', postgresql.TIMESTAMP(), server_default=sa.text('now()'), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('id', name='users_pkey'),
    sa.UniqueConstraint('email', name='users_email_key')
    )
    op.drop_index(op.f('ix_analysis_results_result_id'), table_name='analysis_results')
    op.drop_table('analysis_results')
    op.drop_index(op.f('ix_analysis_parameters_analysis_id'), table_name='analysis_parameters')
    op.drop_table('analysis_parameters')
    # ### end Alembic commands ###
