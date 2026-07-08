from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from .auth import router as auth_router
    from .database import Base, engine
    from . import models
except ImportError as exc:
    if "attempted relative import" not in str(exc):
        raise
    from auth import router as auth_router
    from database import Base, engine
    import models

app = FastAPI(title="KABAW V2 API")

# Configure CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    # Creates the users table if it does not exist yet. For larger schema changes, use migrations.
    Base.metadata.create_all(bind=engine)


app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])


@app.get("/")
def read_root():
    return {"message": "Welcome to KABAW V2 API"}
