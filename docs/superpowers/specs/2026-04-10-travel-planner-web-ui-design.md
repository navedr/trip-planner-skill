# Travel Planner Web UI — Design Spec

## Context

The travel planner has a working agent backend (`travel_agent/`) with 12 tools, Selenium-based search, and LLM-powered trip planning. It currently has CLI, FastAPI, and OpenWebUI adapters. Trip data lives as JSON files on disk (`plans/`).

**Problem:** No dedicated web interface. The CLI and OpenWebUI are functional but lack a purpose-built UI for managing trips, browsing search results visually, and saving items. Multi-user support doesn't exist.

**Goal:** Build a beautiful, mobile-friendly PWA web interface with:
- Dashboard for managing trips and their research (flights, hotels, restaurants, attractions)
- AI chat panel for natural-language interaction with the travel agent
- Ad-hoc search for quick lookups not tied to a specific trip
- Multi-user auth with per-user trip isolation
- Google Maps integration for spatial visualization of itinerary, hotels, and restaurants
- Dockerized deployment

---

## Architecture

**Monorepo** — React frontend in `web/`, extended FastAPI backend in `travel_agent/`.

```
travel-planner/
├── travel_agent/           # Existing agent (unchanged core)
│   ├── agent.py
│   ├── llm_provider.py
│   ├── system_prompt.py
│   ├── tool_registry.py
│   ├── tools/              # Search + CRUD tools
│   ├── adapters/
│   │   ├── fastapi_app.py  # Extended with auth, SSE, trips CRUD, maps
│   │   ├── cli.py
│   │   └── openwebui_pipe.py
│   ├── db/                 # NEW — SQLite layer
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── database.py     # Engine, session factory
│   │   ├── crud.py         # CRUD operations
│   │   └── migrations/     # Alembic migrations
│   └── storage/            # NEW — trip storage abstraction
│       └── sqlite_storage.py  # SQLite impl of trip state interface
├── web/                    # NEW — React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── contexts/
│   │   ├── lib/            # API client, SSE helpers, map utils
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   └── tailwind.config.ts
├── docker-compose.yml      # NEW
├── Dockerfile              # NEW — multi-stage (build React + serve via FastAPI)
└── plans/                  # Legacy (migration tool converts to SQLite)
```

**Dev mode:** Vite dev server on :5173 proxies `/api/*` to FastAPI on :8000.
**Production:** Single Docker container — FastAPI serves built React assets from `web/dist/` + API endpoints.

---

## Frontend

### Tech Stack

| Library | Purpose |
|---------|---------|
| React 19 | UI framework |
| Vite | Build tool |
| React Router v7 | Client-side routing |
| shadcn/ui + Radix UI | Component library (copy-paste, fully customizable) |
| Tailwind CSS v4 | Styling |
| TanStack Query | Server state management (trips, items, cache) |
| Framer Motion | Animations and transitions |
| react-markdown | Render agent chat responses |
| @vis.gl/react-google-maps | Google Maps integration |
| vite-plugin-pwa | PWA service worker + manifest |
| Lucide React | Icon set |

### Layout

**Desktop (>1024px):** Dashboard (65% width) + Chat Panel (35% width, right-docked, collapsible).

**Tablet (768-1024px):** Dashboard full width. Chat panel as collapsible right overlay.

**Mobile (<768px):** Single column. Chat panel becomes bottom sheet (swipe up/down). Tab navigation becomes horizontal scroll. Trip cards stack vertically.

### Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/login` | LoginPage | Email/password auth |
| `/register` | RegisterPage | Create account |
| `/trips` | TripsPage | Card grid of user's trips with status badges, item counts. "+ New Trip" button. |
| `/trips/:id` | TripDetailPage | Tabbed view: Overview, Flights, Hotels, Restaurants, Attractions, Itinerary, Map |
| `/search` | SearchPage | Ad-hoc search. Results as cards with "Save to trip →" action. |
| `/settings` | SettingsPage | Profile, API key management (provider/key/model), password change |

Chat panel is persistent across all routes (except auth pages). It auto-scopes to the current trip when on TripDetailPage.

### Component Tree

