"""Generate trip-plan.html from trip-data.json using an LLM call."""

from __future__ import annotations

import json
import os
from pathlib import Path

_SKILLS_DIR = Path(__file__).parent.parent.parent / ".claude" / "skills"
_TEMPLATE_PATH = _SKILLS_DIR / "plan-trip" / "templates" / "trip-plan.md"
_EXAMPLE_PATH = Path.home() / "slc-trip-plan.html"


def _build_html_prompt(trip_data: dict, template_spec: str, example_snippet: str) -> str:
    """Build the prompt for HTML generation."""
    return f"""Generate a complete, self-contained HTML trip plan page from the trip data below.

## Design Reference
Follow this template specification exactly:
{template_spec}

## Example HTML (first 3000 chars for style reference)
```html
{example_snippet}
```

## Requirements
- Single self-contained HTML file, no external assets except Google Fonts CDN
- Adapt color palette to the destination
- Include sticky nav bar + hero TOC for section navigation
- Every section needs an id attribute for nav links
- Scroll-reveal animations, hover effects on cards
- Responsive layout
- Every recommendation must have a clickable link (booking URL, Yelp, Airbnb, etc.)
- Flight days get special dark styling
- Include IntersectionObserver JS for nav visibility and scroll reveal

## Trip Data
```json
{json.dumps(trip_data, indent=2)}
```

Generate the COMPLETE HTML file. Do not truncate or abbreviate. Include all sections:
1. Hero with TOC
2. Flights (dark themed)
3. Where to Stay
4. Weather bar
5. Day-by-Day Itinerary
6. Food Guide (with Yelp links)
7. Tips & Packing
8. Footer

Output ONLY the HTML — no markdown, no explanation, just the raw HTML starting with <!DOCTYPE html>."""


def generate_html_plan(plan_dir: str, provider=None) -> dict:
    """Generate trip-plan.html from trip-data.json.

    Args:
        plan_dir: Path to the plan directory containing trip-data.json
        provider: LLMProvider instance for making the generation call

    Returns:
        {"status": "ok", "path": str} or {"error": str}
    """
    if provider is None:
        return {"error": "No LLM provider available for HTML generation"}

    # Read trip data
    trip_path = os.path.join(plan_dir, "trip-data.json")
    if not os.path.exists(trip_path):
        return {"error": f"trip-data.json not found in {plan_dir}"}

    with open(trip_path) as f:
        trip_data = json.load(f)

    # Read template spec
    template_spec = ""
    if _TEMPLATE_PATH.exists():
        template_spec = _TEMPLATE_PATH.read_text()

    # Read example HTML snippet (first 3000 chars for style reference)
    example_snippet = ""
    if _EXAMPLE_PATH.exists():
        example_snippet = _EXAMPLE_PATH.read_text()[:3000]

    # Build the prompt
    prompt = _build_html_prompt(trip_data, template_spec, example_snippet)

    # Make the LLM call — use a focused system prompt for HTML generation
    system = (
        "You are an expert frontend developer. Generate beautiful, self-contained HTML pages. "
        "Output ONLY raw HTML — no markdown fences, no explanation. Start with <!DOCTYPE html>."
    )

    response = provider.chat(
        messages=[{"role": "user", "content": prompt}],
        system=system,
        tools=[],  # No tools needed for HTML generation
    )

    html_content = response.get("content", "")

    # Clean up — strip any markdown fences if the model wrapped it
    if html_content.startswith("```"):
        lines = html_content.split("\n")
        # Remove first line (```html) and last line (```)
        if lines[-1].strip() == "```":
            lines = lines[1:-1]
        elif lines[0].startswith("```"):
            lines = lines[1:]
        html_content = "\n".join(lines)

    if not html_content.strip().startswith("<!DOCTYPE") and not html_content.strip().startswith("<html"):
        return {"error": "LLM did not return valid HTML", "preview": html_content[:200]}

    # Write the HTML file
    html_path = os.path.join(plan_dir, "trip-plan.html")
    with open(html_path, "w") as f:
        f.write(html_content)

    return {"status": "ok", "path": html_path, "size": len(html_content)}
