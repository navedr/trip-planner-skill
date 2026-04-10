"""
Travel Planner CLI -- interactive terminal interface.

Usage:
    python -m travel_agent.adapters.cli

Environment variables:
    LLM_PROVIDER: "openai" or "anthropic" (default: openai)
    API_KEY: Your API key
    MODEL: Model name (default: gpt-5 for openai, claude-sonnet-4-20250514 for anthropic)
    SELENIUM_GRID_URL: Selenium Grid URL (default: http://192.168.68.168:4444)
    PLANS_DIR: Plans directory (default: ./plans)
"""
from __future__ import annotations

import os
import sys

from travel_agent.llm_provider import make_provider
from travel_agent.agent import TravelAgent


def _status_callback(msg: str) -> None:
    """Print status updates to stderr so they don't mix with responses."""
    print(f"  [{msg}]", file=sys.stderr, flush=True)


def main() -> None:
    provider_type = os.environ.get("LLM_PROVIDER", "openai")
    api_key = os.environ.get("API_KEY", "")
    model = os.environ.get("MODEL") or None
    base_url = os.environ.get("BASE_URL") or None
    reasoning_effort = os.environ.get("REASONING_EFFORT", "medium")
    grid_url = os.environ.get("SELENIUM_GRID_URL", "http://192.168.68.168:4444")
    plans_dir = os.environ.get("PLANS_DIR", "./plans")

    if not api_key:
        print("Error: API_KEY environment variable is required.", file=sys.stderr)
        sys.exit(1)

    provider = make_provider(provider_type, api_key, model, base_url, reasoning_effort=reasoning_effort)
    agent = TravelAgent(provider=provider, grid_url=grid_url, plans_dir=plans_dir)

    resolved_model = model or ("gpt-5" if provider_type == "openai" else "claude-sonnet-4-20250514")
    print(f"Travel Planner CLI  ({provider_type} / {resolved_model})")
    print("Type your message and press Enter. Ctrl+C to quit.\n")

    messages: list[dict] = []

    try:
        while True:
            try:
                user_input = input("You: ").strip()
            except EOFError:
                break

            if not user_input:
                continue

            messages.append({"role": "user", "content": user_input})
            response = agent.chat(messages, on_status=_status_callback)
            content = response.get("content", "")
            print(f"\nAssistant: {content}\n")
            messages.append(response)
    except KeyboardInterrupt:
        print("\n\nGoodbye!", file=sys.stderr)


if __name__ == "__main__":
    main()
