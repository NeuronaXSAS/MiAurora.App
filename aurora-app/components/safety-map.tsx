"use client";

import { useEffect, useRef, useState } from "react";
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
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapState, setMapState] = useState<{ center: [number, number]; zoom: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [nearbyPosts, setNearbyPosts] = useState<any[]>([]);

  // Fetch posts with location data
  const posts = useQuery(api.posts.getPostsForMap, {
    lifeDimension: lifeDimension as any,
  });

  // Filter posts by rating - MUST be defined before useEffect that uses it
  const filteredPosts = posts?.filter((post) => {
    if (ratingFilter && post.rating < ratingFilter) {
      return false;
    }
    return true;
  }) || [];

  // Initialize map
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
        center: [-98.5795, 39.8283], // Center of USA
        zoom: 4,
      });

      // Handle map errors (e.g., blocked by ad-blocker)
      map.current.on("error", (e) => {
        // Silently handle tile loading errors (common with ad-blockers)
        if (e.error?.message?.includes("Failed to fetch") || 
            e.error?.message?.includes("NetworkError")) {
          // Don't spam console, just note it happened
          console.debug("Map resource blocked, likely by ad-blocker");
        }
      });

      // Note: We use custom controls instead of Mapbox defaults to avoid overlap
      // and provide a cleaner mobile experience

      map.current.on("load", () => {
        setMapLoaded(true);
        setMapError(null);
        
        // Restore map state if it exists
        if (mapState && map.current) {
          map.current.setCenter(mapState.center);
          map.current.setZoom(mapState.zoom);
        }
      });
    } catch (error) {
      // Map initialization failed (possibly blocked by ad-blocker)
      console.debug("Map initialization failed:", error);
      setMapError("Unable to load map. Try disabling ad-blocker if you have one.");
      return;
    }

    // Save map state on move
    map.current?.on("moveend", () => {
      if (map.current) {
        setMapState({
          center: map.current.getCenter().toArray() as [number, number],
          zoom: map.current.getZoom(),
        });
      }
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

  // Update markers when posts change
  useEffect(() => {
    if (!map.current || !mapLoaded || !filteredPosts) return;

    // Remove existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Add new markers
    filteredPosts.forEach((post) => {
      if (!post.location || !map.current) return;

      // Determine marker color based on rating
      const color =
        post.rating >= 4
          ? "#22c55e" // Green for safe (4-5)
          : post.rating >= 3
          ? "#eab308" // Yellow for neutral (3)
          : "#ef4444"; // Red for unsafe (1-2)

      // Create marker element
      const el = document.createElement("div");
      el.className = "custom-marker";
      el.style.width = "30px";
      el.style.height = "30px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = color;
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
      el.style.cursor = "pointer";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.fontSize = "14px";
      el.style.fontWeight = "bold";
      el.style.color = "white";
      el.textContent = post.rating.toString();

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 4px;">${post.title}</h3>
          <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${post.location.name}</p>
          <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
            <span style="font-size: 12px;">Rating: ${post.rating}/5</span>
          </div>
          <div style="font-size: 12px; color: #666;">
            ${post.verificationCount} verification${post.verificationCount !== 1 ? "s" : ""}
            ${post.isVerified ? ' • <span style="color: #22c55e;">✓ Verified</span>' : ""}
          </div>
        </div>
      `);

      // Create and add marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat(post.location.coordinates as [number, number])
        .setPopup(popup)
        .addTo(map.current);

      // Add click handler
      el.addEventListener("click", () => {
        if (onMarkerClick) {
          onMarkerClick(post._id);
        }
      });

      markers.current.push(marker);
    });

    // Only fit map to markers on initial load (when no map state exists)
    if (filteredPosts.length > 0 && map.current && !mapState) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredPosts.forEach((post) => {
        if (post.location) {
          bounds.extend(post.location.coordinates as [number, number]);
        }
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 12 });
    }
  }, [filteredPosts, mapLoaded, onMarkerClick, mapState]);

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

  // Search for location
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxgl.accessToken}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  // Navigate to search result
  const handleSelectSearchResult = (result: any) => {
    if (!map.current) return;

    const [lng, lat] = result.center;
    map.current.flyTo({
      center: [lng, lat],
      zoom: 14,
      duration: 2000,
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
  };

  // Get user's GPS location with high accuracy
  const handleGetUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    // Request high accuracy GPS position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`GPS Location: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
        
        setUserLocation({ lat: latitude, lng: longitude });

        if (map.current) {
          // Remove existing user marker if any
          if (userLocationMarker.current) {
            userLocationMarker.current.remove();
            userLocationMarker.current = null;
          }

          // Create a more visible user location marker with accuracy circle
          const el = document.createElement("div");
          el.className = "user-location-marker";
          el.innerHTML = `
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: linear-gradient(135deg, #3b82f6, #8b5cf6);
              border: 4px solid white;
              box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), 0 2px 8px rgba(0,0,0,0.3);
              animation: pulse 2s infinite;
            "></div>
          `;

          // Add CSS animation for pulsing effect
          const style = document.createElement('style');
          style.textContent = `
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
              70% { box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); }
              100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
            }
          `;
          document.head.appendChild(style);

          userLocationMarker.current = new mapboxgl.Marker(el)
            .setLngLat([longitude, latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<div style="padding: 8px;">
                  <strong>📍 Your Location</strong>
                  <p style="font-size: 11px; color: #666; margin-top: 4px;">
                    Accuracy: ~${Math.round(accuracy)}m
                  </p>
                </div>`
              )
            )
            .addTo(map.current);

          // Fly to user location with higher zoom for better precision view
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 16, // Higher zoom for better precision
            duration: 2000,
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
              return distance < 0.1; // Roughly 10km
            });
            setNearbyPosts(nearby);
          }
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMessage = "Unable to get your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true, // Request high accuracy GPS
        timeout: 15000, // Wait up to 15 seconds
        maximumAge: 0 // Don't use cached position
      }
    );
  };

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

      {/* Legend - Always visible, responsive positioning */}
      <div className="absolute bottom-24 sm:bottom-6 md:bottom-6 lg:bottom-6 left-4 bg-[var(--card)] backdrop-blur-sm border border-[var(--border)] rounded-xl shadow-lg p-3 z-20">
        <p className="text-[10px] sm:text-xs font-semibold text-[var(--foreground)] mb-2">Safety Legend</p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-[#22c55e] border-2 border-white shadow-sm" />
            <span className="text-xs text-[var(--foreground)]">Safe (4-5★)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-[#eab308] border-2 border-white shadow-sm" />
            <span className="text-xs text-[var(--foreground)]">Neutral (3★)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-[#ef4444] border-2 border-white shadow-sm" />
            <span className="text-xs text-[var(--foreground)]">Unsafe (1-2★)</span>
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
