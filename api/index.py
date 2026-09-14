import sys
import os

# Add backend directory to sys.path so app modules are resolvable on Vercel
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.database import engine, Base, SessionLocal
from app.models.user import User

# Auto-initialize database tables and seed if brand new instance
try:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    if db.query(User).count() == 0:
        from seed_data import seed_database
        seed_database()
    db.close()
except Exception as e:
    print(f"Database initialization warning on Vercel: {e}")

