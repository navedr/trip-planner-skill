import type {
  Trip,
  FlightOption,
  HotelOption,
  Restaurant,
  Attraction,
  ItineraryDay,
  MapItem,
} from "./types";

export const MOCK_TRIPS: Trip[] = [
  {
    id: "mock-slc",
    slug: "slc-may-2026",
    destination: "Salt Lake City",
    origin: "SEA",
    depart_date: "2026-05-26",
    return_date: "2026-06-02",
    duration_days: 7,
    travelers_json: { adults: 2, children_ages: [8, 5] },
    preferences_json: {
      food: "family-friendly, local cuisine",
      hotels: "downtown, pool",
    },
    status: "researching",
    item_counts: { flights: 4, hotels: 3, restaurants: 6, attractions: 5 },
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-09T00:00:00Z",
  },
  {
    id: "mock-tokyo",
    slug: "tokyo-oct-2026",
    destination: "Tokyo",
    origin: "SEA",
    depart_date: "2026-10-10",
    return_date: "2026-10-20",
    duration_days: 10,
    travelers_json: { adults: 2, children_ages: [] },
    preferences_json: {
      food: "sushi, ramen, izakaya",
      excursions: "temples, Akihabara",
    },
    status: "planning",
    item_counts: { flights: 0, hotels: 0, restaurants: 0, attractions: 0 },
    created_at: "2026-04-08T00:00:00Z",
    updated_at: "2026-04-08T00:00:00Z",
  },
  {
    id: "mock-bali",
    slug: "bali-dec-2026",
    destination: "Bali",
    origin: "SEA",
    depart_date: "2026-12-18",
    return_date: "2026-12-28",
    duration_days: 10,
    travelers_json: { adults: 2, children_ages: [8, 5] },
    preferences_json: {
      hotels: "villa with pool",
      excursions: "rice terraces, snorkeling",
    },
    status: "planning",
    item_counts: { flights: 0, hotels: 0, restaurants: 0, attractions: 0 },
    created_at: "2026-04-10T00:00:00Z",
    updated_at: "2026-04-10T00:00:00Z",
  },
];

export const MOCK_FLIGHTS: FlightOption[] = [
  {
    id: "f1",
    airline: "Delta",
    flight_number: "DL1842",
    depart_time: "6:00 AM",
    arrive_time: "8:45 AM",
    duration: "2h 45m",
    stops: 0,
    price_per_person: 198,
    price_total: 792,
    class: "economy",
    booking_url: "https://www.kayak.com/flights/SEA-SLC/2026-05-26",
    direction: "outbound",
    is_selected: true,
  },
  {
    id: "f2",
    airline: "Alaska",
    flight_number: "AS1524",
    depart_time: "10:30 AM",
    arrive_time: "1:15 PM",
    duration: "2h 45m",
    stops: 0,
    price_per_person: 224,
    price_total: 896,
    class: "economy",
    booking_url: "https://www.kayak.com/flights/SEA-SLC/2026-05-26",
    direction: "outbound",
    is_selected: false,
  },
  {
    id: "f3",
    airline: "Delta",
    flight_number: "DL2301",
    depart_time: "3:15 PM",
    arrive_time: "5:50 PM",
    duration: "2h 35m",
    stops: 0,
    price_per_person: 187,
    price_total: 748,
    class: "economy",
    booking_url: "https://www.kayak.com/flights/SLC-SEA/2026-06-02",
    direction: "return",
    is_selected: true,
  },
  {
    id: "f4",
    airline: "United",
    flight_number: "UA678",
    depart_time: "7:20 PM",
    arrive_time: "9:55 PM",
    duration: "2h 35m",
    stops: 0,
    price_per_person: 212,
    price_total: 848,
    class: "economy",
    booking_url: "https://www.kayak.com/flights/SLC-SEA/2026-06-02",
    direction: "return",
    is_selected: false,
  },
];

