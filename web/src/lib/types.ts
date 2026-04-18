export interface Trip {
  id: string;
  slug: string;
  destination: string;
  origin: string;
  depart_date: string;
  return_date: string;
  duration_days: number;
  travelers_json?: {
    adults: number;
    children_ages: number[];
    names?: string[];
  } | null;
  travelers?: {
    adults: number;
    children_ages: number[];
    names?: string[];
  } | null;
  preferences_json?: {
    flights?: string;
    hotels?: string;
    food?: string;
    excursions?: string;
  } | null;
  preferences?: {
    flights?: string;
    hotels?: string;
    food?: string;
    excursions?: string;
  } | null;
  status: "planning" | "researching" | "ready";
  item_counts?: {
    flight?: number;
    hotel?: number;
    restaurant?: number;
    attraction?: number;
    // Also accept plural keys from mock data
    flights?: number;
    hotels?: number;
    restaurants?: number;
    attractions?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface TripCreate {
  destination: string;
  origin: string;
  depart_date: string;
  return_date: string;
  adults: number;
  children_ages: number[];
  preferences?: {
    flights?: string;
    hotels?: string;
    food?: string;
    excursions?: string;
  };
}

export interface FlightOption {
  id: string;
  airline: string;
  flight_number: string | null;
  depart_time: string;
  arrive_time: string;
  duration: string;
  stops: number;
  price_per_person: number;
  price_total: number | null;
  class: string;
  booking_url: string | null;
  direction: "outbound" | "return";
  is_selected: boolean;
}

export interface HotelOption {
  id: string;
  name: string;
  location: string;
  star_rating: number | null;
  guest_rating: number | null;
  guest_rating_source: string | null;
  review_count: number | null;
  price_per_night: number;
  price_total: number | null;
  amenities: string[];
  room_type: string | null;
  review_summary: string | null;
  booking_url: string | null;
  is_selected: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  price_level: string | null;
  rating: number | null;
  review_count: number | null;
  highlights: string | null;
  address: string | null;
  neighborhood: string | null;
  best_for: string | null;
  url: string | null;
}

export interface Attraction {
  id: string;
  name: string;
  type: string;
  rating: number | null;
  review_count: number | null;
  price: string | null;
  hours: string | null;
  duration: string | null;
  highlights: string | null;
  family_friendly: boolean;
  url: string | null;
}

export interface ItineraryActivity {
  time: string | null;
  name: string;
  detail: string | null;
  tags: string[];
}

export interface ItineraryDay {
  id?: string;
  day_number: number;
  date: string;
  theme: string;
  subtitle: string | null;
  is_flight_day: boolean;
  activities: ItineraryActivity[];
}

export type TripItemCategory = "flight" | "hotel" | "restaurant" | "attraction";

/** Shared geo fields added by backend geocoding */
export interface GeoLocation {
  lat: number;
  lng: number;
}

/** Unified marker data for the map tab */
export interface MapItem {
  id: string;
  name: string;
  category: TripItemCategory;
  /** null = coords not yet known; frontend will geocode client-side and PATCH back. */
  location: GeoLocation | null;
  /** Present only when `location` is null — pass straight to google.maps.Geocoder. */
  address_hint?: string | null;
  is_selected?: boolean;
  data?: Record<string, unknown>;
  detail?: string | null;
  url?: string | null;
  time?: string | null;
}
