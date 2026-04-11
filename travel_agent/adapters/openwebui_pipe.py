"""
title: Travel Planner Agent
author: narangwa
version: 1.0.0
description: AI travel planner that searches flights, hotels, restaurants, and attractions
requirements: anthropic, openai, selenium, webdriver-manager
"""
from __future__ import annotations

import asyncio
from typing import Any

from pydantic import BaseModel, Field


class Valves(BaseModel):
    llm_provider: str = Field(
        default="openai", description="LLM provider: 'openai', 'azure_openai', or 'anthropic'"
    )
    api_key: str = Field(default="", description="API key for the LLM provider")
    model: str = Field(default="gpt-5", description="Model name (or Azure deployment name)")
    base_url: str = Field(
        default="", description="Base URL override (openai) or Azure resource endpoint (azure_openai)"
    )
    api_version: str = Field(
        default="", description="Azure OpenAI API version (e.g. 2024-12-01-preview)"
    )
    reasoning_effort: str = Field(
        default="medium", description="Reasoning effort: 'low', 'medium', 'high' (OpenAI models)"
    )
    selenium_grid_url: str = Field(
        default="http://192.168.68.168:4444", description="Selenium Grid URL"
    )
    plans_directory: str = Field(
        default="./plans", description="Directory to store trip plans"
    )


class Pipe:
    def __init__(self) -> None:
        self.valves = Valves()
        self._agent: Any = None

    def _get_agent(self) -> Any:
        """Lazy-init the agent with current valve settings."""
        if self._agent is None:
            from travel_agent.llm_provider import make_provider
            from travel_agent.agent import TravelAgent

            provider = make_provider(
                self.valves.llm_provider,
                self.valves.api_key,
                self.valves.model,
                self.valves.base_url or None,
                reasoning_effort=self.valves.reasoning_effort,
                api_version=self.valves.api_version or None,
            )
            self._agent = TravelAgent(
                provider=provider,
                grid_url=self.valves.selenium_grid_url,
                plans_dir=self.valves.plans_directory,
            )
        return self._agent

    def pipes(self) -> list[dict]:
        return [{"id": "travel-planner", "name": "Travel Planner Agent"}]

    async def pipe(
        self,
        body: dict,
        __user__: dict | None = None,
        __event_emitter__: Any = None,
    ) -> str:
        agent = self._get_agent()

        # Build a thread-safe status callback.
        # chat_async runs the sync chat() in an executor (different thread),
        # so we stash the event loop and use call_soon_threadsafe to emit events.
        loop = asyncio.get_running_loop()

        def on_status(msg: str) -> None:
            if __event_emitter__ is None:
                return

            async def _emit() -> None:
                await __event_emitter__(
                    {
                        "type": "status",
                        "data": {"description": msg, "done": False},
                    }
                )

            loop.call_soon_threadsafe(asyncio.ensure_future, _emit())

        messages = body.get("messages", [])
        response = await agent.chat_async(messages, on_status=on_status)

        if __event_emitter__:
            await __event_emitter__(
                {
                    "type": "status",
                    "data": {"description": "Done", "done": True},
                }
            )

        return response.get("content", "")