```
App
├── AuthProvider                    ← JWT state, login/register/logout
│   ├── LoginPage
│   └── RegisterPage
├── Router
│   └── AppShell                    ← layout: nav + main + chat panel
│       ├── TopNav                  ← logo, nav links, avatar/logout
│       ├── MainContent             ← route outlet (65% width)
│       │   ├── TripsPage
│       │   │   ├── TripCard        ← destination, dates, status, item counts
│       │   │   └── NewTripDialog   ← modal form: destination, dates, travelers
│       │   ├── TripDetailPage
│       │   │   ├── TripOverview    ← summary, progress ring, key dates, budget
│       │   │   ├── FlightsTab      ← FlightCard list, selected highlight
│       │   │   ├── HotelsTab       ← HotelCard grid, select/compare
│       │   │   ├── RestaurantsTab  ← RestaurantCard list
│       │   │   ├── AttractionsTab  ← AttractionCard list
│       │   │   ├── ItineraryTab    ← day-by-day timeline cards
│       │   │   └── MapTab          ← Google Maps with day-by-day markers
│       │   ├── SearchPage
│       │   │   └── SearchResultCard ← result + "Save to trip →"
│       │   └── SettingsPage
│       └── ChatPanel               ← right panel (35%), collapsible
│           ├── ChatHeader          ← title, collapse toggle, trip context
│           ├── MessageList
│           │   ├── UserMessage
│           │   ├── AssistantMessage ← markdown rendered
│           │   └── StatusMessage   ← "Searching Kayak..." spinner
│           └── ChatInput           ← textarea + send button
```

### State Management

- **React Context:** AuthContext (JWT, user profile), ChatContext (messages, SSE connection, scoped trip_id)
- **TanStack Query:** `useTrips()`, `useTrip(id)`, `useTripItems(id, category)`, `useSettings()` — automatic caching, background refetch, optimistic updates
- **Custom Hooks:** `useChat()` (send message, SSE stream), `useSaveToTrip(item)` (trip picker modal), `useSSE(url)` (generic EventSource wrapper)

### Google Maps Integration

**Library:** `@vis.gl/react-google-maps` (official Google Maps React wrapper).

**MapTab on TripDetailPage:**
- Full-width map with markers for all trip items (hotels, restaurants, attractions)
- Day selector bar at top — click a day to filter markers to that day's itinerary activities
- Marker types distinguished by icon/color:
  - 🏨 Hotel — blue marker (always visible as "home base")
  - 🍽 Restaurant — orange marker
  - 🎯 Attraction — green marker
  - ✈ Airport — gray marker (day 1 and last day)
- Click marker → info window with item name, time, link, and "Remove" action
- Route lines connecting activities in chronological order per day (Directions API)
- Auto-fit bounds to show all markers for the selected day

**Data requirements:**
- Trip items need `latitude` and `longitude` fields
- Geocoding: when items are saved, use Google Geocoding API to resolve address → lat/lng
- Store coordinates in `trip_items.data_json` alongside existing fields
- For items without addresses (e.g., "downtown SLC"), use the destination's general coordinates

**API key:** Google Maps API key stored server-side as env var `GOOGLE_MAPS_API_KEY`. Frontend loads it via `/api/settings/maps-key` endpoint (avoids hardcoding in client source, but the key is necessarily exposed to the browser since the Maps JS API requires it). The key must be restricted via Google Cloud Console: HTTP referrer restrictions to your domain(s) + API restrictions to Maps JavaScript API, Geocoding API, and Directions API only.

### PWA Configuration

- **vite-plugin-pwa** generates service worker + web manifest
- **Caching:** NetworkFirst for API calls, CacheFirst for static assets (JS, CSS, fonts, icons)
- **Manifest:** app name "TravelPlanner", icons at 192x192 and 512x512, theme color, `display: standalone`, `start_url: /trips`
- **Install prompt:** custom "Add to Home Screen" banner on mobile (deferred prompt API)
- **Offline:** show cached trip data when offline. Chat input disabled with "Offline" indicator. Queue not implemented (v1 is online-required for chat).

---

## Backend

### Database (SQLite via SQLAlchemy)

