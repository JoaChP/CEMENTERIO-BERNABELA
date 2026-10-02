from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auth, deceased, identity, users


app = FastAPI(title="Cementerio Bernabela API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)
app.include_router(auth.router)
app.include_router(deceased.router)
app.include_router(identity.router)
app.include_router(users.router)
app.include_router(users.audit_router)


@app.get("/api/health", tags=["salud"])
def health() -> dict[str, str]:
    return {"status": "ok"}
