"""
Travel Planner FastAPI -- REST API interface.

Usage:
    uvicorn travel_agent.adapters.fastapi_app:app --reload

Environment variables:
    LLM_PROVIDER: "openai" or "anthropic" (default: openai)
    API_KEY: Your API key
    MODEL: Model name (default: gpt-5 for openai, claude-sonnet-4-20250514 for anthropic)
    SELENIUM_GRID_URL: Selenium Grid URL (default: http://192.168.68.168:4444)
    PLANS_DIR: Plans directory (default: ./plans)
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from travel_agent.llm_provider import make_provider
from travel_agent.agent import TravelAgent

app = FastAPI(title="Travel Planner API", version="1.0.0")

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
    grid_url = os.environ.get("SELENIUM_GRID_URL", "http://192.168.68.168:4444")

    provider = make_provider(provider_type, api_key, model, base_url)
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
