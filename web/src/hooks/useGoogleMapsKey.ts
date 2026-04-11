import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface MapsKeyResponse {
  key: string;
}

/**
 * Fetches the Google Maps API key from the backend settings endpoint.
 * The key is stored server-side so it stays out of frontend source.
 */
export function useGoogleMapsKey() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["google-maps-key"],
    queryFn: () => apiFetch<MapsKeyResponse>("/settings/maps-key"),
    staleTime: Infinity,
    retry: false,
  });

  return {
    apiKey: data?.key ?? null,
    isLoading,
    error,
  };
}
