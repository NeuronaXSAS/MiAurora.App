"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MapPin, Briefcase, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function LandingPage() {
  // Fetch public activity (no auth required)
  // Convex automatically updates in real-time
  const activities = useQuery(api.feed.getPublicActivity, { limit: 5 });

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="w-3 h-3 mr-1" />
            The Front Page of the Internet for Women
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Aurora App
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-8">
            Share intelligence. Earn credits. Unlock opportunities.
            <br />
            <span className="text-gray-600">
              Navigate life safely and advance your career with community power.
            </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/api/auth/login?provider=GoogleOAuth">
              <Button size="lg" className="w-full sm:w-auto">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </Link>
            
            <Link href="/api/auth/login?provider=MicrosoftOAuth">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#f25022" d="M1 1h10v10H1z" />
                  <path fill="#00a4ef" d="M13 1h10v10H13z" />
                  <path fill="#7fba00" d="M1 13h10v10H1z" />
                  <path fill="#ffb900" d="M13 13h10v10H13z" />
                </svg>
                Continue with Microsoft
              </Button>
            </Link>
          </div>

          {/* Live Activity Feed Preview */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                🔴 Live Activity
              </h3>
              <span className="text-xs text-gray-500">Live updates</span>
            </div>
            
            {!activities && (
              <div className="space-y-3 text-sm text-left">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-400 animate-pulse">
                    <div className="w-2 h-2 bg-gray-300 rounded-full" />
                    <div className="h-4 bg-gray-200 rounded flex-1" />
                  </div>
                ))}
              </div>
            )}

            {activities && activities.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No recent activity. Be the first to contribute!
              </div>
            )}

            {activities && activities.length > 0 && (
              <div className="space-y-3 text-sm text-left">
                {activities.map((activity, index) => (
                  <div
                    key={`${activity.timestamp}-${index}`}
                    className="flex items-start gap-3 text-gray-600 animate-fade-in hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.color === "green"
                            ? "bg-green-100"
                            : activity.color === "blue"
                            ? "bg-blue-100"
                            : "bg-purple-100"
                        }`}
                      >
                        {activity.type === "post" && (
                          <Shield className={`w-4 h-4 ${
                            activity.color === "green" ? "text-green-600" : "text-green-600"
                          }`} />
                        )}
                        {activity.type === "route" && (
                          <MapPin className="w-4 h-4 text-blue-600" />
                        )}
                        {activity.type === "opportunity" && (
                          <Briefcase className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <div
                        className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-pulse ${
                          activity.color === "green"
                            ? "bg-green-500"
                            : activity.color === "blue"
                            ? "bg-blue-500"
                            : "bg-purple-500"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{activity.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Safety Intelligence</h3>
              <p className="text-sm text-gray-600">
                Share and access safety ratings for workplaces, venues, and neighborhoods
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-semibold mb-2">Career Opportunities</h3>
              <p className="text-sm text-gray-600">
                Unlock vetted jobs, mentorship, and resources with earned credits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Interactive Map</h3>
              <p className="text-sm text-gray-600">
                Navigate cities safely with real-time community-verified safety data
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Credit Economy</h3>
              <p className="text-sm text-gray-600">
                Contribute to the community and earn credits to unlock premium opportunities
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Share & Contribute</h3>
              <p className="text-gray-600">
                Rate workplaces, venues, and spaces. Help other women navigate safely.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Earn Credits</h3>
              <p className="text-gray-600">
                Get rewarded with credits for every contribution and verification.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Unlock Opportunities</h3>
              <p className="text-gray-600">
                Use credits to access jobs, mentorship, resources, and exclusive events.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8">
            Join thousands of women building a safer, more equitable world.
          </p>
          <Link href="/api/auth/login?provider=GoogleOAuth">
            <Button size="lg">
              Sign Up Now - Get 25 Free Credits
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>© 2025 Aurora App. Made with ❤️ for women everywhere.</p>
        </div>
      </footer>
    </div>
  );
}
