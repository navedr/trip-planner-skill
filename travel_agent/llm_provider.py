from __future__ import annotations

import json
from abc import ABC, abstractmethod
from typing import Any


class LLMProvider(ABC):
    """Abstract base for LLM providers."""

    @abstractmethod
    def chat(
        self,
        messages: list[dict],
        system: str,
        tools: list[dict],
        tool_results: list[dict] | None = None,
    ) -> dict:
        """
        Send messages to the LLM and get a response.

        Args:
            messages: List of {"role": "user"|"assistant", "content": "..."}
            system: System prompt string
            tools: List of tool schemas (in OpenAI function-calling format)
            tool_results: Optional list of tool results to append

        Returns:
            Normalized response dict with "content", "tool_calls", "stop_reason"
        """
        ...

    @abstractmethod
    def response_to_message(self, response: dict) -> dict:
        """Convert normalized response to provider-specific message format for history."""
        ...

    @abstractmethod
    def tool_results_to_messages(self, tool_results: list) -> list:
        """Convert tool results to provider-specific message(s)."""
        ...


class OpenAIProvider:
    """Uses the openai SDK."""

    def __init__(
        self, api_key: str, model: str = "gpt-5", base_url: str | None = None,
        reasoning_effort: str = "medium",
    ):
        import openai

        self.client = openai.OpenAI(api_key=api_key, base_url=base_url)
        self.model = model
        self.reasoning_effort = reasoning_effort  # "low", "medium", "high"

    def chat(
        self,
        messages: list[dict],
        system: str,
        tools: list[dict],
        tool_results: list[dict] | None = None,
    ) -> dict:
        # Build the full messages list with system prompt first
        full_messages: list[dict] = [{"role": "system", "content": system}]
        full_messages.extend(messages)

        # Convert tool schemas to OpenAI format (they should already be in this
        # format since the registry stores OpenAI-style, but wrap if needed)
        openai_tools = []
        for tool in tools:
            if "type" in tool and tool["type"] == "function":
                openai_tools.append(tool)
            else:
                # Wrap bare schema into OpenAI format
                openai_tools.append(
                    {
                        "type": "function",
                        "function": {
                            "name": tool["name"],
                            "description": tool.get("description", ""),
                            "parameters": tool.get("parameters", {}),
                        },
                    }
                )

        # Append tool results if provided
        if tool_results:
            for result in tool_results:
                full_messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": result["tool_call_id"],
                        "content": result["output"],
                    }
                )

        # Call the API
        kwargs: dict[str, Any] = {
            "model": self.model,
            "messages": full_messages,
        }
        if self.reasoning_effort:
            kwargs["reasoning_effort"] = self.reasoning_effort
        if openai_tools:
            kwargs["tools"] = openai_tools

        response = self.client.chat.completions.create(**kwargs)
        choice = response.choices[0]
        message = choice.message

        # Normalize tool calls
        tool_calls = []
        if message.tool_calls:
            for tc in message.tool_calls:
                tool_calls.append(
                    {
                        "id": tc.id,
                        "name": tc.function.name,
                        "input": json.loads(tc.function.arguments),
                    }
                )

        # Map finish_reason
        stop_reason_map = {"stop": "end_turn", "tool_calls": "tool_use"}
        stop_reason = stop_reason_map.get(choice.finish_reason, choice.finish_reason)

        return {
            "content": message.content or "",
            "tool_calls": tool_calls,
            "stop_reason": stop_reason,
        }

    def response_to_message(self, response: dict) -> dict:
        """Convert normalized response to OpenAI assistant message format for history."""
        message: dict[str, Any] = {"role": "assistant"}

        if response["content"]:
            message["content"] = response["content"]
        else:
            message["content"] = None

        if response["tool_calls"]:
            message["tool_calls"] = [
                {
                    "id": tc["id"],
                    "type": "function",
                    "function": {
                        "name": tc["name"],
                        "arguments": json.dumps(tc["input"]),
                    },
                }
                for tc in response["tool_calls"]
            ]

        return message

    def tool_results_to_messages(self, tool_results: list[dict]) -> list[dict]:
        """Convert tool results to OpenAI tool messages (one per result)."""
        return [
            {
                "role": "tool",
                "tool_call_id": result["tool_call_id"],
                "content": result["output"],
            }
            for result in tool_results
        ]


class AnthropicProvider:
    """Uses the anthropic SDK."""

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514"):
        import anthropic

        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model

    def chat(
        self,
        messages: list[dict],
        system: str,
        tools: list[dict],
        tool_results: list[dict] | None = None,
    ) -> dict:
        # Convert tool schemas from OpenAI format to Anthropic format
        anthropic_tools = []
        for tool in tools:
            if "type" in tool and tool["type"] == "function":
                func = tool["function"]
                anthropic_tools.append(
                    {
                        "name": func["name"],
                        "description": func.get("description", ""),
                        "input_schema": func.get("parameters", {}),
                    }
                )
            else:
                # Already in a flat format
                anthropic_tools.append(
                    {
                        "name": tool["name"],
                        "description": tool.get("description", ""),
                        "input_schema": tool.get("parameters", tool.get("input_schema", {})),
                    }
                )

        # Build messages, appending tool results if provided
        full_messages = list(messages)
        if tool_results:
            full_messages.append(
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": result["tool_call_id"],
                            "content": result["output"],
                        }
                        for result in tool_results
                    ],
                }
            )

        # Call the API
        kwargs: dict[str, Any] = {
            "model": self.model,
            "system": system,
            "messages": full_messages,
            "max_tokens": 4096,
        }
        if anthropic_tools:
            kwargs["tools"] = anthropic_tools

        response = self.client.messages.create(**kwargs)

        # Normalize response
        content_text = ""
        tool_calls = []

        for block in response.content:
            if block.type == "text":
                content_text += block.text
            elif block.type == "tool_use":
                tool_calls.append(
                    {
                        "id": block.id,
                        "name": block.name,
                        "input": block.input,
                    }
                )

        return {
            "content": content_text,
            "tool_calls": tool_calls,
            "stop_reason": response.stop_reason,
        }

    def response_to_message(self, response: dict) -> dict:
        """Convert normalized response to Anthropic assistant message format for history."""
        content_blocks: list[dict] = []

        if response["content"]:
            content_blocks.append({"type": "text", "text": response["content"]})

        for tc in response["tool_calls"]:
            content_blocks.append(
                {
                    "type": "tool_use",
                    "id": tc["id"],
                    "name": tc["name"],
                    "input": tc["input"],
                }
            )

        return {"role": "assistant", "content": content_blocks}

    def tool_results_to_messages(self, tool_results: list[dict]) -> list[dict]:
        """Convert tool results to Anthropic user message with tool_result blocks."""
        return [
            {
                "role": "user",
                "content": [
                    {
                        "type": "tool_result",
                        "tool_use_id": result["tool_call_id"],
                        "content": result["output"],
                    }
                    for result in tool_results
                ],
            }
        ]


def make_provider(
    provider_type: str,
    api_key: str,
    model: str | None = None,
    base_url: str | None = None,
    reasoning_effort: str = "medium",
) -> LLMProvider:
    """Factory function."""
    if provider_type == "openai":
        return OpenAIProvider(
            api_key=api_key, model=model or "gpt-5", base_url=base_url,
            reasoning_effort=reasoning_effort,
        )
    elif provider_type == "anthropic":
        return AnthropicProvider(
            api_key=api_key, model=model or "claude-sonnet-4-20250514"
        )
    else:
        raise ValueError(f"Unknown provider: {provider_type}")
