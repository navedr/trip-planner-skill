"""
Travel Planner FastAPI -- REST API interface.

Usage:
    uvicorn travel_agent.adapters.fastapi_app:app --reload

Environment variables:
    LLM_PROVIDER: "openai", "azure_openai", or "anthropic" (default: openai)
    API_KEY: Your API key
    MODEL: Model name / deployment name (default: gpt-5 for openai, gpt-4o for azure_openai)
    BASE_URL: Base URL override (openai) or Azure resource endpoint (azure_openai)
    API_VERSION: Azure OpenAI API version (default: 2024-12-01-preview)
    SELENIUM_GRID_URL: Selenium Grid URL (default: http://192.168.68.168:4444)
    PLANS_DIR: Plans directory (default: ./plans)
    JWT_SECRET: Secret key for JWT tokens
    ENCRYPTION_KEY: Fernet key for API key encryption
    DATABASE_URL: SQLite connection string (default: sqlite:///./data/travel_planner.db)
"""
from __future__ import annotations

from dotenv import load_dotenv
load_dotenv()

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from travel_agent.llm_provider import make_provider
from travel_agent.agent import TravelAgent
from travel_agent.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)
from travel_agent.db.database import engine, get_db
from travel_agent.db.models import Base, User
from travel_agent.api.trips import router as trips_router
from travel_agent.api.items import router as items_router
from travel_agent.api.itinerary import router as itinerary_router
from travel_agent.api.settings import router as settings_router
from travel_agent.api.chat import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create data directory for SQLite if needed
    db_url = os.environ.get("DATABASE_URL", "sqlite:///./data/travel_planner.db")
    if db_url.startswith("sqlite:///./"):
        db_dir = Path(db_url.replace("sqlite:///./", "")).parent
        db_dir.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Travel Planner API", version="1.0.0", lifespan=lifespan)

# Include API routers
app.include_router(trips_router)
app.include_router(items_router)
app.include_router(itinerary_router)
app.include_router(settings_router)
app.include_router(chat_router)

# ---------------------------------------------------------------------------
# Startup: build a default agent from env vars (used when request doesn't
# supply its own credentials).
# ---------------------------------------------------------------------------

_default_agent: TravelAgent | None = None
_default_plans_dir: str = os.environ.get("PLANS_DIR", "./plans")


def _get_default_agent() -> TravelAgent | None:
    global _default_agent
    if _default_agent is not None:
        return _default_agent

    api_key = os.environ.get("API_KEY", "")
    if not api_key:
        return None

    provider_type = os.environ.get("LLM_PROVIDER", "openai")
    model = os.environ.get("MODEL") or None
    base_url = os.environ.get("BASE_URL") or None
    api_version = os.environ.get("API_VERSION") or None
    grid_url = os.environ.get("SELENIUM_GRID_URL", "http://192.168.68.168:4444")

    provider = make_provider(provider_type, api_key, model, base_url, api_version=api_version)
    _default_agent = TravelAgent(
        provider=provider, grid_url=grid_url, plans_dir=_default_plans_dir
    )
    return _default_agent


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class ChatRequest(BaseModel):
    messages: list[dict[str, Any]]
    provider: str | None = Field(default=None, description="Override LLM provider")
    api_key: str | None = Field(default=None, description="Override API key")
    model: str | None = Field(default=None, description="Override model name")
    base_url: str | None = Field(default=None, description="Override base URL")


class ChatResponse(BaseModel):
    role: str
    content: str


class PlanEntry(BaseModel):
    name: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Send messages to the travel planner agent and get a response."""

    # Use per-request credentials if provided, otherwise fall back to env defaults.
    if request.api_key:
        provider_type = request.provider or os.environ.get("LLM_PROVIDER", "openai")
        provider = make_provider(
            provider_type,
            request.api_key,
            request.model,
            request.base_url,
        )
        grid_url = os.environ.get("SELENIUM_GRID_URL", "http://192.168.68.168:4444")
        agent = TravelAgent(
            provider=provider, grid_url=grid_url, plans_dir=_default_plans_dir
        )
    else:
        agent = _get_default_agent()
        if agent is None:
            raise HTTPException(
                status_code=400,
                detail="No API key provided in request and API_KEY env var is not set.",
            )

    response = await agent.chat_async(request.messages)
    return ChatResponse(
        role=response.get("role", "assistant"),
        content=response.get("content", ""),
    )


@app.get("/plans", response_model=list[PlanEntry])
async def list_plans() -> list[PlanEntry]:
    """List available trip plans."""
    plans_path = Path(_default_plans_dir)
    if not plans_path.exists():
        return []

    entries: list[PlanEntry] = []
    for item in sorted(plans_path.iterdir()):
        if item.is_file() and not item.name.startswith("."):
            entries.append(PlanEntry(name=item.name))
    return entries


# ---------------------------------------------------------------------------
# Auth models
# ---------------------------------------------------------------------------


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class AuthResponse(BaseModel):
    token: str
    refresh_token: str
    user: dict


class TokenResponse(BaseModel):
    token: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    llm_provider: str | None = None
    llm_model: str | None = None
    has_api_key: bool = False


def _user_response(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "llm_provider": user.llm_provider,
        "llm_model": user.llm_model,
        "has_api_key": user.llm_api_key_encrypted is not None,
    }


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------


@app.post("/api/auth/register", response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        name=req.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return AuthResponse(
        token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=_user_response(user),
    )


@app.post("/api/auth/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return AuthResponse(
        token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=_user_response(user),
    )


@app.post("/api/auth/refresh", response_model=TokenResponse)
def refresh(req: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return TokenResponse(token=create_access_token(user.id))


@app.get("/api/auth/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return UserResponse(**_user_response(current_user))


# ---------------------------------------------------------------------------
# Serve frontend static files + SPA fallback (MUST be last)
# ---------------------------------------------------------------------------
_web_dist = Path("web/dist")
if _web_dist.exists():
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    # Serve actual static assets (JS, CSS, icons, SW, manifest)
    app.mount("/assets", StaticFiles(directory=str(_web_dist / "assets")), name="assets")
    app.mount("/icons", StaticFiles(directory=str(_web_dist / "icons")), name="icons")

    _static_files = {"sw.js", "registerSW.js", "workbox-4b126c97.js", "manifest.webmanifest"}
    _index_html = _web_dist / "index.html"

    @app.get("/{path:path}")
    async def spa_fallback(path: str):
        # Serve known static files from dist root
        if path in _static_files:
            return FileResponse(_web_dist / path)
        # Everything else gets index.html (SPA client-side routing)
        return FileResponse(_index_html)
