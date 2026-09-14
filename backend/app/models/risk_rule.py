from sqlalchemy import Column, Integer, String, Float, Boolean
from app.database import Base


class RiskRule(Base):
    __tablename__ = "risk_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_name = Column(String(100), unique=True, nullable=False)
    weight = Column(Float, nullable=False)
    threshold = Column(Float, nullable=False)
    enabled = Column(Boolean, default=True, nullable=False)
