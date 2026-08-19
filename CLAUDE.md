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

## Traveler Preferences

Defaults for this household unless a trip says otherwise.

**Who:** 2 adults + 2 children (ages 9 and 2 as of Aug 2026 — age up accordingly).
**Home airport:** SEA (Seattle eastside).

### Flights
- **Prefer Wed→Wed or Tue→Tue.** Those are the cheapest departure/return days; default to them when proposing dates.
- Always price a rental car — they drive at the destination rather than relying on transit.

### Food
- **No pork.** Eats shrimp, fish, chicken, beef.
- Preferred cuisines: Indian, Pakistani, Mediterranean, Afghan, Lebanese, Jamaican, Caribbean, Mexican.
- Common traps to flag: al pastor and carnitas, bacon in burgers/salads, pulled pork at BBQ counters, pepperoni.
- **Yelp 4.0+ is the bar.** Check the actual rating on the business page before recommending — do not rely on
  aggregator blurbs or "best of" listicles, which have produced 3.4-star recommendations.
- Prefers small, characterful, inexpensive places **with table seating**. Not counter-only, not expensive
  view restaurants. Flag wait times for no-reservation spots.

### Lodging
- Airbnb over hotels. Non-negotiables: **A/C, free off-street parking, two real beds** (a "bedroom" that is a
  sofa bed does not count), high review count, established host.
- Rejects hotels that charge for parking — it erases the price advantage over a rental.

### Pacing
- **Late starts.** Typically leaving around noon; do not build plans that need a 9am departure.
- **Do not stack 3+ full activity days.** The toddler fades and the whole family suffers. Put a rest day between
  big ones.
- Half-days and "leave whenever" venues beat rigid ticketed schedules late in a trip.

### Budget
- Value-conscious and does the per-hour math. Declined $224 zoo admission for a half-day visit; accepted $82
  for a one-hour museum where the toddler was free. Present cost per person and what the kids actually cost.
- **Child-free-admission ages vary by venue and have caught us out** — SeaWorld San Diego is free at 2 and
  under, Legoland California requires a full ticket at age 2, San Diego Zoo is free at 2 and under. Verify
  per venue rather than assuming.

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
# Sync compose file changes from repo first (only when docker-compose.yml changed)
scp docker-compose.yml 192.168.68.168:~/docker/trip-planner/docker-compose.yml
ssh 192.168.68.168 "cd ~/docker/trip-planner && docker compose pull && docker compose up -d"
```
- `docker-compose.yml` is versioned in the repo (source of truth)
- `.env` lives only on butler at `~/docker/trip-planner/.env` (secrets, not in git)
- Exposed on port **8076**
- **When adding a new env var:** update both `.env.example` and `docker-compose.yml` (add to the `environment:` whitelist — compose doesn't auto-forward unlisted vars)
- Uses `multiarch` buildx builder (created with `docker buildx create --name multiarch`)

## Browser Automation

### 1. Selenium Grid (default)

**Always reach for the Grid first for any site lookup — ratings, reviews, prices, listings.** It is the primary research tool, not a last resort. `WebFetch` gets 403'd by Yelp and TripAdvisor, and web-search snippets routinely omit the numbers that matter (star ratings, review counts, menu prices). Do not fall back to search snippets and report a number as unavailable until the Grid has actually been tried.

**Connect via `create_driver()` in `.claude/skills/_selenium.py`** — never hardcode a grid address:

```python
import sys; sys.path.insert(0, ".claude/skills")
from _selenium import create_driver
driver = create_driver()          # reads SELENIUM_GRID_URL
try:
    driver.get(url); time.sleep(9)
    body = driver.find_element(By.TAG_NAME, "body").text
finally:
    driver.quit()
```

- **`SELENIUM_GRID_URL` is the source of truth.** It points at a remote authenticated grid reachable from anywhere, including cloud/web sessions. `_prepare_grid_url()` handles the credentials, the `@` inside the password, and the http→https upgrade for non-local hosts.
- The hardcoded fallback `http://192.168.68.168:4444` is **butler on the home LAN** — unreachable from Claude Code on the web or any remote container. A failure against that address means the env var wasn't read; it does **not** mean the Grid is down.
- All tools also accept an explicit `grid_url` parameter.
- Works reliably on Kayak, Yelp, Airbnb. For Yelp, `?sort_by=rating_asc` surfaces the critical reviews.

**TripAdvisor:** Blocks all automated browsers, Grid included — serves an empty page shell. Proxy through **DuckDuckGo**, not Google: `https://duckduckgo.com/html/?q=site:tripadvisor.com+"{query}"` (selectors `.result, .web-result, #links > div`). Google blocks the Grid's datacenter exit IP with an "unusual traffic" interstitial. DuckDuckGo gives URLs, titles, snippets and review counts but **not** star ratings — use Yelp for ratings.

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
