# Travel Planner

A travel planning system with two interfaces: **Claude Code skills** for interactive use, and a **standalone Python agent** that works with any LLM (GPT-5, Claude, etc.) and any chat UI (OpenWebUI, CLI, REST API).

Both interfaces share the same tools, reference files, and trip data — a trip started in Claude Code can be continued via the agent and vice versa.

## How It Works

```
"Plan a trip to Tokyo in June"
        │
        ▼
  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   Flights    │ ──▶ │    Hotels    │ ──▶ │  Attractions │ ──▶ │  Restaurants │
  │   (Kayak)   │     │(Kayak/Airbnb)│     │  (Google →   │     │   (Yelp)     │
  │              │     │              │     │  TripAdvisor)│     │              │
  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
         │                    │                    │                    │
         ▼                    ▼                    ▼                    ▼
  ┌──────────────────────────────────────────────────────────────────────────────┐
  │                          trip-data.json                                      │
  │  Single source of truth — travelers, dates, preferences, all research       │
  └──────────────────────────────────┬───────────────────────────────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  trip-plan.html  │
                            │  Visual plan     │
                            │  (self-contained)│
                            └─────────────────┘
```

## Two Interfaces

### 1. Claude Code Skills (interactive)

Open Claude Code in this directory and talk naturally:

```
plan a trip to Salt Lake City
find flights SEA to SLC, nonstop, after 11am
find airbnbs in Sugar House under $130/night
```

Skills live in `.claude/skills/` — they guide Claude through the research workflow.

### 2. Standalone Agent (any LLM, any UI)

A Python package at `travel_agent/` that wraps the same tools into an LLM-agnostic agent with pluggable adapters.

```
┌─────────────────────────────────────────────────┐
│                  Adapters (thin)                 │
│  ┌──────────┐ ┌───────┐ ┌───────────┐          │
│  │ OpenWebUI│ │  CLI  │ │ FastAPI   │          │
│  │   Pipe   │ │ REPL  │ │ endpoint  │          │
│  └────┬─────┘ └───┬───┘ └─────┬─────┘          │
│       └────────────┴───────────┘                │
│                    │                             │
│        ┌───────────▼───────────┐                │
│        │   TravelAgent (core)  │                │
│        │  model-agnostic       │                │
│        └───────────┬───────────┘                │
│                    │                             │
│        ┌───────────▼───────────┐                │
│        │   LLM Provider        │                │
│        │  OpenAI / Anthropic   │                │
│        └───────────┬───────────┘                │
│                    │                             │
│        ┌───────────▼───────────┐                │
│        │   12 Tools            │                │
│        │  (Selenium Grid)      │                │
│        └───────────────────────┘                │
└─────────────────────────────────────────────────┘
```

**Quick start:**

```bash
pip install openai anthropic selenium

# CLI with GPT-5
LLM_PROVIDER=openai API_KEY=sk-... python3.12 -m travel_agent.adapters.cli

# CLI with Claude
LLM_PROVIDER=anthropic API_KEY=sk-ant-... python3.12 -m travel_agent.adapters.cli

# FastAPI
uvicorn travel_agent.adapters.fastapi_app:app

# OpenWebUI — paste openwebui_pipe.py into Admin > Functions
```

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `openai` | `openai` or `anthropic` |
| `API_KEY` | — | API key (required) |
| `MODEL` | `gpt-5` | Model name |
| `REASONING_EFFORT` | `medium` | `low`, `medium`, `high` (OpenAI models) |
| `SELENIUM_GRID_URL` | `http://192.168.68.168:4444` | Selenium Grid endpoint |
| `PLANS_DIR` | `./plans` | Where trip plans are stored |

## Project Structure

```
travel-planner/
├── CLAUDE.md                           # Instructions for Claude Code
├── README.md
├── requirements.txt
├── .claude/skills/                     # Claude Code skills (shared source of truth)
│   ├── plan-trip/                      # Orchestrator
│   │   ├── SKILL.md
│   │   ├── references/
│   │   │   └── trip-data-schema.json   # JSON schema for trip data
│   │   └── templates/
│   │       └── trip-plan.md            # HTML template spec
│   ├── flights/                        # Kayak flight search
│   │   ├── SKILL.md
│   │   ├── references/sites.md         # URL patterns, selectors
│   │   └── scripts/search_kayak.py
│   ├── hotels/                         # Kayak Hotels + Airbnb
│   │   ├── SKILL.md
│   │   ├── references/sites.md
│   │   └── scripts/
│   ├── attractions/                    # Google → TripAdvisor
│   │   ├── SKILL.md
│   │   ├── references/sites.md
│   │   └── scripts/
│   └── restaurants/                    # Yelp
│       ├── SKILL.md
│       ├── references/sites.md
│       └── scripts/
├── travel_agent/                       # Standalone agent package
│   ├── agent.py                        # Core TravelAgent class
│   ├── llm_provider.py                 # OpenAI + Anthropic providers
│   ├── system_prompt.py                # Reads from .claude/skills/ (shared!)
│   ├── tool_registry.py                # 12 tool schemas + dispatcher
│   ├── tools/                          # Selenium-based search tools
│   │   ├── _selenium.py                # Shared driver factory
│   │   ├── flights.py
│   │   ├── hotels.py
│   │   ├── restaurants.py
│   │   ├── attractions.py
│   │   └── trip_state.py               # trip-data.json CRUD
│   └── adapters/                       # Platform adapters
│       ├── cli.py                      # Terminal REPL
│       ├── openwebui_pipe.py           # OpenWebUI Pipe Function
│       └── fastapi_app.py              # REST API
└── plans/                              # Trip folders (gitignored)
    └── slc-may-2026/
        ├── trip-data.json
        └── trip-plan.html
```

### Shared Source of Truth

The agent's `system_prompt.py` reads directly from `.claude/skills/*/references/` — the same files Claude Code uses. Update a skill's `sites.md` or the JSON schema, and both interfaces pick up the change.

## Search vs Plan Mode

The agent distinguishes between casual searches and trip planning:

- **"find Thai restaurants in SLC"** → search mode. Searches Yelp, presents results, doesn't touch any files.
- **"plan a trip to SLC and find restaurants"** → plan mode. Creates `trip-data.json`, searches, saves results, tracks progress.

The agent also knows about existing plans on disk. Say "find airbnbs for my SLC trip" and it loads the plan's dates/travelers/preferences automatically.

## Browser Automation

**Selenium Grid (default)** — Chrome on a remote grid. Kayak, Yelp, Airbnb, and Google all work reliably. Each tool accepts a `grid_url` parameter.

**Playwright MCP (Claude Code fallback)** — Built-in to Claude Code. Used when Selenium Grid is unavailable.

**TripAdvisor workaround** — TripAdvisor blocks all automated browsers. We use Google search as a proxy: `site:tripadvisor.com "things to do" "Tokyo"` returns ratings and snippets.

## Extending

To add a new research type (e.g., car rentals):

1. Add a `$defs` type in `trip-data-schema.json`
2. Create a skill in `.claude/skills/` with `SKILL.md`, `references/`, `scripts/`
3. Add a tool wrapper in `travel_agent/tools/`
4. Register the tool in `travel_agent/tool_registry.py`
5. The system prompt picks up new reference files automatically
