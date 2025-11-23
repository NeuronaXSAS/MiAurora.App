"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-10 h-10 text-gray-400" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">You're Offline</h1>
          <p className="text-gray-600 mb-6">
            It looks like you've lost your internet connection. Some features may not be available until you're back online.
          </p>

          <div className="space-y-4">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>

            <div className="text-sm text-gray-500">
              <p className="mb-2">While offline, you can still:</p>
              <ul className="text-left space-y-1 ml-6">
                <li>• View cached routes</li>
                <li>• Track new routes (will sync when online)</li>
                <li>• Browse previously loaded content</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
