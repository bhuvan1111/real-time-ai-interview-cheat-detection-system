import sys
import os

# Add backend directory to sys.path so app modules are resolvable on Vercel
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.database import engine, Base
from app.main import init_default_rules

# Auto-initialize database tables and rules on cold start
try:
    Base.metadata.create_all(bind=engine)
    init_default_rules()
except Exception as e:
    print(f"Database initialization warning on Vercel: {e}")