export const MOCK_HOTELS: HotelOption[] = [
  {
    id: "h1",
    name: "Kimpton Hotel Monaco",
    location: "Downtown SLC",
    star_rating: 4,
    guest_rating: 8.7,
    guest_rating_source: "Kayak",
    review_count: 2140,
    price_per_night: 189,
    price_total: 1323,
    amenities: ["Pool", "Restaurant", "Spa", "Pet-friendly", "Fitness center"],
    room_type: "Deluxe King",
    review_summary: "Boutique charm in a historic building. Great location near Temple Square.",
    booking_url: "https://www.kayak.com/hotels/Kimpton-Hotel-Monaco-SLC",
    is_selected: true,
  },
  {
    id: "h2",
    name: "Hyatt Regency Salt Lake City",
    location: "Downtown SLC",
    star_rating: 4,
    guest_rating: 8.3,
    guest_rating_source: "Kayak",
    review_count: 1856,
    price_per_night: 165,
    price_total: 1155,
    amenities: ["Pool", "Restaurant", "Fitness center", "Business center"],
    room_type: "Standard King",
    review_summary: "Modern high-rise hotel connected to the convention center. Rooftop pool.",
    booking_url: "https://www.kayak.com/hotels/Hyatt-Regency-SLC",
    is_selected: false,
  },
  {
    id: "h3",
    name: "Snowbird Mountain Lodge",
    location: "Little Cottonwood Canyon",
    star_rating: 3,
    guest_rating: 8.9,
    guest_rating_source: "Kayak",
    review_count: 967,
    price_per_night: 142,
    price_total: 994,
    amenities: ["Mountain views", "Hot tub", "Ski-in/ski-out", "Restaurant"],
    room_type: "Mountain View Suite",
    review_summary: "Stunning canyon setting. 30 min from downtown but worth the drive.",
    booking_url: "https://www.kayak.com/hotels/Snowbird-Lodge-SLC",
    is_selected: false,
  },
];

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: "r1",
    name: "Red Iguana",
    cuisine: "Mexican",
    price_level: "$$",
    rating: 4.7,
    review_count: 4200,
    highlights: "Famous mole sauces (7 varieties). The mole negro is a must-try.",
    address: "736 W N Temple, SLC",
    neighborhood: "West Downtown",
    best_for: "Family dinner",
    url: "https://www.yelp.com/biz/red-iguana-salt-lake-city",
  },
  {
    id: "r2",
    name: "The Copper Onion",
    cuisine: "New American",
    price_level: "$$$",
    rating: 4.5,
    review_count: 2800,
    highlights: "Seasonal menu, craft cocktails. Burger is legendary.",
    address: "111 E Broadway, SLC",
    neighborhood: "Downtown",
    best_for: "Date night",
    url: "https://www.yelp.com/biz/the-copper-onion-salt-lake-city",
  },
  {
    id: "r3",
    name: "Pretty Bird",
    cuisine: "Fried Chicken",
    price_level: "$$",
    rating: 4.6,
    review_count: 1500,
    highlights: "Nashville hot chicken. Spice levels from mild to 'Burn Baby Burn'.",
    address: "146 S Regent St, SLC",
    neighborhood: "Downtown",
    best_for: "Quick lunch",
    url: "https://www.yelp.com/biz/pretty-bird-salt-lake-city",
  },
  {
    id: "r4",
    name: "Takashi",
    cuisine: "Japanese / Sushi",
    price_level: "$$$",
    rating: 4.6,
    review_count: 1900,
    highlights: "Best sushi in Utah. Omakase is exceptional. Make reservations.",
    address: "18 W Market St, SLC",
    neighborhood: "Downtown",
    best_for: "Special dinner",
    url: "https://www.yelp.com/biz/takashi-salt-lake-city",
  },
  {
    id: "r5",
    name: "Curry Up Now",
    cuisine: "Indian Street Food",
    price_level: "$",
    rating: 4.3,
    review_count: 890,
    highlights: "Tikka masala burritos, deconstructed samosas. Fun fusion.",
    address: "57 W 200 S, SLC",
    neighborhood: "Downtown",
    best_for: "Family lunch",
    url: "https://www.yelp.com/biz/curry-up-now-salt-lake-city",
  },
  {
    id: "r6",
    name: "Log Haven",
    cuisine: "Fine Dining / American",
    price_level: "$$$$",
    rating: 4.8,
    review_count: 1200,
    highlights: "Romantic canyon setting, seasonal tasting menus, award-winning wine list.",
    address: "6451 E Millcreek Canyon Rd",
    neighborhood: "Millcreek Canyon",
    best_for: "Anniversary dinner",
    url: "https://www.yelp.com/biz/log-haven-salt-lake-city",
  },
];

