"""Tool schemas (OpenAI function-calling format) and dispatcher."""

from __future__ import annotations

import json
from typing import Any

from .tools.flights import search_flights
from .tools.hotels import search_kayak_hotels, search_airbnb
from .tools.restaurants import search_restaurants
from .tools.attractions import search_attractions
from .tools import trip_state

# ---------------------------------------------------------------------------
# Tool schemas
# ---------------------------------------------------------------------------

TOOLS: list[dict] = [
    {
        "type": "function",
        "function": {
            "name": "search_flights",
            "description": (
                "Search Kayak for flights between two airports. "
                "Use after gathering origin, destination, and travel dates from the user."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "origin": {
                        "type": "string",
                        "description": "Origin airport code (e.g., SEA)",
                    },
                    "dest": {
                        "type": "string",
                        "description": "Destination airport code (e.g., SLC)",
                    },
                    "depart": {
                        "type": "string",
                        "description": "Departure date in YYYY-MM-DD format",
                    },
                    "return_date": {
                        "type": "string",
                        "description": "Return date in YYYY-MM-DD format. Omit for one-way.",
                    },
                    "adults": {
                        "type": "integer",
                        "description": "Number of adult passengers (default 1)",
                    },
                    "children_ages": {
                        "type": "array",
                        "items": {"type": "integer"},
                        "description": "List of children's ages, e.g. [3, 7]",
                    },
                    "nonstop": {
                        "type": "boolean",
                        "description": "If true, filter to nonstop flights only",
                    },
                    "sort": {
                        "type": "string",
                        "description": "Sort order: bestflight_a (best), price_a (cheapest), duration_a (shortest). Default bestflight_a.",
                    },
                },
                "required": ["origin", "dest", "depart"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_hotels",
            "description": (
                "Search Kayak for hotels in a city. "
                "Use when the user wants hotel options for their trip."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "City with state and country, hyphenated. Examples: 'Salt-Lake-City,Utah,United-States', 'Tokyo,Japan', 'Paris,France'. Spaces must be hyphens.",
                    },
                    "checkin": {
                        "type": "string",
                        "description": "Check-in date in YYYY-MM-DD format",
                    },
                    "checkout": {
                        "type": "string",
                        "description": "Check-out date in YYYY-MM-DD format",
                    },
                    "adults": {
                        "type": "integer",
                        "description": "Number of adult guests (default 2)",
                    },
                    "children_ages": {
                        "type": "array",
                        "items": {"type": "integer"},
                        "description": "List of children's ages, e.g. [3, 7]",
                    },
                    "city_id": {
                        "type": "string",
                        "description": "Kayak city ID for disambiguation (optional)",
                    },
                    "sort": {
                        "type": "string",
                        "description": "Sort order: rank_a (recommended), price_a (cheapest). Default rank_a.",
                    },
                },
                "required": ["city", "checkin", "checkout"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_airbnb",
            "description": (
                "Search Airbnb for entire-home vacation rentals. "
                "Use when the user prefers rentals over hotels, or wants to compare both."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "neighborhood": {
                        "type": "string",
                        "description": "Neighborhood or area name (e.g., Downtown)",
                    },
                    "city": {
                        "type": "string",
                        "description": "City name (e.g., Salt Lake City)",
                    },
                    "state": {
                        "type": "string",
                        "description": "State abbreviation (e.g., UT)",
                    },
                    "checkin": {
                        "type": "string",
                        "description": "Check-in date in YYYY-MM-DD format",
                    },
                    "checkout": {
                        "type": "string",
                        "description": "Check-out date in YYYY-MM-DD format",
                    },
                    "adults": {
                        "type": "integer",
                        "description": "Number of adult guests (default 2)",
                    },
                    "children": {
                        "type": "integer",
                        "description": "Number of children (default 0)",
                    },
                    "children_ages": {
                        "type": "array",
                        "items": {"type": "integer"},
                        "description": "List of children's ages",
                    },
                    "price_max": {
                        "type": "integer",
                        "description": "Maximum nightly price in USD",
                    },
                    "min_bedrooms": {
                        "type": "integer",
                        "description": "Minimum number of bedrooms",
                    },
                },
                "required": ["neighborhood", "city", "state", "checkin", "checkout"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_restaurants",
            "description": (
                "Search Yelp for restaurants at the destination. "
                "Use when the user wants dining recommendations or asks about food options."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "destination": {
                        "type": "string",
                        "description": "City or area to search (e.g., Salt Lake City, UT)",
                    },
                    "cuisine": {
                        "type": "string",
                        "description": "Cuisine type filter (e.g., Italian, Mexican). Omit for all cuisines.",
                    },
                    "sort": {
                        "type": "string",
                        "description": "Sort order: rating (highest rated), review_count (most reviewed). Default rating.",
                    },
                    "family_friendly": {
                        "type": "boolean",
                        "description": "If true, filter to kid-friendly restaurants",
                    },
                    "price": {
                        "type": "integer",
                        "description": "Price level filter (1-4, where 1 is cheapest)",
                    },
                },
                "required": ["destination"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_attractions",
            "description": (
                "Search for things to do and attractions via TripAdvisor results. "
                "Use when the user wants activity ideas, sightseeing options, or asks what to do."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "destination": {
                        "type": "string",
                        "description": "City or area to search (e.g., Salt Lake City, UT)",
                    },
                    "interest": {
                        "type": "string",
                        "description": "Specific interest to focus on (e.g., hiking, museums, family activities). Omit for general attractions.",
                    },
                },
                "required": ["destination"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_trip",
            "description": (
                "Create a new trip plan with folder and trip-data.json. "
                "Use once you have the destination, origin, dates, and traveler details confirmed."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "destination": {
                        "type": "string",
                        "description": "Trip destination city (e.g., Salt Lake City)",
                    },
                    "origin": {
                        "type": "string",
                        "description": "Departure city (e.g., Seattle)",
                    },
                    "dates": {
                        "type": "object",
                        "description": "Travel dates with 'depart' and 'return' keys in YYYY-MM-DD format",
                        "properties": {
                            "depart": {"type": "string"},
                            "return": {"type": "string"},
                        },
                    },
                    "travelers": {
                        "type": "object",
                        "description": "Traveler info with 'adults' (int) and optional 'children_ages' (list of int)",
                        "properties": {
                            "adults": {"type": "integer"},
                            "children_ages": {
                                "type": "array",
                                "items": {"type": "integer"},
                            },
                        },
                    },
                    "preferences": {
                        "type": "object",
                        "description": "User preferences like budget, interests, dietary needs. Free-form.",
                    },
                },
                "required": ["destination", "origin", "dates", "travelers", "preferences"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "load_trip",
            "description": (
                "Load an existing trip plan from disk. "
                "Use to retrieve current trip state before making updates or presenting options."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "plan_dir": {
                        "type": "string",
                        "description": "Path to the plan directory (e.g., plans/slc-may-2026)",
                    },
                },
                "required": ["plan_dir"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "save_trip",
            "description": (
                "Save the full trip data object to disk. "
                "Use when you need to overwrite the entire trip-data.json (prefer update_trip for partial updates)."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "plan_dir": {
                        "type": "string",
                        "description": "Path to the plan directory",
                    },
                    "data": {
                        "type": "object",
                        "description": "Complete trip data object to save",
                    },
                },
                "required": ["plan_dir", "data"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_trip",
            "description": (
                "Update a specific section of the trip plan using dot notation. "
                "Use to store search results, selections, or itinerary changes without overwriting the whole file. "
                "Example sections: 'flights.selected', 'hotels.options', 'itinerary'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "plan_dir": {
                        "type": "string",
                        "description": "Path to the plan directory",
                    },
                    "section": {
                        "type": "string",
                        "description": "Dot-notation path to the section to update (e.g., 'flights.selected')",
                    },
                    "data": {
                        "description": "Data to set at the specified section path (any JSON type)",
                    },
                },
                "required": ["plan_dir", "section", "data"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_plans",
            "description": (
                "List all saved trip plans with their destination and dates. "
                "Use at the start of a conversation to check for existing plans, or when the user asks to resume a trip."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "plans_dir": {
                        "type": "string",
                        "description": "Directory containing plan folders (default: ./plans)",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "finalize_selection",
            "description": (
                "Lock in a booking selection for a category (flights, hotels, restaurants, attractions). "
                "Marks the selection as booked and clears intermediate search results. "
                "Use when the user confirms their choice."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "plan_dir": {
                        "type": "string",
                        "description": "Path to the plan directory",
                    },
                    "category": {
                        "type": "string",
                        "description": "Category to finalize: flights, hotels, restaurants, or attractions",
                    },
                    "selected_data": {
                        "type": "object",
                        "description": "The selected option data to store as the final choice",
                    },
                },
                "required": ["plan_dir", "category", "selected_data"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_html_plan",
            "description": (
                "Generate a printable HTML summary of the trip plan. "
                "Use when the user wants to export, print, or share their finalized trip."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "plan_dir": {
                        "type": "string",
                        "description": "Path to the plan directory",
                    },
                },
                "required": ["plan_dir"],
            },
        },
    },
]


# ---------------------------------------------------------------------------
# Dispatcher
# ---------------------------------------------------------------------------

# Tools that use Selenium and need grid_url injected
_SELENIUM_TOOLS = {"search_flights", "search_hotels", "search_airbnb", "search_restaurants", "search_attractions"}

# Tools that operate on trip state and need plans_dir injected
_TRIP_STATE_TOOLS = {"create_trip", "load_trip", "save_trip", "update_trip", "list_plans", "finalize_selection"}


def execute_tool(name: str, arguments: dict, config: dict) -> str:
    """Execute a tool by name with the given arguments.

    Args:
        name: Tool name
        arguments: Tool input dict
        config: Runtime config with "grid_url" and "plans_dir" keys

    Returns:
        JSON string of the tool result
    """
    try:
        result = _dispatch(name, arguments, config)
        return json.dumps(result, default=str)
    except Exception as exc:
        return json.dumps({"error": str(exc)})


def _dispatch(name: str, args: dict, config: dict) -> Any:
    grid_url = config.get("grid_url", "")
    plans_dir = config.get("plans_dir", "./plans")

    # -- Selenium-based search tools --

    if name == "search_flights":
        return search_flights(
            origin=args["origin"],
            dest=args["dest"],
            depart=args["depart"],
            return_date=args.get("return_date"),
            adults=args.get("adults", 1),
            children_ages=args.get("children_ages"),
            nonstop=args.get("nonstop", False),
            sort=args.get("sort", "bestflight_a"),
            grid_url=grid_url,
        )

    if name == "search_hotels":
        return search_kayak_hotels(
            city=args["city"],
            checkin=args["checkin"],
            checkout=args["checkout"],
            adults=args.get("adults", 2),
            children_ages=args.get("children_ages"),
            city_id=args.get("city_id"),
            sort=args.get("sort", "rank_a"),
            grid_url=grid_url,
        )

    if name == "search_airbnb":
        return search_airbnb(
            neighborhood=args["neighborhood"],
            city=args["city"],
            state=args["state"],
            checkin=args["checkin"],
            checkout=args["checkout"],
            adults=args.get("adults", 2),
            children=args.get("children", 0),
            children_ages=args.get("children_ages"),
            price_max=args.get("price_max"),
            min_bedrooms=args.get("min_bedrooms"),
            grid_url=grid_url,
        )

    if name == "search_restaurants":
        return search_restaurants(
            destination=args["destination"],
            cuisine=args.get("cuisine"),
            sort=args.get("sort", "rating"),
            family_friendly=args.get("family_friendly", False),
            price=args.get("price"),
            grid_url=grid_url,
        )

    if name == "search_attractions":
        return search_attractions(
            destination=args["destination"],
            interest=args.get("interest"),
            grid_url=grid_url,
        )

    # -- Trip state tools --

    if name == "create_trip":
        plan_dir = trip_state.create_trip(
            destination=args["destination"],
            origin=args.get("origin", ""),
            dates=args.get("dates", {}),
            travelers=args.get("travelers", {}),
            preferences=args.get("preferences", {}),
            plans_dir=plans_dir,
        )
        return {"plan_dir": plan_dir}

    if name == "load_trip":
        return trip_state.load_trip(plan_dir=args["plan_dir"])

    if name == "save_trip":
        trip_state.save_trip(plan_dir=args["plan_dir"], data=args["data"])
        return {"status": "saved", "plan_dir": args["plan_dir"]}

    if name == "update_trip":
        trip_state.update_section(
            plan_dir=args["plan_dir"],
            section=args["section"],
            data=args["data"],
        )
        return {"status": "updated", "plan_dir": args["plan_dir"], "section": args["section"]}

    if name == "list_plans":
        return trip_state.list_plans(plans_dir=args.get("plans_dir", plans_dir))

    if name == "finalize_selection":
        trip_state.finalize_selection(
            plan_dir=args["plan_dir"],
            category=args["category"],
            selected_data=args["selected_data"],
        )
        return {"status": "finalized", "plan_dir": args["plan_dir"], "category": args["category"]}

    if name == "generate_html_plan":
        from .tools.html_generator import generate_html_plan
        return generate_html_plan(
            plan_dir=args["plan_dir"],
            provider=config.get("provider"),
        )

    raise ValueError(f"Unknown tool: {name}")