**`users`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| email | TEXT | unique, indexed |
| password_hash | TEXT | bcrypt |
| name | TEXT | |
| llm_provider | TEXT | nullable — user override |
| llm_api_key_encrypted | TEXT | nullable — Fernet encrypted |
| llm_model | TEXT | nullable |
| created_at | DATETIME | |

**`trips`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| slug | TEXT | e.g. "slc-may-2026" |
| destination | TEXT | |
| origin | TEXT | airport code |
| depart_date | DATE | |
| return_date | DATE | |
| duration_days | INT | |
| travelers_json | JSON | {adults, children_ages, names} |
| preferences_json | JSON | {flights, hotels, food, excursions} |
| status | TEXT | planning / researching / ready |
| created_at | DATETIME | |
| updated_at | DATETIME | |

**`trip_items`** — single table for all item types
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| trip_id | UUID | FK → trips |
| category | TEXT | flight / hotel / restaurant / attraction |
| data_json | JSON | Full item object (FlightOption, HotelOption, etc.) — includes lat/lng |
| is_selected | BOOL | finalized/booked |
| source_url | TEXT | booking/review URL |
| created_at | DATETIME | |

**`chat_messages`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| trip_id | UUID | FK → trips, nullable (null = ad-hoc search) |
| user_id | UUID | FK → users |
| role | TEXT | user / assistant / system |
| content | TEXT | |
| created_at | DATETIME | |

**`itinerary_days`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| trip_id | UUID | FK → trips |
| day_number | INT | |
| date | DATE | |
| theme | TEXT | |
| subtitle | TEXT | nullable |
| activities_json | JSON | [{name, time, detail, tags, lat, lng}] |
| is_flight_day | BOOL | |

### API Endpoints

**Auth:**
- `POST /api/auth/register` → `{token, user}`
- `POST /api/auth/login` → `{token, user}`
- `POST /api/auth/refresh` → `{token}`
- `GET /api/auth/me` → `{user}`

**Trips:**
- `GET /api/trips` → `[{id, slug, destination, status, item_counts, dates}]`
- `POST /api/trips` → `{trip}` — creates trip, calls `create_trip` tool internally
- `GET /api/trips/:id` → `{trip, items_by_category}`
- `PATCH /api/trips/:id` → `{trip}` — update metadata
- `DELETE /api/trips/:id` → 204

**Trip Items:**
- `GET /api/trips/:id/items?category=hotel` → `[{item}]`
- `POST /api/trips/:id/items` → `{item}` — save item (geocodes address → lat/lng)
- `PATCH /api/trips/:id/items/:itemId` → `{item}`
- `DELETE /api/trips/:id/items/:itemId` → 204
- `POST /api/trips/:id/items/:itemId/select` → `{item}` — finalize/book

**Itinerary:**
- `GET /api/trips/:id/itinerary` → `[{day}]`
- `PUT /api/trips/:id/itinerary` → `[{day}]` — replace full itinerary

**Chat (SSE):**
- `POST /api/chat/stream` — body: `{message, trip_id?}`, response: SSE stream. Backend loads chat history from DB by trip_id (or user_id for ad-hoc), appends new message, runs agent.
  - `event: status` → `{"message": "Searching Kayak for flights..."}`
  - `event: tool_call` → `{"name": "search_flights", "args": {...}}`
  - `event: tool_result` → `{"name": "search_flights", "result": {...}}`
  - `event: message` → `{"content": "Here are 6 flights..."}`
  - `event: items_updated` → `{"trip_id": "...", "category": "flight"}` — triggers TanStack Query refetch
  - `event: done`

**Settings:**
- `GET /api/settings` → `{provider, model, has_api_key}`
- `PATCH /api/settings` → `{settings}`
- `GET /api/settings/maps-key` → `{key}` — Google Maps API key (admin-configured)

**Geocoding (internal):**
- When saving a trip item with an address but no coordinates, the backend calls Google Geocoding API to resolve lat/lng before storing

### Auth

- **JWT tokens** with short-lived access (15min) + long-lived refresh (7d)
- **bcrypt** for password hashing
- **Fernet symmetric encryption** for stored API keys (encryption key from env var)
- FastAPI dependency `get_current_user()` extracts and validates JWT from `Authorization: Bearer` header
- All `/api/*` endpoints (except auth) require authentication

### Agent Integration