export const MOCK_ATTRACTIONS: Attraction[] = [
  {
    id: "a1",
    name: "Hogle Zoo",
    type: "zoo",
    rating: 4.5,
    review_count: 3200,
    price: "$20/adult, $15/child",
    hours: "9 AM – 5 PM",
    duration: "3-4 hours",
    highlights: "One of the top zoos in the West. Rocky Shores exhibit, giraffe encounter.",
    family_friendly: true,
    url: "https://www.hoglezoo.org",
  },
  {
    id: "a2",
    name: "Natural History Museum of Utah",
    type: "museum",
    rating: 4.7,
    review_count: 2800,
    price: "$18/adult, $12/child",
    hours: "10 AM – 5 PM",
    duration: "2-3 hours",
    highlights: "Stunning Rio Tinto Center building. Dinosaur hall, Native Voices gallery.",
    family_friendly: true,
    url: "https://nhmu.utah.edu",
  },
  {
    id: "a3",
    name: "Temple Square",
    type: "landmark",
    rating: 4.6,
    review_count: 5100,
    price: "Free",
    hours: "9 AM – 9 PM",
    duration: "1-2 hours",
    highlights: "Historic 35-acre plaza. Beautiful gardens, visitor center, organ recitals.",
    family_friendly: true,
    url: "https://www.churchofjesuschrist.org/feature/temple-square",
  },
  {
    id: "a4",
    name: "Great Salt Lake State Park",
    type: "nature",
    rating: 4.2,
    review_count: 1800,
    price: "$5 parking",
    hours: "Sunrise – Sunset",
    duration: "2-3 hours",
    highlights: "Float in the salty water! Antelope Island for bison viewing. Spectacular sunsets.",
    family_friendly: true,
    url: "https://stateparks.utah.gov/parks/great-salt-lake",
  },
  {
    id: "a5",
    name: "Red Butte Garden",
    type: "garden",
    rating: 4.8,
    review_count: 2100,
    price: "$16/adult, $10/child",
    hours: "9 AM – 7:30 PM",
    duration: "2-3 hours",
    highlights: "Gorgeous botanical garden in foothills. Concert series in summer.",
    family_friendly: true,
    url: "https://www.redbuttegarden.org",
  },
];

