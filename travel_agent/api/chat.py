"""SSE Chat streaming endpoint — POST /api/chat/stream."""

from __future__ import annotations

import asyncio
import json
import os
import re
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from travel_agent.agent import TravelAgent
from travel_agent.auth import decrypt_api_key, get_current_user
from travel_agent.db import crud
from travel_agent.db.database import SessionLocal, get_db
from travel_agent.db.models import User
from travel_agent.llm_provider import make_provider
from travel_agent.storage.sqlite_storage import SQLiteTripStorage

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Tool names that modify trip state — emit items_updated after these
_TRIP_MODIFYING_TOOLS = {"create_trip", "save_trip", "update_trip", "finalize_selection"}

# Number of recent messages sent to the LLM for context (visual history is unlimited)
LLM_CONTEXT_LIMIT = 5


class ChatStreamRequest(BaseModel):
    message: str
    trip_id: str | None = None


class ChatHistoryMessage(BaseModel):
    id: str
    role: str
    content: str
    created_at: str


@router.get("/history")
def chat_history(
    trip_id: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ChatHistoryMessage]:
    """Return persisted chat messages for a trip (or adhoc when trip_id is None)."""
    rows = crud.get_chat_messages(db, user.id, trip_id, limit=500)
    return [
        ChatHistoryMessage(
            id=m.id,
            role=m.role,
            content=m.content,
            created_at=m.created_at.isoformat() if m.created_at else "",
        )
        for m in rows
    ]


@router.delete("/history")
def delete_chat_history(
    trip_id: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    deleted = crud.delete_chat_messages(db, user.id, trip_id)
    return {"deleted": deleted}


def _make_sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _build_agent(user: User, trip_id: str | None, db: Session) -> TravelAgent:
    """Build a TravelAgent from user settings or env defaults."""
    # Determine provider/key/model
    provider_type = user.llm_provider or os.environ.get("LLM_PROVIDER") or os.environ.get("DEFAULT_LLM_PROVIDER") or "openai"
    model = user.llm_model or os.environ.get("MODEL") or None
    base_url = os.environ.get("BASE_URL") or None
    api_version = os.environ.get("API_VERSION") or None

    if user.llm_api_key_encrypted:
        api_key = decrypt_api_key(user.llm_api_key_encrypted)
    else:
        api_key = os.environ.get("DEFAULT_API_KEY") or os.environ.get("API_KEY", "")

    if not api_key:
        raise ValueError("No API key configured — set one in Settings or configure DEFAULT_API_KEY env var")

    provider = make_provider(provider_type, api_key, model, base_url, api_version=api_version)
    grid_url = os.environ.get("SELENIUM_GRID_URL", "http://192.168.68.168:4444")
    plans_dir = os.environ.get("PLANS_DIR", "./plans")

    agent = TravelAgent(provider=provider, grid_url=grid_url, plans_dir=plans_dir)

    # Inject SQLite storage into the agent config
    storage = SQLiteTripStorage(db, user.id)
    agent.config["storage_backend"] = "sqlite"
    agent.config["storage_instance"] = storage

    return agent


@router.post("/stream")
async def chat_stream(
    req: ChatStreamRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """SSE streaming chat endpoint.

    Events:
        status — progress message (e.g. "Searching Kayak...")
        tool_call — tool name + args
        tool_result — tool name + result summary
        message — final assistant response
        items_updated — trip items changed, frontend should refetch
        done — stream complete
    """

    # Load recent messages for LLM context — only the last N for token efficiency
    history = crud.get_chat_messages(db, user.id, req.trip_id)
    recent = history[-LLM_CONTEXT_LIMIT:] if len(history) > LLM_CONTEXT_LIMIT else history
    messages = [{"role": m.role, "content": m.content} for m in recent]
    messages.append({"role": "user", "content": req.message})

    # Persist user message
    crud.create_chat_message(db, user.id, "user", req.message, req.trip_id)

    # Build agent — create a separate DB session for the executor thread
    try:
        agent = _build_agent(user, req.trip_id, db)
    except ValueError as e:
        error_msg = str(e)

        async def error_stream():
            yield _make_sse("message", {"content": error_msg})
            yield _make_sse("done", {})
        return StreamingResponse(error_stream(), media_type="text/event-stream")

    loop = asyncio.get_event_loop()
    queue: asyncio.Queue[dict | None] = asyncio.Queue()

    def on_status(status_text: str):
        """Called from executor thread — bridge to async queue."""
        # Parse status text to determine event type
        if status_text.startswith("Calling "):
            # Extract tool name and args
            match = re.match(r"Calling (\w+)\((.*)?\)", status_text)
            if match:
                tool_name = match.group(1)
                event = {"type": "tool_call", "data": {"name": tool_name, "status": status_text}}
                loop.call_soon_threadsafe(queue.put_nowait, event)

                # Check if this is a trip-modifying tool
                if tool_name in _TRIP_MODIFYING_TOOLS and req.trip_id:
                    loop.call_soon_threadsafe(
                        queue.put_nowait,
                        {"type": "items_updated", "data": {"trip_id": req.trip_id}},
                    )
                return
        if status_text.startswith("  -> "):
            event = {"type": "tool_result", "data": {"result": status_text[5:]}}
            loop.call_soon_threadsafe(queue.put_nowait, event)
            return

        # Generic status
        event = {"type": "status", "data": {"message": status_text}}
        loop.call_soon_threadsafe(queue.put_nowait, event)

    async def run_agent():
        """Run agent in executor, then signal done."""
        thread_db = SessionLocal()
        try:
            thread_storage = SQLiteTripStorage(thread_db, user.id)
            agent.config["storage_instance"] = thread_storage

            result = await loop.run_in_executor(
                None,
                lambda: agent.chat(messages, on_status=on_status),
            )

            content = result.get("content", "")

            # Persist assistant response
            crud.create_chat_message(db, user.id, "assistant", content, req.trip_id)

            loop.call_soon_threadsafe(
                queue.put_nowait,
                {"type": "message", "data": {"content": content}},
            )
        except Exception as e:
            loop.call_soon_threadsafe(
                queue.put_nowait,
                {"type": "message", "data": {"content": f"Error: {e}"}},
            )
        finally:
            thread_db.close()
            loop.call_soon_threadsafe(queue.put_nowait, None)  # sentinel

    async def event_generator() -> AsyncGenerator[str, None]:
        # Start agent task
        task = asyncio.create_task(run_agent())

        try:
            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    task.cancel()
                    break

                try:
                    event = await asyncio.wait_for(queue.get(), timeout=0.5)
                except asyncio.TimeoutError:
                    continue

                if event is None:  # sentinel — agent done
                    yield _make_sse("done", {})
                    break

                yield _make_sse(event["type"], event["data"])
        except asyncio.CancelledError:
            pass

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