The existing `TravelAgent` class is **not modified**. Instead:

1. **`SQLiteTripStorage`** — new class in `travel_agent/storage/sqlite_storage.py` that implements the same function signatures as `travel_agent/tools/trip_state.py` (`create_trip`, `load_trip`, `save_trip`, `update_trip`, `list_plans`, `finalize_selection`) but uses SQLite via the `db/crud.py` layer. The `execute_tool()` function in `tool_registry.py` accepts a `storage_backend` config key — when set to `"sqlite"`, it dispatches trip-state tool calls to `SQLiteTripStorage` instead of the filesystem functions. The CLI/OpenWebUI adapters continue using filesystem storage (default).

2. **SSE wrapper** — `travel_agent/adapters/fastapi_app.py` adds a `/api/chat/stream` endpoint that:
   - Creates a `TravelAgent` with the user's API key (or admin default)
   - Calls `agent.chat_async(messages, on_status=sse_callback)`
   - The `on_status` callback writes SSE events to a `StreamingResponse`
   - After each tool execution, checks if the tool name is trip-modifying (`create_trip`, `update_trip`, `save_trip`, `finalize_selection`) and emits an `items_updated` event so the frontend refetches

3. **Per-request agent** — each chat request instantiates a fresh `TravelAgent`. The endpoint receives `{trip_id?, message}` — the backend loads conversation history from the `chat_messages` table by `trip_id` (or by `user_id` for ad-hoc), appends the new user message, and passes the full history to the agent. No server-side session state — the DB is the source of truth for chat history.

### Geocoding Pipeline

When a trip item is saved (via API or via agent tool):
1. Check if `data_json` already has `latitude`/`longitude` — if so, skip
2. Extract address fields: `address`, `location`, `neighborhood`, or `name` + destination
3. Call Google Geocoding API: `https://maps.googleapis.com/maps/api/geocode/json?address={query}&key={key}`
4. Store resolved `latitude`/`longitude` in `data_json`
5. If geocoding fails (no results), store `null` — map will skip this marker

---

## Docker

### Dockerfile (multi-stage)

```
# Stage 1: Build React frontend
FROM node:22-alpine AS frontend
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# Stage 2: Python runtime
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY travel_agent/ ./travel_agent/
COPY .claude/ ./.claude/
COPY --from=frontend /app/web/dist ./web/dist
EXPOSE 8000
CMD ["uvicorn", "travel_agent.adapters.fastapi_app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml

```yaml
services:
  app:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - db-data:/app/data          # SQLite database
    environment:
      - DATABASE_URL=sqlite:///data/travel_planner.db
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}      # Fernet key for API key encryption
      - GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
      - SELENIUM_GRID_URL=${SELENIUM_GRID_URL:-http://host.docker.internal:4444}
      - DEFAULT_LLM_PROVIDER=${DEFAULT_LLM_PROVIDER:-}
      - DEFAULT_API_KEY=${DEFAULT_API_KEY:-}
      - DEFAULT_MODEL=${DEFAULT_MODEL:-}

volumes:
  db-data:
```

**Selenium Grid:** The existing grid at `192.168.68.168:4444` is accessed from inside the container via `SELENIUM_GRID_URL`. For Docker Desktop, `host.docker.internal` resolves to the host machine.

---

## Verification Plan

1. **Backend:** Run `pytest` on new endpoints — auth flow, trips CRUD, items CRUD, SSE streaming, geocoding
2. **Frontend:** `npm run dev` — verify all pages render, chat panel connects, TanStack Query fetches data
3. **Integration:** Create a trip via UI → chat "search flights SEA to SLC" → verify SSE status messages appear → verify flight results populate FlightsTab
4. **Maps:** Open MapTab → verify markers appear for saved items → click day selector → verify filtering works → verify route lines render
5. **Mobile:** Chrome DevTools responsive mode — verify bottom sheet chat, single-column layout, horizontal tab scroll
6. **PWA:** Build production → verify manifest loads → verify "Add to Home Screen" prompt → verify offline trip data display
7. **Docker:** `docker compose up --build` → verify app accessible on :8000 → verify auth flow → verify chat + search work
8. **Multi-user:** Register two users → verify trip isolation → verify per-user API keys work