export const MOCK_ITINERARY: ItineraryDay[] = [
  {
    day_number: 1,
    date: "2026-05-26",
    theme: "Arrival Day",
    subtitle: "Settle in & explore downtown",
    is_flight_day: true,
    activities: [
      { time: "6:00 AM", name: "Depart SEA → SLC (DL1842)", detail: "2h 45m nonstop", tags: ["flight"] },
      { time: "11:00 AM", name: "Check in at Kimpton Hotel Monaco", detail: "Early check-in requested", tags: [] },
      { time: "12:30 PM", name: "Lunch at Pretty Bird", detail: "Nashville hot chicken downtown", tags: ["meal"] },
      { time: "2:00 PM", name: "Temple Square", detail: "Walk the grounds, visitor center", tags: ["stroller-ok"] },
      { time: "6:00 PM", name: "Dinner at Red Iguana", detail: "Try all seven mole sauces", tags: ["meal"] },
    ],
  },
  {
    day_number: 2,
    date: "2026-05-27",
    theme: "Zoo & Natural History",
    subtitle: "Perfect kid day",
    is_flight_day: false,
    activities: [
      { time: "9:00 AM", name: "Hogle Zoo", detail: "Rocky Shores exhibit, giraffe encounter", tags: ["all-day", "stroller-ok"] },
      { time: "12:00 PM", name: "Lunch at zoo café", detail: null, tags: ["meal"] },
      { time: "2:00 PM", name: "Natural History Museum of Utah", detail: "Dinosaur hall, hands-on exhibits", tags: ["stroller-ok"] },
      { time: "5:30 PM", name: "Dinner at Curry Up Now", detail: "Quick & fun for the kids", tags: ["meal"] },
    ],
  },
  {
    day_number: 3,
    date: "2026-05-28",
    theme: "Mountains & Gardens",
    subtitle: "Canyons and blooms",
    is_flight_day: false,
    activities: [
      { time: "9:00 AM", name: "Red Butte Garden", detail: "Spring blooms at their peak", tags: ["stroller-ok"] },
      { time: "12:00 PM", name: "Lunch at The Copper Onion", detail: "The legendary burger", tags: ["meal"] },
      { time: "2:00 PM", name: "Big Cottonwood Canyon drive", detail: "Scenic drive, short hikes", tags: ["30-min-drive"] },
      { time: "6:30 PM", name: "Dinner at Takashi", detail: "Omakase — reserve ahead", tags: ["meal"] },
    ],
  },
  {
    day_number: 4,
    date: "2026-05-29",
    theme: "Great Salt Lake",
    subtitle: "The lake that floats you",
    is_flight_day: false,
    activities: [
      { time: "9:00 AM", name: "Great Salt Lake State Park", detail: "Swim/float, beach time", tags: [] },
      { time: "11:00 AM", name: "Antelope Island", detail: "Bison viewing, short hike", tags: ["30-min-drive"] },
      { time: "1:00 PM", name: "Picnic lunch on the island", detail: "Pack from hotel or grab on the way", tags: ["meal"] },
      { time: "4:00 PM", name: "Free time at hotel pool", detail: "Kids' pool time", tags: [] },
      { time: "7:00 PM", name: "Dinner at Log Haven", detail: "Canyon fine dining — special night", tags: ["meal", "30-min-drive"] },
    ],
  },
  {
    day_number: 5,
    date: "2026-05-30",
    theme: "Relaxed Downtown Day",
    subtitle: "Shopping, treats & city vibes",
    is_flight_day: false,
    activities: [
      { time: "10:00 AM", name: "City Creek Center", detail: "Shopping + retractable roof", tags: ["stroller-ok"] },
      { time: "12:00 PM", name: "Lunch at Pretty Bird", detail: "Back for seconds — try a different spice level", tags: ["meal"] },
      { time: "2:00 PM", name: "Discovery Gateway Children's Museum", detail: "Hands-on exhibits for kids", tags: ["stroller-ok"] },
      { time: "5:00 PM", name: "Hotel pool & rest", detail: null, tags: [] },
      { time: "7:00 PM", name: "Dinner at Red Iguana", detail: "Can't leave without one more visit", tags: ["meal"] },
    ],
  },
  {
    day_number: 6,
    date: "2026-05-31",
    theme: "Park City Day Trip",
    subtitle: "Mountain town vibes",
    is_flight_day: false,
    activities: [
      { time: "9:00 AM", name: "Drive to Park City", detail: "35 min via I-80", tags: ["30-min-drive"] },
      { time: "10:00 AM", name: "Historic Main Street", detail: "Browse galleries, shops, Olympic memorabilia", tags: ["stroller-ok"] },
      { time: "12:00 PM", name: "Lunch on Main Street", detail: "Many family-friendly options", tags: ["meal"] },
      { time: "2:00 PM", name: "Alpine Coaster at Park City", detail: "Fun for the whole family", tags: [] },
      { time: "4:00 PM", name: "Return to SLC", detail: null, tags: [] },
      { time: "6:30 PM", name: "Dinner at The Copper Onion", detail: "Last night downtown dinner", tags: ["meal"] },
    ],
  },
  {
    day_number: 7,
    date: "2026-06-02",
    theme: "Departure Day",
    subtitle: "Last morning in SLC",
    is_flight_day: true,
    activities: [
      { time: "8:00 AM", name: "Breakfast at hotel", detail: null, tags: ["meal"] },
      { time: "10:00 AM", name: "Last-minute souvenir shopping", detail: "City Creek or airport shops", tags: [] },
      { time: "12:00 PM", name: "Check out & head to airport", detail: null, tags: [] },
      { time: "3:15 PM", name: "Depart SLC → SEA (DL2301)", detail: "2h 35m nonstop", tags: ["flight"] },
    ],
  },
];

/** Get the full mock trip detail for a given trip ID */
export function getMockTrip(id: string): Trip | undefined {
  return MOCK_TRIPS.find((t) => t.id === id);
}

