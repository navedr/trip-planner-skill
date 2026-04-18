# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A travel planning system with two interfaces:

1. **Claude Code skills** (`.claude/skills/`) — for interactive use within Claude Code
2. **Standalone Python agent** (`travel_agent/`) — model-agnostic (GPT-5, Claude, etc.), platform-agnostic (OpenWebUI, CLI, FastAPI, etc.)

Both share the same reference files, tools, and trip data. The agent reads directly from `.claude/skills/*/references/` so updates to skills are picked up by both interfaces.

## Skill Structure

Skills live under `.claude/skills/<skill-name>/`:

```
.claude/skills/<skill-name>/
  SKILL.md          # Skill definition with frontmatter (name, description, triggers)
  templates/        # Output templates (HTML, markdown)
  references/       # Reference data (site selectors, URL patterns) — shared with agent
  scripts/          # Selenium automation scripts
```

## Standalone Agent

The `travel_agent/` package is a model & platform agnostic agent:

```
travel_agent/
  agent.py            # Core TravelAgent class — tool-use loop, search vs plan mode
  llm_provider.py     # OpenAIProvider + AzureOpenAIProvider + AnthropicProvider + make_provider()
  system_prompt.py    # Reads from .claude/skills/ (shared source of truth)
  tool_registry.py    # 12 tool schemas + execute_tool() dispatcher
  tools/              # Selenium search tools + trip state CRUD + HTML generator
  adapters/           # CLI, OpenWebUI Pipe, FastAPI
```

**Usage:**
```bash
# CLI
LLM_PROVIDER=openai API_KEY=sk-... MODEL=gpt-5 python3.12 -m travel_agent.adapters.cli

# FastAPI
uvicorn travel_agent.adapters.fastapi_app:app

# OpenWebUI — paste adapters/openwebui_pipe.py into Admin > Functions
```

**Config (env vars or OpenWebUI Valves):** `LLM_PROVIDER` (openai | azure_openai | anthropic), `API_KEY`, `MODEL`, `BASE_URL`, `API_VERSION` (Azure only), `REASONING_EFFORT` (default: medium), `SELENIUM_GRID_URL`, `PLANS_DIR`

### Search vs Plan Mode

The agent distinguishes user intent:
- **Search mode** ("find restaurants in SLC") — searches and presents results, no file writes
- **Plan mode** ("plan a trip to SLC", "add to my trip") — creates/updates `trip-data.json` and `trip-plan.html`

### Existing Plan Awareness

The agent's system prompt includes all plans on disk. When a user says "my SLC trip" or "the Salt Lake City plan", it matches to the right `plan_dir` and loads context automatically.

## Travel Plans

Plans live in `plans/`. Each trip gets its own subfolder:

```
plans/slc-may-2026/
  trip-data.json    # Structured trip data (JSON schema at .claude/skills/plan-trip/references/)
  trip-plan.html    # Visual plan page (generated from trip-data.json via LLM)
```

### How Plans Work

1. **`plan-trip`** gathers traveler info, creates `trip-data.json`
2. Individual skills/tools search and write to specific sections (`flights.outbound`, `hotels.options`, `restaurants`, etc.)
3. Research order: flights → hotels → attractions → restaurants
4. When finalized (flight booked, hotel selected): promote to `selected`, clear options arrays
5. `trip-plan.html` is generated from `trip-data.json` via an LLM call using the template spec at `.claude/skills/plan-trip/templates/trip-plan.md`

### Why JSON over Markdown

`trip-data.json` is compact and token-efficient. Skills/tools read/write specific fields without parsing. When a flight is booked, clearing the options array keeps the file small. The HTML is the human-readable output.

## Docker Deployment

Image: `ghcr.io/navedr/trip-planner-skill` (multi-platform: amd64 + arm64, public)

**Build & push:**
```bash
docker buildx build --builder multiarch --platform linux/amd64,linux/arm64 \
  -t ghcr.io/navedr/trip-planner-skill:latest --push .
```

**Production (butler — 192.168.68.168):**
```bash
ssh 192.168.68.168 "cd ~/docker/trip-planner && docker compose pull && docker compose up -d"
```
- Compose + `.env` live at `~/docker/trip-planner/` on butler
- Exposed on port **8076**
- Uses `multiarch` buildx builder (created with `docker buildx create --name multiarch`)

## Browser Automation

### 1. Selenium Grid (default)

At `http://192.168.68.168:4444/` running Chrome. Primary method — Kayak, Yelp, Airbnb work reliably. All tools accept a `grid_url` parameter.

**TripAdvisor:** Blocks all automated browsers. Use Google as proxy: `site:tripadvisor.com "{query}"`.

### 2. Playwright MCP (fallback)

Claude Code's built-in `mcp__playwright__*` tools. Use only when Selenium Grid is unavailable.

## Web UI Testing

After making UI changes to `web/`, verify the result with Playwright MCP before reporting the task complete. Type-checking and HMR confirm the code compiles — they do not confirm the feature works.

**Local dev server:** Vite runs on port **5173**, proxies `/api` → FastAPI on 8000. Playwright MCP runs outside the host network namespace, so use the LAN IP (`ipconfig getifaddr en0`), not `localhost` / `127.0.0.1`. Example: `http://192.168.68.117:5173/trips`.

**Mobile UI checks:** `browser_resize` to `390x844` (iPhone 14) before testing mobile breakpoints. Tailwind's `lg:` breakpoint is **1024px** — anything below is "mobile" and gets the `BottomTabBar` + full-screen chat sheet.

**Auth:** Pages under `/trips`, `/search`, `/settings` are behind `ProtectedRoute` and redirect to `/login`. Log in via the UI or seed the session cookie before testing authenticated views. Existing users live in `data/travel_planner.db` (`sqlite3 data/travel_planner.db "SELECT email FROM users;"`).

**What to verify:** the element you changed is actually in the DOM (`browser_snapshot`), has non-zero size, and looks right (`browser_take_screenshot`). Clean up screenshot files after (`rm .playwright-mcp/*.png`).

## Conventions

- **Every recommendation must include a link** — booking URL, Yelp page, Airbnb listing, etc. No exceptions. Applies to chat responses and HTML.
- **Present results in markdown tables** for easy scanning
- **Update both `trip-data.json` and `trip-plan.html`** when the plan changes
- **Use airport codes** for flights (SEA, SLC) not city names
- **Use hyphenated city,state,country** for Kayak hotels: `Salt-Lake-City,Utah,United-States`
- Prefer `browser_snapshot` over screenshots for data extraction
- Always close browsers (`browser_close` or `driver.quit()`)
- Store site-specific URL patterns in `references/` — update there when sites change
