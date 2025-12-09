"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Crosshair,
  Navigation,
  Plus,
  Search,
  X,
  MapPin as MapPinIcon,
  AlertTriangle,
  RefreshCw,
  WifiOff,
  Key,
} from "lucide-react";

// Get Mapbox token with validation
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const AURORA_MAP_STYLE = "mapbox://styles/malunao/cm84u5ecf000x01qled5j8bvl";
const FALLBACK_STYLE = "mapbox://styles/mapbox/streets-v12";

// Set access token only if available
if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

// Debounce helper for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface SafetyMapProps {
  lifeDimension?: string;
  onMarkerClick?: (postId: string) => void;
  onLocationSelect?: (location: {
    lat: number;
    lng: number;
    address: string;
  }) => void;
  ratingFilter?: number;
}

// Error states for better debugging
type MapErrorType =
  | "no_token"
  | "style_error"
  | "network_error"
  | "webgl_error"
  | "unknown";

interface MapError {
  type: MapErrorType;
  message: string;
  details?: string;
}

export function SafetyMap({
  lifeDimension,
  onMarkerClick,
  onLocationSelect,
  ratingFilter,
}: SafetyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const userLocationMarker = useRef<mapboxgl.Marker | null>(null);
  const markersCreated = useRef(false);
  const styleLoadAttempts = useRef(0);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<MapError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapState, setMapState] = useState<{
    center: [number, number];
    zoom: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [nearbyPosts, setNearbyPosts] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [usingFallbackStyle, setUsingFallbackStyle] = useState(false);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch posts with location data - OPTIMIZED with limit for mobile
  const posts = useQuery(api.posts.getPostsForMap, {
    lifeDimension: lifeDimension as any,
    limit: 100, // Reduced limit for better mobile performance
    minRating: ratingFilter || 1,
  });

  // Fetch workplace reports with location
  const workplaceReports = useQuery(api.workplaceReports.getReportsForMap, {});

  // Memoize filtered posts to prevent unnecessary recalculations
  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    return posts.filter((post) => {
      if (ratingFilter && post.rating < ratingFilter) return false;
      return true;
    });
  }, [posts, ratingFilter]);

  // Check WebGL support
  const checkWebGLSupport = useCallback((): boolean => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      return !!gl;
    } catch {
      return false;
    }
  }, []);

  // Initialize map with better error handling
  const initializeMap = useCallback(
    (useCustomStyle: boolean = true) => {
      if (!mapContainer.current) return;

      // Check for token first
      if (!MAPBOX_TOKEN) {
        setMapError({
          type: "no_token",
          message: "Mapbox API key not configured",
          details:
            "Please add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables.",
        });
        return;
      }

      // Check WebGL support
      if (!checkWebGLSupport()) {
        setMapError({
          type: "webgl_error",
          message: "WebGL not supported",
          details:
            "Your browser or device does not support WebGL, which is required for interactive maps.",
        });
        return;
      }

      // Cleanup existing map
      if (map.current) {
        map.current.remove();
        map.current = null;
      }

      try {
        const styleToUse = useCustomStyle ? AURORA_MAP_STYLE : FALLBACK_STYLE;

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: styleToUse,
          center: mapState?.center || [-98.5795, 39.8283], // Use saved state or USA center
          zoom: mapState?.zoom || 4,
          attributionControl: false,
          fadeDuration: 0, // Instant tile transitions for better perceived performance
          trackResize: true,
          renderWorldCopies: false, // Better performance
          maxZoom: 18,
          minZoom: 2,
        });

        // Handle style load errors
        map.current.on("error", (e) => {
          console.debug("Map error event:", e);

          // Check for style-related errors
          if (
            e.error?.message?.includes("style") ||
            e.error?.message?.includes("Style")
          ) {
            if (useCustomStyle && styleLoadAttempts.current < 1) {
              styleLoadAttempts.current++;
              console.log("Custom style failed, trying fallback style...");
              setUsingFallbackStyle(true);
              initializeMap(false);
              return;
            }
          }

          // Check for network errors
          if (
            e.error?.message?.includes("Failed to fetch") ||
            e.error?.message?.includes("NetworkError") ||
            e.error?.message?.includes("net::ERR")
          ) {
            // Don't show error for individual tile failures
            if (!mapLoaded) {
              setMapError({
                type: "network_error",
                message: "Network error loading map",
                details:
                  "Check your internet connection or try disabling ad blockers.",
              });
            }
          }
        });

        map.current.on("load", () => {
          console.log("Map loaded successfully");
          setMapLoaded(true);
          setMapError(null);
          setIsRetrying(false);
        });

        // Debounced map state save
        let moveEndTimeout: NodeJS.Timeout;
        map.current.on("moveend", () => {
          clearTimeout(moveEndTimeout);
          moveEndTimeout = setTimeout(() => {
            if (map.current) {
              setMapState({
                center: map.current.getCenter().toArray() as [number, number],
                zoom: map.current.getZoom(),
              });
            }
          }, 150);
        });

        // Add click handler for location selection
        map.current.on("click", async (e) => {
          if (!isSelectingLocation || !onLocationSelect) return;

          const { lng, lat } = e.lngLat;

          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`,
            );
            const data = await response.json();
            const address =
              data.features[0]?.place_name ||
              `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

            if (map.current) {
              setMapState({
                center: map.current.getCenter().toArray() as [number, number],
                zoom: map.current.getZoom(),
              });
            }

            onLocationSelect({ lat, lng, address });
            setIsSelectingLocation(false);
          } catch (error) {
            console.error("Geocoding error:", error);

            if (map.current) {
              setMapState({
                center: map.current.getCenter().toArray() as [number, number],
                zoom: map.current.getZoom(),
              });
            }

            onLocationSelect({
              lat,
              lng,
              address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            });
            setIsSelectingLocation(false);
          }
        });
      } catch (error) {
        console.error("Map initialization error:", error);
        setMapError({
          type: "unknown",
          message: "Failed to initialize map",
          details:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    },
    [
      mapState,
      checkWebGLSupport,
      isSelectingLocation,
      onLocationSelect,
      mapLoaded,
    ],
  );

  // Initialize map on mount
  useEffect(() => {
    initializeMap(true);

    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];

      if (userLocationMarker.current) {
        userLocationMarker.current.remove();
      }

      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Retry handler
  const handleRetry = useCallback(() => {
    setIsRetrying(true);
    setMapError(null);
    styleLoadAttempts.current = 0;
    setTimeout(() => {
      initializeMap(true);
    }, 500);
  }, [initializeMap]);

  // Incident labels
  const incidentLabels: Record<string, string> = useMemo(
    () => ({
      harassment: "Sexual Harassment",
      discrimination: "Discrimination",
      pay_inequality: "Pay Inequality",
      hostile_environment: "Hostile Environment",
      retaliation: "Retaliation",
      other: "Workplace Issue",
    }),
    [],
  );

  // Create marker element - optimized helper with touch support
  const createPostMarker = useCallback((post: any, onClick?: () => void) => {
    const color =
      post.rating >= 4 ? "#22c55e" : post.rating >= 3 ? "#eab308" : "#ef4444";

    const el = document.createElement("div");
    el.className = "aurora-safety-marker";
    el.style.cssText = `
      width: 28px; height: 28px; border-radius: 50%;
      background-color: ${color}; border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      cursor: pointer; display: flex; align-items: center;
      justify-content: center; font-size: 12px; font-weight: bold; color: white;
      transition: transform 0.15s ease;
      position: relative;
      z-index: 1;
    `;
    el.textContent = post.rating.toString();

    // Desktop hover effect
    el.addEventListener("mouseenter", () => {
      el.style.transform = "scale(1.15)";
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "scale(1)";
    });

    if (onClick) {
      // Support both click and touch for mobile
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onClick();
      });
      el.addEventListener("touchend", (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      });
    }
    return el;
  }, []);

  const createWorkplaceMarker = useCallback(() => {
    const el = document.createElement("div");
    el.className = "aurora-workplace-marker";
    el.style.cssText = `
      width: 28px; height: 28px; background-color: #ec4c28;
      border: 2px solid white; box-shadow: 0 2px 6px rgba(236, 76, 40, 0.5);
      cursor: pointer; display: flex; align-items: center;
      justify-content: center; font-size: 12px; border-radius: 4px; transform: rotate(45deg);
      transition: transform 0.15s ease;
      position: relative;
      z-index: 1;
    `;
    el.innerHTML = '<span style="transform: rotate(-45deg);">⚠️</span>';

    el.addEventListener("mouseenter", () => {
      el.style.transform = "rotate(45deg) scale(1.15)";
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "rotate(45deg) scale(1)";
    });

    return el;
  }, []);

  // Update markers when posts or workplace reports change - batched for performance
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Batch marker creation using requestAnimationFrame
    const createMarkers = () => {
      if (!map.current) return;

      // Add post markers
      filteredPosts.forEach((post) => {
        if (!post.location || !map.current) return;

        const [lng, lat] = post.location.coordinates as [number, number];

        // Validate coordinates
        if (
          typeof lng !== "number" ||
          typeof lat !== "number" ||
          lat < -90 || lat > 90 ||
          lng < -180 || lng > 180
        ) {
          console.warn("Invalid coordinates for post:", post._id, lng, lat);
          return;
        }

        const el = createPostMarker(
          post,
          onMarkerClick ? () => onMarkerClick(post._id) : undefined,
        );

        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current!);

        const locationName = post.location.name || "Unknown location";
        let popupAdded = false;

        // Helper to show popup
        const showPopup = () => {
          if (!popupAdded && map.current) {
            marker.setPopup(
              new mapboxgl.Popup({ 
                offset: [0, -14], 
                closeButton: true,
                anchor: 'bottom',
                className: 'aurora-map-popup'
              }).setHTML(`
              <div style="padding: 8px; max-width: 200px;">
                <div style="font-weight: 600; font-size: 13px; color: #1a1a1a; margin-bottom: 4px;">${post.title}</div>
                <div style="font-size: 11px; color: #666;">${locationName}</div>
                <div style="margin-top: 6px; display: flex; align-items: center; gap: 4px;">
                  <span style="background: ${post.rating >= 4 ? "#22c55e" : post.rating >= 3 ? "#eab308" : "#ef4444"}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600;">
                    ${post.rating}★
                  </span>
                </div>
              </div>
            `),
            );
            popupAdded = true;
          }
          if (!marker.getPopup()?.isOpen()) {
            marker.togglePopup();
          }
        };

        // Desktop hover
        el.addEventListener("mouseenter", showPopup);

        el.addEventListener("mouseleave", () => {
          if (marker.getPopup()?.isOpen()) {
            marker.togglePopup();
          }
        });

        // Mobile touch - show popup on touch
        el.addEventListener("touchstart", (e) => {
          e.stopPropagation();
          showPopup();
        }, { passive: true });

        markers.current.push(marker);
      });

      // Add workplace report markers
      if (workplaceReports) {
        workplaceReports.forEach((report) => {
          if (!report.location || !map.current) return;

          const [lng, lat] = report.location.coordinates as [number, number];

          // Validate coordinates
          if (
            typeof lng !== "number" ||
            typeof lat !== "number" ||
            lat < -90 || lat > 90 ||
            lng < -180 || lng > 180
          ) {
            console.warn("Invalid coordinates for report:", report._id, lng, lat);
            return;
          }

          const el = createWorkplaceMarker();

          const marker = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map.current!);

          let popupAdded = false;

          // Helper to show popup
          const showPopup = () => {
            if (!popupAdded && map.current) {
              marker.setPopup(
                new mapboxgl.Popup({ 
                  offset: [0, -14], 
                  closeButton: true,
                  anchor: 'bottom',
                  className: 'aurora-map-popup'
                }).setHTML(`
                <div style="padding: 8px; max-width: 200px;">
                  <div style="font-weight: 600; font-size: 13px; color: #ec4c28; margin-bottom: 4px;">⚠️ Workplace Report</div>
                  <div style="font-size: 12px; color: #1a1a1a; font-weight: 500;">${report.companyName}</div>
                  <div style="font-size: 11px; color: #666; margin-top: 2px;">${incidentLabels[report.incidentType] || report.incidentType}</div>
                </div>
              `),
              );
              popupAdded = true;
            }
            if (!marker.getPopup()?.isOpen()) {
              marker.togglePopup();
            }
          };

          // Desktop hover
          el.addEventListener("mouseenter", showPopup);

          el.addEventListener("mouseleave", () => {
            if (marker.getPopup()?.isOpen()) {
              marker.togglePopup();
            }
          });

          // Mobile touch - show popup on touch
          el.addEventListener("touchstart", (e) => {
            e.stopPropagation();
            showPopup();
          }, { passive: true });

          markers.current.push(marker);
        });
      }

      // Fit to markers if we have data and map hasn't been interacted with
      if (markers.current.length > 0 && !markersCreated.current && !mapState) {
        const allLocations = [
          ...filteredPosts
            .filter((p) => p.location)
            .map((p) => p.location!.coordinates as [number, number]),
          ...(workplaceReports || [])
            .filter((r) => r.location)
            .map((r) => r.location!.coordinates as [number, number]),
        ];

        if (allLocations.length > 1) {
          const bounds = new mapboxgl.LngLatBounds();
          allLocations.forEach((coord) => bounds.extend(coord));
          map.current?.fitBounds(bounds, {
            padding: 60,
            maxZoom: 12,
            duration: 500,
          });
        }
        markersCreated.current = true;
      }
    };

    requestAnimationFrame(createMarkers);
  }, [
    filteredPosts,
    workplaceReports,
    mapLoaded,
    onMarkerClick,
    createPostMarker,
    createWorkplaceMarker,
    incidentLabels,
    mapState,
  ]);

  // Search handler
  const handleSearch = useCallback(async () => {
    if (!debouncedSearchQuery.trim() || !MAPBOX_TOKEN) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(debouncedSearchQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=5`,
      );
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [debouncedSearchQuery]);

  // Auto-search on debounced query change
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery, handleSearch]);

  const handleSelectSearchResult = useCallback(
    (result: any) => {
      const [lng, lat] = result.center;

      map.current?.flyTo({
        center: [lng, lat],
        zoom: 14,
        duration: 1000,
        essential: true,
      });

      setSearchQuery("");
      setSearchResults([]);

      // Find nearby posts
      if (filteredPosts.length > 0) {
        const nearby = filteredPosts.filter((post) => {
          if (!post.location) return false;
          const [postLng, postLat] = post.location.coordinates;
          const distance = Math.sqrt(
            Math.pow(postLng - lng, 2) + Math.pow(postLat - lat, 2),
          );
          return distance < 0.05; // ~5km radius
        });
        setNearbyPosts(nearby);
      }
    },
    [filteredPosts],
  );

  // Get user location
  const handleGetUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    const successCallback = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setUserLocation({ lat: latitude, lng: longitude });

      // Remove existing user marker
      if (userLocationMarker.current) {
        userLocationMarker.current.remove();
      }

      // Create new user location marker
      const el = document.createElement("div");
      el.className = "aurora-user-marker";
      el.style.cssText = `
        width: 20px; height: 20px; border-radius: 50%;
        background-color: #3b82f6; border: 3px solid white;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3), 0 2px 6px rgba(0,0,0,0.3);
        animation: pulse 2s ease-in-out infinite;
      `;

      // Add pulse animation
      const style = document.createElement("style");
      style.textContent = `
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3), 0 2px 6px rgba(0,0,0,0.3); }
          50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.1), 0 2px 6px rgba(0,0,0,0.3); }
        }
      `;
      document.head.appendChild(style);

      if (map.current) {
        userLocationMarker.current = new mapboxgl.Marker(el)
          .setLngLat([longitude, latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(
              '<div style="padding: 4px 8px; font-size: 12px; font-weight: 500;">Your location</div>',
            ),
          )
          .addTo(map.current);

        map.current.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          duration: 1000,
          essential: true,
        });

        // Find nearby posts
        if (filteredPosts.length > 0) {
          const nearby = filteredPosts.filter((post) => {
            if (!post.location) return false;
            const [postLng, postLat] = post.location.coordinates;
            const distance = Math.sqrt(
              Math.pow(postLng - longitude, 2) +
              Math.pow(postLat - latitude, 2),
            );
            return distance < 0.05;
          });
          setNearbyPosts(nearby);
        }
      }
    };

    const errorCallback = (error: GeolocationPositionError) => {
      let message = "Unable to get your location";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message =
            "Location access denied. Please enable location permissions in your browser settings.";
          break;
        case error.POSITION_UNAVAILABLE:
          message = "Location information is unavailable.";
          break;
        case error.TIMEOUT:
          message = "Location request timed out. Please try again.";
          break;
      }
      alert(message);
    };

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    });
  }, [filteredPosts]);

  // Error states with helpful messages
  if (mapError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-aurora-cream)] to-[var(--color-aurora-lavender)]/30">
        <div className="text-center p-8 max-w-md mx-4">
          <div className="w-16 h-16 bg-[var(--color-aurora-yellow)]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {mapError.type === "no_token" ? (
              <Key className="w-8 h-8 text-[var(--color-aurora-yellow)]" />
            ) : mapError.type === "network_error" ? (
              <WifiOff className="w-8 h-8 text-[var(--color-aurora-yellow)]" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-[var(--color-aurora-yellow)]" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            {mapError.message}
          </h3>
          <p className="text-[var(--muted-foreground)] text-sm mb-4">
            {mapError.details}
          </p>

          {mapError.type !== "no_token" && (
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              className="bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-violet)] text-white"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
          )}

          {mapError.type === "network_error" && (
            <p className="text-xs text-[var(--muted-foreground)] mt-4">
              💡 Tip: Ad blockers can sometimes block map tiles. Try disabling
              them for this site.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      {/* Map container */}
      <div
        ref={mapContainer}
        className={`w-full h-full ${isSelectingLocation ? "cursor-crosshair" : ""}`}
        style={{
          background: "linear-gradient(135deg, #f5f0ff 0%, #e8f4f8 100%)",
        }}
      />

      {/* Loading overlay */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-aurora-cream)] to-[var(--color-aurora-lavender)]/30 pointer-events-none">
          <div className="bg-[var(--card)]/95 backdrop-blur-sm rounded-2xl p-5 shadow-xl border border-[var(--border)] max-w-[280px] mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-aurora-purple)] to-[var(--color-aurora-pink)] rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <MapPinIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="w-4 h-4 animate-spin text-[var(--color-aurora-purple)]" />
                <p className="font-semibold text-[var(--foreground)] text-sm">
                  Loading Map
                </p>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                {usingFallbackStyle
                  ? "Using standard map style..."
                  : "Loading Aurora style..."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 max-w-md mx-auto">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="bg-[var(--card)]/95 backdrop-blur-sm border-[var(--border)] shadow-lg pr-10 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] h-[44px]"
          />
          <Button
            onClick={handleSearch}
            size="icon"
            className="absolute right-0 top-0 h-full text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            variant="ghost"
            disabled={isSearching}
          >
            {isSearching ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-2 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSelectSearchResult(result)}
                className="w-full text-left px-4 py-3 hover:bg-[var(--accent)] border-b border-[var(--border)] last:border-b-0 flex items-start gap-2 transition-colors"
              >
                <MapPinIcon className="w-4 h-4 text-[var(--color-aurora-purple)] mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-[var(--foreground)]">
                    {result.text}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">
                    {result.place_name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="absolute top-20 right-4 flex flex-col gap-2 z-10">
        <Button
          onClick={handleGetUserLocation}
          className="bg-[var(--card)]/95 backdrop-blur-sm text-[var(--foreground)] hover:bg-[var(--accent)] shadow-lg border border-[var(--border)] min-w-[48px] min-h-[48px] rounded-xl"
          size="icon"
          title="Go to my location"
        >
          <Navigation className="w-5 h-5 text-[var(--color-aurora-purple)]" />
        </Button>

        {onLocationSelect && (
          <Button
            onClick={() => setIsSelectingLocation(!isSelectingLocation)}
            className={`shadow-lg min-w-[48px] min-h-[48px] rounded-xl ${isSelectingLocation
                ? "bg-[var(--color-aurora-purple)] text-white hover:bg-[var(--color-aurora-violet)]"
                : "bg-[var(--card)]/95 backdrop-blur-sm text-[var(--foreground)] hover:bg-[var(--accent)] border border-[var(--border)]"
              }`}
            size="icon"
            title="Click map to mark location"
          >
            {isSelectingLocation ? (
              <Crosshair className="w-5 h-5" />
            ) : (
              <Plus className="w-5 h-5 text-[var(--color-aurora-purple)]" />
            )}
          </Button>
        )}
      </div>

      {/* Selection Mode Indicator */}
      {isSelectingLocation && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-[var(--color-aurora-purple)] text-white px-4 py-2 rounded-xl shadow-lg z-20">
          <p className="text-sm font-medium">
            Click anywhere on the map to select a location
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-28 sm:bottom-24 lg:bottom-6 left-4 bg-[var(--card)]/95 backdrop-blur-sm border border-[var(--border)] rounded-xl shadow-lg p-3 z-30 max-w-[280px]">
        <p className="text-[10px] sm:text-xs font-semibold text-[var(--foreground)] mb-2">
          Safety Legend
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#22c55e] border-2 border-white shadow-sm" />
              <span className="text-[10px] sm:text-xs text-[var(--foreground)]">
                Safe (4-5★)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#eab308] border-2 border-white shadow-sm" />
              <span className="text-[10px] sm:text-xs text-[var(--foreground)]">
                Neutral (3★)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#ef4444] border-2 border-white shadow-sm" />
              <span className="text-[10px] sm:text-xs text-[var(--foreground)]">
                Unsafe (1-2★)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 pt-1 border-t border-[var(--border)]">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#ec4c28] border-2 border-white shadow-sm rounded-sm rotate-45 flex items-center justify-center">
              <span className="text-[6px] sm:text-[8px] -rotate-45">⚠️</span>
            </div>
            <span className="text-[10px] sm:text-xs text-[var(--foreground)]">
              Workplace Report
            </span>
          </div>
        </div>
      </div>

      {/* Nearby Posts Panel */}
      {nearbyPosts.length > 0 && (
        <div className="absolute bottom-24 sm:bottom-6 right-4 bg-[var(--card)]/95 backdrop-blur-sm border border-[var(--border)] rounded-xl shadow-lg p-3 z-10 max-w-[280px] max-h-[40vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-xs text-[var(--foreground)]">
              Nearby ({nearbyPosts.length})
            </h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              onClick={() => setNearbyPosts([])}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1.5">
            {nearbyPosts.slice(0, 5).map((post) => (
              <button
                key={post._id}
                onClick={() => onMarkerClick && onMarkerClick(post._id)}
                className="w-full text-left p-2 hover:bg-[var(--accent)] rounded-lg border border-[var(--border)] transition-colors"
              >
                <div className="flex items-start gap-2">
                  <Badge
                    className={`flex-shrink-0 text-white text-[10px] px-1.5 ${post.rating >= 4
                        ? "bg-[#22c55e]"
                        : post.rating >= 3
                          ? "bg-[#eab308]"
                          : "bg-[#ef4444]"
                      }`}
                  >
                    {post.rating}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs truncate text-[var(--foreground)]">
                      {post.title}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] truncate">
                      {post.location?.name}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