/** Get mock items by category for the SLC trip */
export function getMockItems(
  tripId: string,
  category: string,
): FlightOption[] | HotelOption[] | Restaurant[] | Attraction[] {
  if (tripId !== "mock-slc") return [];
  switch (category) {
    case "flight":
      return MOCK_FLIGHTS;
    case "hotel":
      return MOCK_HOTELS;
    case "restaurant":
      return MOCK_RESTAURANTS;
    case "attraction":
      return MOCK_ATTRACTIONS;
    default:
      return [];
  }
}

/** Get mock itinerary (only SLC trip has one) */
export function getMockItinerary(tripId: string): ItineraryDay[] {
  if (tripId !== "mock-slc") return [];
  return MOCK_ITINERARY;
}

/** Mock map items for the SLC trip with real coordinates */
export const MOCK_MAP_ITEMS: MapItem[] = [
  // Hotels
  { id: "h1", name: "Kimpton Hotel Monaco", category: "hotel", location: { lat: 40.7596, lng: -111.8918 }, detail: "Downtown SLC", url: "https://www.kayak.com/hotels/Kimpton-Hotel-Monaco-SLC" },
  { id: "h2", name: "Hyatt Regency Salt Lake City", category: "hotel", location: { lat: 40.7608, lng: -111.8910 }, detail: "Downtown SLC", url: "https://www.kayak.com/hotels/Hyatt-Regency-SLC" },
  { id: "h3", name: "Snowbird Mountain Lodge", category: "hotel", location: { lat: 40.5811, lng: -111.6565 }, detail: "Little Cottonwood Canyon", url: "https://www.kayak.com/hotels/Snowbird-Lodge-SLC" },
  // Restaurants
  { id: "r1", name: "Red Iguana", category: "restaurant", location: { lat: 40.7717, lng: -111.9108 }, detail: "Mexican — Famous mole sauces", url: "https://www.yelp.com/biz/red-iguana-salt-lake-city" },
  { id: "r2", name: "The Copper Onion", category: "restaurant", location: { lat: 40.7630, lng: -111.8873 }, detail: "New American", url: "https://www.yelp.com/biz/the-copper-onion-salt-lake-city" },
  { id: "r3", name: "Pretty Bird", category: "restaurant", location: { lat: 40.7637, lng: -111.8831 }, detail: "Fried Chicken", url: "https://www.yelp.com/biz/pretty-bird-salt-lake-city" },
  { id: "r4", name: "Takashi", category: "restaurant", location: { lat: 40.7625, lng: -111.8918 }, detail: "Japanese / Sushi", url: "https://www.yelp.com/biz/takashi-salt-lake-city" },
  { id: "r5", name: "Curry Up Now", category: "restaurant", location: { lat: 40.7642, lng: -111.8924 }, detail: "Indian Street Food", url: "https://www.yelp.com/biz/curry-up-now-salt-lake-city" },
  { id: "r6", name: "Log Haven", category: "restaurant", location: { lat: 40.6885, lng: -111.7730 }, detail: "Fine Dining", url: "https://www.yelp.com/biz/log-haven-salt-lake-city" },
  // Attractions
  { id: "a1", name: "Hogle Zoo", category: "attraction", location: { lat: 40.7474, lng: -111.8148 }, detail: "Zoo — 3-4 hours", url: "https://www.hoglezoo.org" },
  { id: "a2", name: "Natural History Museum of Utah", category: "attraction", location: { lat: 40.7584, lng: -111.8243 }, detail: "Museum — 2-3 hours", url: "https://nhmu.utah.edu" },
  { id: "a3", name: "Temple Square", category: "attraction", location: { lat: 40.7707, lng: -111.8937 }, detail: "Landmark — Free", url: "https://www.churchofjesuschrist.org/feature/temple-square" },
  { id: "a4", name: "Great Salt Lake State Park", category: "attraction", location: { lat: 40.7669, lng: -112.1004 }, detail: "Nature — Sunrise to Sunset", url: "https://stateparks.utah.gov/parks/great-salt-lake" },
  { id: "a5", name: "Red Butte Garden", category: "attraction", location: { lat: 40.7665, lng: -111.8266 }, detail: "Garden — 2-3 hours", url: "https://www.redbuttegarden.org" },
];

/** Get mock map items (only SLC has geocoded data) */
export function getMockMapItems(tripId: string): MapItem[] {
  if (tripId !== "mock-slc") return [];
  return MOCK_MAP_ITEMS;
}
