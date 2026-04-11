"""
Travel Planner CLI -- interactive terminal interface.

Usage:
    python -m travel_agent.adapters.cli

Environment variables:
    LLM_PROVIDER: "openai", "azure_openai", or "anthropic" (default: openai)
    API_KEY: Your API key
    MODEL: Model name (default: gpt-5 for openai, gpt-4o for azure_openai, claude-sonnet-4-20250514 for anthropic)
    BASE_URL: Base URL override (for openai) or Azure resource endpoint (for azure_openai)
    API_VERSION: Azure OpenAI API version (default: 2024-12-01-preview)
    SELENIUM_GRID_URL: Selenium Grid URL (default: http://192.168.68.168:4444)
    PLANS_DIR: Plans directory (default: ./plans)
"""
from __future__ import annotations

import os
import sys

from dotenv import load_dotenv
load_dotenv()

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

    api_version = os.environ.get("API_VERSION") or None
    provider = make_provider(
        provider_type, api_key, model, base_url,
        reasoning_effort=reasoning_effort, api_version=api_version,
    )
    agent = TravelAgent(provider=provider, grid_url=grid_url, plans_dir=plans_dir)

    default_models = {"openai": "gpt-5", "azure_openai": "gpt-4o", "anthropic": "claude-sonnet-4-20250514"}
    resolved_model = model or default_models.get(provider_type, "unknown")
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
