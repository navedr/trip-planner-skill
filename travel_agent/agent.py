from __future__ import annotations

import asyncio
import json
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, Callable

from .llm_provider import LLMProvider
from .system_prompt import build_system_prompt


class TravelAgent:
    """Platform-agnostic travel planning agent with tool-use loop."""

    def __init__(
        self,
        provider: LLMProvider,
        grid_url: str = "http://192.168.68.168:4444",
        plans_dir: str = "./plans",
    ):
        self.provider = provider
        self._base_system_prompt = build_system_prompt()
        self.config = {"grid_url": grid_url, "plans_dir": plans_dir, "provider": provider}
        self._executor = ThreadPoolExecutor(max_workers=2)
        # Import here to avoid circular imports
        from .tool_registry import TOOLS, execute_tool
        self.tools = TOOLS
        self._execute_tool = execute_tool

    @property
    def system_prompt(self) -> str:
        """Build system prompt with current plan context appended."""
        storage = self.config.get("storage_instance") if self.config.get("storage_backend") == "sqlite" else None
        if storage:
            plans = storage.list_plans()
        else:
            from .tools.trip_state import list_plans
            plans = list_plans(self.config["plans_dir"])
        if not plans:
            return self._base_system_prompt

        lines = ["\n\n## Existing Trip Plans\n"]
        lines.append("The user has these trip plans on disk. When they reference a trip by destination or name, match it to the right plan and use its `plan_dir` path.\n")
        for p in plans:
            dest = p.get("destination", "unknown")
            dates = p.get("dates", {})
            depart = dates.get("depart", "?")
            ret = dates.get("return", "?")
            travelers = p.get("travelers", {})
            path = p.get("path", p.get("slug", "?"))
            lines.append(f"- **{dest}** ({depart} to {ret}) — `plan_dir: {path}`")
        lines.append("\nWhen the user says something like 'my SLC trip' or 'the Salt Lake City plan', use `load_trip` with the matching plan_dir to get full context (dates, travelers, preferences).\n")
        return self._base_system_prompt + "\n".join(lines)

    def chat(self, messages: list, on_status: Optional[Callable] = None) -> dict:
        """
        Synchronous agent loop.

        Args:
            messages: List of {"role": "user"|"assistant", "content": "..."}
            on_status: Optional callback for progress updates, e.g. on_status("Searching Kayak for flights...")

        Returns:
            {"role": "assistant", "content": "final text response"}
        """
        # Max iterations to prevent infinite loops
        MAX_ITERATIONS = 20

        working_messages = list(messages)  # Don't mutate the original

        for iteration in range(MAX_ITERATIONS):
            if on_status:
                on_status(f"Thinking... (turn {iteration + 1})")

            response = self.provider.chat(
                messages=working_messages,
                system=self.system_prompt,
                tools=self.tools,
            )

            # If there's text content alongside tool calls, show it
            if response.get("content") and on_status:
                # Show partial thinking/text from the model
                preview = response["content"][:200]
                if len(response["content"]) > 200:
                    preview += "..."
                on_status(f"Agent: {preview}")

            if response["stop_reason"] != "tool_use" or not response.get("tool_calls"):
                return {"role": "assistant", "content": response["content"]}

            # Execute tool calls
            assistant_msg = self.provider.response_to_message(response)
            working_messages.append(assistant_msg)

            tool_results = []
            for tool_call in response["tool_calls"]:
                tool_name = tool_call["name"]
                tool_input = tool_call["input"]

                # Show what tool is being called and with what args
                if on_status:
                    arg_summary = ", ".join(f"{k}={v!r}" for k, v in tool_input.items() if v is not None)
                    if len(arg_summary) > 120:
                        arg_summary = arg_summary[:120] + "..."
                    on_status(f"Calling {tool_name}({arg_summary})")

                start = time.time()
                result = self._execute_tool(tool_name, tool_input, self.config)
                elapsed = time.time() - start

                # Show result summary
                if on_status:
                    try:
                        parsed = json.loads(result)
                        if isinstance(parsed, list):
                            on_status(f"  -> {len(parsed)} items ({elapsed:.1f}s)")
                        elif isinstance(parsed, dict):
                            if "error" in parsed:
                                on_status(f"  -> ERROR: {parsed['error'][:100]}")
                            elif "count" in parsed:
                                on_status(f"  -> {parsed['count']} results ({elapsed:.1f}s)")
                            elif "path" in parsed or "plan_dir" in parsed:
                                on_status(f"  -> OK ({elapsed:.1f}s)")
                            else:
                                keys = list(parsed.keys())[:5]
                                on_status(f"  -> OK [{', '.join(keys)}] ({elapsed:.1f}s)")
                        else:
                            on_status(f"  -> Done ({elapsed:.1f}s)")
                    except (json.JSONDecodeError, TypeError, AttributeError):
                        on_status(f"  -> Done ({elapsed:.1f}s)")

                tool_results.append({
                    "tool_call_id": tool_call["id"],
                    "output": result,
                })

            # Append tool results in provider-specific format
            result_messages = self.provider.tool_results_to_messages(tool_results)
            working_messages.extend(result_messages)

        return {"role": "assistant", "content": "I've reached the maximum number of tool calls. Please continue the conversation."}

    async def chat_async(self, messages: list, on_status: Optional[Callable] = None) -> dict:
        """
        Async version — runs the synchronous chat() in an executor
        so Selenium operations don't block the event loop.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self._executor,
            lambda: self.chat(messages, on_status)
        )
