"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Crosshair, Navigation, Plus, Search, X, MapPin as MapPinIcon, AlertTriangle } from "lucide-react";

// Set access token only if available
if (process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
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
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  ratingFilter?: number; // Filter by minimum rating
}

export function SafetyMap({ lifeDimension, onMarkerClick, onLocationSelect, ratingFilter }: SafetyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const userLocationMarker = useRef<mapboxgl.Marker | null>(null);
  const markersCreated = useRef(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapState, setMapState] = useState<{ center: [number, number]; zoom: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [nearbyPosts, setNearbyPosts] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch posts with location data
  const posts = useQuery(api.posts.getPostsForMap, {
    lifeDimension: lifeDimension as any,
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

  // Initialize map - optimized for faster load
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Check if Mapbox token is available
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      setMapError("Map configuration unavailable");
      return;
    }

    try {
      // Use custom Aurora style
      const MAP_STYLE = "mapbox://styles/malunao/cm84u5ecf000x01qled5j8bvl";
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAP_STYLE,
        center: mapState?.center || [-98.5795, 39.8283], // Use saved state or USA center
        zoom: mapState?.zoom || 4,
        attributionControl: false, // Faster init, add later if needed
        fadeDuration: 0, // Instant tile transitions
        trackResize: true,
        renderWorldCopies: false, // Better performance
      });

      // Handle map errors silently
      map.current.on("error", (e) => {
        if (e.error?.message?.includes("Failed to fetch") || 
            e.error?.message?.includes("NetworkError")) {
          console.debug("Map resource blocked");
        }
      });

      map.current.on("load", () => {
        setMapLoaded(true);
        setMapError(null);
      });
    } catch (error) {
      console.debug("Map initialization failed:", error);
      setMapError("Unable to load map. Try disabling ad-blocker if you have one.");
      return;
    }

    // Debounced map state save - avoid excessive updates
    let moveEndTimeout: NodeJS.Timeout;
    map.current?.on("moveend", () => {
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
    map.current?.on("click", async (e) => {
      if (!isSelectingLocation || !onLocationSelect) return;

      const { lng, lat } = e.lngLat;

      // Reverse geocode to get address
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();
        const address = data.features[0]?.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        // Save current map state before opening dialog
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
        
        // Save current map state before opening dialog
        if (map.current) {
          setMapState({
            center: map.current.getCenter().toArray() as [number, number],
            zoom: map.current.getZoom(),
          });
        }
        
        onLocationSelect({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
        setIsSelectingLocation(false);
      }
    });

    return () => {
      // Cleanup markers
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      
      if (userLocationMarker.current) {
        userLocationMarker.current.remove();
      }
      
      // Cleanup map
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isSelectingLocation, onLocationSelect]);

  // Incident labels - defined outside to avoid recreation
  const incidentLabels: Record<string, string> = useMemo(() => ({
    harassment: "Sexual Harassment",
    discrimination: "Discrimination",
    pay_inequality: "Pay Inequality",
    hostile_environment: "Hostile Environment",
    retaliation: "Retaliation",
    other: "Workplace Issue",
  }), []);

  // Create marker element - optimized helper
  const createPostMarker = useCallback((post: any, onClick?: () => void) => {
    const color = post.rating >= 4 ? "#22c55e" : post.rating >= 3 ? "#eab308" : "#ef4444";
    
    const el = document.createElement("div");
    el.className = "custom-marker";
    el.style.cssText = `
      width: 28px; height: 28px; border-radius: 50%;
      background-color: ${color}; border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.25);
      cursor: pointer; display: flex; align-items: center;
      justify-content: center; font-size: 13px; font-weight: bold; color: white;
    `;
    el.textContent = post.rating.toString();
    
    if (onClick) el.addEventListener("click", onClick);
    return el;
  }, []);

  const createWorkplaceMarker = useCallback(() => {
    const el = document.createElement("div");
    el.className = "workplace-marker";
    el.style.cssText = `
      width: 28px; height: 28px; background-color: #ec4c28;
      border: 2px solid white; box-shadow: 0 2px 4px rgba(236, 76, 40, 0.4);
      cursor: pointer; display: flex; align-items: center;
      justify-content: center; font-size: 14px; border-radius: 4px; transform: rotate(45deg);
    `;
    el.innerHTML = '<span style="transform: rotate(-45deg);">⚠️</span>';
    return el;
  }, []);

  // Update markers when posts or workplace reports change - batched for performance
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Batch marker creation using requestAnimationFrame for smoother rendering
    const createMarkers = () => {
      if (!map.current) return;

      // Add post markers
      filteredPosts.forEach((post) => {
        if (!post.location || !map.current) return;

        const el = createPostMarker(post, onMarkerClick ? () => onMarkerClick(post._id) : undefined);

        // Lazy popup - only create on hover/click
        const marker = new mapboxgl.Marker(el)
          .setLngLat(post.location.coordinates as [number, number])
          .addTo(map.current!);

        // Add popup on first interaction for better performance
        // Store location name for popup (already checked above)
        const locationName = post.location!.name;
        let popupAdded = false;
        el.addEventListener("mouseenter", () => {
          if (!popupAdded) {
            popupAdded = true;
            marker.setPopup(new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
              <div style="padding: 6px; min-width: 180px;">
                <h3 style="font-weight: bold; margin-bottom: 2px; font-size: 13px;">${post.title}</h3>
                <p style="font-size: 11px; color: #666; margin-bottom: 4px;">${locationName}</p>
                <div style="font-size: 11px; color: #666;">
                  Rating: ${post.rating}/5 • ${post.verificationCount} verifications
                </div>
              </div>
            `));
          }
        });

        markers.current.push(marker);
      });

      // Add workplace report markers
      workplaceReports?.forEach((report) => {
        if (!report.location || !map.current) return;

        const el = createWorkplaceMarker();

        const marker = new mapboxgl.Marker(el)
          .setLngLat(report.location.coordinates as [number, number])
          .addTo(map.current!);

        // Lazy popup
        let popupAdded = false;
        el.addEventListener("mouseenter", () => {
          if (!popupAdded) {
            popupAdded = true;
            marker.setPopup(new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
              <div style="padding: 6px; min-width: 180px;">
                <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                  <span>⚠️</span>
                  <span style="font-weight: bold; color: #ec4c28; font-size: 12px;">Workplace Report</span>
                </div>
                <h3 style="font-weight: bold; margin-bottom: 2px; font-size: 13px;">${report.companyName}</h3>
                <p style="font-size: 11px; color: #666;">${incidentLabels[report.incidentType] || report.incidentType}</p>
              </div>
            `));
          }
        });

        markers.current.push(marker);
      });

      // Fit bounds only on initial load
      if (!markersCreated.current && !mapState) {
        const allLocations: [number, number][] = [
          ...filteredPosts.filter(p => p.location).map(p => p.location!.coordinates as [number, number]),
          ...(workplaceReports?.filter(r => r.location).map(r => r.location!.coordinates as [number, number]) || [])
        ];

        if (allLocations.length > 0 && map.current) {
          const bounds = new mapboxgl.LngLatBounds();
          allLocations.forEach((coords) => bounds.extend(coords));
          map.current.fitBounds(bounds, { padding: 50, maxZoom: 12, duration: 0 });
        }
        markersCreated.current = true;
      }
    };

    // Use requestAnimationFrame for smoother marker rendering
    requestAnimationFrame(createMarkers);
  }, [filteredPosts, workplaceReports, mapLoaded, onMarkerClick, mapState, createPostMarker, createWorkplaceMarker, incidentLabels]);

  // Restore user location marker when map loads
  useEffect(() => {
    if (!map.current || !mapLoaded || !userLocation) return;

    // Add or update user location marker
    if (userLocationMarker.current) {
      userLocationMarker.current.setLngLat([userLocation.lng, userLocation.lat]);
    } else {
      const el = document.createElement("div");
      el.className = "user-location-marker";
      el.style.width = "20px";
      el.style.height = "20px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#3b82f6";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 0 10px rgba(59, 130, 246, 0.5)";

      userLocationMarker.current = new mapboxgl.Marker(el)
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            '<div style="padding: 8px;"><strong>Your Location</strong></div>'
          )
        )
        .addTo(map.current);
    }
  }, [userLocation, mapLoaded]);

  // Search for location - memoized
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxgl.accessToken}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Navigate to search result - memoized
  const handleSelectSearchResult = useCallback((result: any) => {
    if (!map.current) return;

    const [lng, lat] = result.center;
    map.current.flyTo({
      center: [lng, lat],
      zoom: 14,
      duration: 1500, // Slightly faster for better UX
      essential: true,
    });

    setSearchQuery("");
    setSearchResults([]);

    // Show nearby posts
    if (posts) {
      const nearby = posts.filter((post) => {
        if (!post.location) return false;
        const [postLng, postLat] = post.location.coordinates;
        const distance = Math.sqrt(
          Math.pow(postLng - lng, 2) + Math.pow(postLat - lat, 2)
        );
        return distance < 0.1; // Roughly 10km
      });
      setNearbyPosts(nearby);
    }
  }, [posts]);

  // Get user's GPS location - memoized and optimized
  const handleGetUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    // Request GPS position - use cached if recent for faster response
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        setUserLocation({ lat: latitude, lng: longitude });

        if (map.current) {
          // Remove existing user marker if any
          if (userLocationMarker.current) {
            userLocationMarker.current.remove();
            userLocationMarker.current = null;
          }

          // Create user location marker - simplified for performance
          const el = document.createElement("div");
          el.className = "user-location-marker";
          el.style.cssText = `
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border: 4px solid white;
            box-shadow: 0 0 12px rgba(59, 130, 246, 0.5), 0 2px 6px rgba(0,0,0,0.2);
          `;

          userLocationMarker.current = new mapboxgl.Marker(el)
            .setLngLat([longitude, latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(
                `<div style="padding: 6px;"><strong>📍 Your Location</strong></div>`
              )
            )
            .addTo(map.current);

          // Fly to user location - faster animation
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            duration: 1200,
            essential: true,
          });

          // Show nearby posts
          if (posts) {
            const nearby = posts.filter((post) => {
              if (!post.location) return false;
              const [postLng, postLat] = post.location.coordinates;
              const distance = Math.sqrt(
                Math.pow(postLng - longitude, 2) + Math.pow(postLat - latitude, 2)
              );
              return distance < 0.1;
            });
            setNearbyPosts(nearby);
          }
        }
      },
      (error) => {
        let errorMessage = "Unable to get your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: false, // Faster initial response
        timeout: 10000,
        maximumAge: 60000 // Allow 1 minute cached position for speed
      }
    );
  }, [posts]);

  // Show error state if map failed to load
  if (mapError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--background)]">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-[var(--color-aurora-yellow)]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-[var(--color-aurora-yellow)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Map Unavailable</h3>
          <p className="text-[var(--muted-foreground)] text-sm mb-4">{mapError}</p>
          <p className="text-[var(--muted-foreground)] text-xs">
            If you have an ad-blocker enabled, try disabling it for this site to view the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <div 
        ref={mapContainer} 
        className={`w-full h-full ${isSelectingLocation ? 'cursor-crosshair' : ''}`}
      />

      {/* Search Bar - Clean positioning for mobile */}
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
          >
            <Search className="w-4 h-4" />
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
                  <p className="font-medium text-sm truncate text-[var(--foreground)]">{result.text}</p>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">{result.place_name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Control Buttons - Right side, clean positioning */}
      <div className="absolute top-20 right-4 flex flex-col gap-2 z-10">
        {/* GPS Location Button */}
        <Button
          onClick={handleGetUserLocation}
          className="bg-[var(--card)]/95 backdrop-blur-sm text-[var(--foreground)] hover:bg-[var(--accent)] shadow-lg border border-[var(--border)] min-w-[48px] min-h-[48px] rounded-xl"
          size="icon"
          title="Go to my location"
        >
          <Navigation className="w-5 h-5 text-[var(--color-aurora-purple)]" />
        </Button>

        {/* Select Location Button */}
        {onLocationSelect && (
          <Button
            onClick={() => setIsSelectingLocation(!isSelectingLocation)}
            className={`shadow-lg min-w-[48px] min-h-[48px] rounded-xl ${
              isSelectingLocation
                ? "bg-[var(--color-aurora-purple)] text-white hover:bg-[var(--color-aurora-violet)]"
                : "bg-[var(--card)]/95 backdrop-blur-sm text-[var(--foreground)] hover:bg-[var(--accent)] border border-[var(--border)]"
            }`}
            size="icon"
            title="Click map to mark location"
          >
            {isSelectingLocation ? <Crosshair className="w-5 h-5" /> : <Plus className="w-5 h-5 text-[var(--color-aurora-purple)]" />}
          </Button>
        )}
      </div>

      {/* Selection Mode Indicator */}
      {isSelectingLocation && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-[var(--color-aurora-purple)] text-white px-4 py-2 rounded-xl shadow-lg z-10">
          <p className="text-sm font-medium">Click anywhere on the map to select a location</p>
        </div>
      )}

      {/* Legend - Always visible, positioned above bottom controls on mobile, left side on desktop */}
      <div className="absolute bottom-28 sm:bottom-24 lg:bottom-6 left-4 bg-[var(--card)]/95 backdrop-blur-sm border border-[var(--border)] rounded-xl shadow-lg p-3 z-30 max-w-[280px]">
        <p className="text-[10px] sm:text-xs font-semibold text-[var(--foreground)] mb-2">Safety Legend</p>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#22c55e] border-2 border-white shadow-sm" />
              <span className="text-[10px] sm:text-xs text-[var(--foreground)]">Safe (4-5★)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#eab308] border-2 border-white shadow-sm" />
              <span className="text-[10px] sm:text-xs text-[var(--foreground)]">Neutral (3★)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#ef4444] border-2 border-white shadow-sm" />
              <span className="text-[10px] sm:text-xs text-[var(--foreground)]">Unsafe (1-2★)</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 pt-1 border-t border-[var(--border)]">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#ec4c28] border-2 border-white shadow-sm rounded-sm rotate-45 flex items-center justify-center">
              <span className="text-[6px] sm:text-[8px] -rotate-45">⚠️</span>
            </div>
            <span className="text-[10px] sm:text-xs text-[var(--foreground)]">Workplace Report</span>
          </div>
        </div>
      </div>

      {/* Nearby Posts Panel */}
      {nearbyPosts.length > 0 && (
        <div className="absolute bottom-24 sm:bottom-6 right-4 bg-[var(--card)]/95 backdrop-blur-sm border border-[var(--border)] rounded-xl shadow-lg p-3 z-10 max-w-[280px] max-h-[40vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-xs text-[var(--foreground)]">Nearby ({nearbyPosts.length})</h4>
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
                    className={`flex-shrink-0 text-white text-[10px] px-1.5 ${
                      post.rating >= 4
                        ? "bg-[#22c55e]"
                        : post.rating >= 3
                        ? "bg-[#eab308]"
                        : "bg-[#ef4444]"
                    }`}
                  >
                    {post.rating}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs truncate text-[var(--foreground)]">{post.title}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)] truncate">{post.location?.name}</p>
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
