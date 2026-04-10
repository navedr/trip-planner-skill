# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a skills-only project — no application code. It contains Claude Code skills for travel planning that use browser automation (Playwright MCP, Selenium) to find attractions, hotels, restaurants, flights, and other travel information by navigating real travel websites.

## Skill Structure

Skills live under `.claude/skills/<skill-name>/` following the standard Claude Code skill layout:

```
.claude/skills/<skill-name>/
  SKILL.md          # Skill definition with frontmatter (name, description, triggers)
  prompts/          # Reusable prompt fragments
  templates/        # Output templates (HTML, markdown)
  references/       # Reference data (site selectors, URL patterns)
  tools/            # Custom tool definitions if needed
```

### SKILL.md Frontmatter

Every skill must have YAML frontmatter:

```yaml
---
name: skill-name
description: One-line description used for skill matching/triggering
metadata:
  author: narangwa
  version: "0.1.0"
---
```

## Travel Plans

Plans live in the `plans/` folder. Each trip gets its own subfolder with two files:

```
plans/
  tokyo-june-2026/
    trip-data.json    # All trip data — travelers, dates, preferences, research findings, itinerary
    trip-plan.html    # Polished visual plan page (generated from trip-data.json)
  italy-rome-florence-sept-2026/
    trip-data.json
    trip-plan.html
```

### How Plans Work

1. **`plan-trip`** is the orchestrator skill — it gathers traveler info, destination, dates, and preferences, then creates the plan folder and `trip-data.json`
2. The individual skills (`find-flights`, `find-hotels`, `find-restaurants`, `find-attractions`) read from `trip-data.json` for context so the user doesn't repeat themselves
3. After researching, each skill writes its findings back into the relevant section of `trip-data.json` (e.g., `flights.outbound`, `hotels.options`, `restaurants`, `attractions`)
4. Research order: flights → hotels → attractions → restaurants (each step informs the next — hotel location affects restaurant search, flight times affect check-in dates)
5. Once all research is done, generate `trip-plan.html` from `trip-data.json` using the `frontend-design` skill. See `~/slc-trip-plan.html` as the design reference and `.claude/skills/plan-trip/templates/trip-plan.md` for the template spec.

### Why JSON over Markdown

`trip-data.json` is the working data file — compact, structured, and token-efficient. The HTML is the human-readable output. Skills read/write specific JSON fields (`flights.selected`, `hotels.options[0].price_per_night`) without parsing markdown tables.

### Resuming Plans

To resume an existing plan, read `trip-data.json` from the relevant `plans/` subfolder. Check which sections are populated vs empty to understand what's done.

## Browser Automation

Two browser backends are available:

### 1. Selenium Grid (default)

A Selenium Grid instance is available at `http://192.168.68.168:4444/` running Chrome 144.0 on Linux. This is the primary method for all browser automation. Many travel sites (Kayak, TripAdvisor) detect Playwright as a bot and block it, but Selenium Grid with Chrome works reliably for Kayak and most other sites.

Connect via WebDriver protocol by running a Python script:

```python
from selenium import webdriver
options = webdriver.ChromeOptions()
driver = webdriver.Remote(command_executor="http://192.168.68.168:4444", options=options)
```

**Note on TripAdvisor:** TripAdvisor blocks even Selenium Grid. For TripAdvisor data (restaurant reviews, attraction ratings, hotel reviews), use Google search as a proxy — search for `site:tripadvisor.com "{query}"` and extract ratings/snippets from Google results without hitting TripAdvisor directly.

### 2. Playwright MCP (fallback)

Use the `mcp__playwright__*` tools only when Selenium Grid is unavailable. Key tools:

- `browser_navigate` — go to a URL
- `browser_snapshot` — get accessible page structure (preferred over screenshots for data extraction)
- `browser_click` / `browser_fill_form` — interact with forms and filters
- `browser_evaluate` — run JS on the page for complex extraction
- `browser_take_screenshot` — visual capture when needed

### Conventions

- Prefer `browser_snapshot` over `browser_take_screenshot` for extracting text/data — snapshots return structured accessible content
- Always close the browser (`browser_close` or `driver.quit()`) when done
- Handle cookie consent banners and popups before scraping
- Use `browser_wait_for` (Playwright) or explicit waits (Selenium) when pages load content dynamically
- Store site-specific CSS selectors and URL patterns in `references/` so they can be updated without changing skill logic
