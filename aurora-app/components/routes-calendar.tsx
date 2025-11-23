"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Route, Download } from "lucide-react";
import { formatDistance, formatDuration } from "@/lib/gps-tracker";
import { useRouter } from "next/navigation";
import { useSwipeableElement } from "@/hooks/useSwipeGesture";

interface RouteData {
  _id: string;
  _creationTime: number;
  title: string;
  distance: number;
  duration: number;
  rating: number;
  routeType: string;
  tags: string[];
  creditsEarned: number;
}

interface RoutesCalendarProps {
  routes: RouteData[];
}

export function RoutesCalendar({ routes }: RoutesCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  // Get the first day of the month
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Get the day of week for the first day (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = firstDayOfMonth.getDay();
  
  // Get total days in month
  const daysInMonth = lastDayOfMonth.getDate();

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Add swipe gesture support for mobile
  useSwipeableElement(calendarRef as React.RefObject<HTMLElement>, {
    onSwipeLeft: nextMonth,
    onSwipeRight: previousMonth,
    threshold: 50,
  });

  // Group routes by date
  const routesByDate = routes.reduce((acc, route) => {
    const date = new Date(route._creationTime);
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(route);
    return acc;
  }, {} as Record<string, RouteData[]>);

  // Check if a date has routes
  const hasRoutes = (day: number) => {
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
    return routesByDate[dateKey] && routesByDate[dateKey].length > 0;
  };

  // Get routes for a specific day
  const getRoutesForDay = (day: number) => {
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
    return routesByDate[dateKey] || [];
  };

  // Calculate monthly stats
  const monthRoutes = routes.filter(route => {
    const date = new Date(route._creationTime);
    return date.getMonth() === currentDate.getMonth() && 
           date.getFullYear() === currentDate.getFullYear();
  });

  const monthlyDistance = monthRoutes.reduce((sum, r) => sum + r.distance, 0);
  const monthlyCredits = monthRoutes.reduce((sum, r) => sum + r.creditsEarned, 0);

  // Selected day state
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Export calendar data as CSV
  const exportCalendarData = () => {
    const csvHeader = "Date,Title,Distance (m),Duration (s),Rating,Type,Tags,Credits Earned\n";
    const csvRows = monthRoutes.map(route => {
      const date = new Date(route._creationTime);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return `${dateStr},"${route.title}",${route.distance},${route.duration},${route.rating},${route.routeType},"${route.tags.join('; ')}",${route.creditsEarned}`;
    }).join("\n");

    const csv = csvHeader + csvRows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aurora-routes-${monthNames[currentDate.getMonth()]}-${currentDate.getFullYear()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card ref={calendarRef}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-bold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Monthly Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Routes</p>
              <p className="text-2xl font-bold text-purple-600">{monthRoutes.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Distance</p>
              <p className="text-2xl font-bold text-purple-600">{formatDistance(monthlyDistance)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Credits</p>
              <p className="text-2xl font-bold text-purple-600">{monthlyCredits}</p>
            </div>
          </div>

          {/* Export Button */}
          {monthRoutes.length > 0 && (
            <div className="mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={exportCalendarData}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Export {monthNames[currentDate.getMonth()]} Data
              </Button>
            </div>
          )}

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dayHasRoutes = hasRoutes(day);
              const isSelected = selectedDay === day;
              const isToday = 
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`
                    aspect-square rounded-lg border-2 transition-all
                    ${isSelected ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-purple-300"}
                    ${isToday ? "bg-blue-50" : ""}
                    ${dayHasRoutes ? "font-bold" : ""}
                  `}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className={`text-sm ${isToday ? "text-blue-600" : ""}`}>{day}</span>
                    {dayHasRoutes && (
                      <div className="flex gap-0.5 mt-1">
                        {getRoutesForDay(day).slice(0, 3).map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Routes */}
      {selectedDay && getRoutesForDay(selectedDay).length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4">
              Routes on {monthNames[currentDate.getMonth()]} {selectedDay}, {currentDate.getFullYear()}
            </h3>
            <div className="space-y-3">
              {getRoutesForDay(selectedDay).map((route) => (
                <div
                  key={route._id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/routes/${route._id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">{route.title}</h4>
                      
                      <div className="flex flex-wrap gap-2 mb-2">
                        {route.tags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">Distance</p>
                          <p className="font-semibold">{formatDistance(route.distance)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Duration</p>
                          <p className="font-semibold">{formatDuration(route.duration)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Rating</p>
                          <p className="font-semibold">{"⭐".repeat(route.rating)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Type</p>
                          <p className="font-semibold capitalize">{route.routeType}</p>
                        </div>
                      </div>
                    </div>

                    {route.creditsEarned > 0 && (
                      <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-sm">
                        <span className="font-semibold">+{route.creditsEarned}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedDay && getRoutesForDay(selectedDay).length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Route className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No routes on this day</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
