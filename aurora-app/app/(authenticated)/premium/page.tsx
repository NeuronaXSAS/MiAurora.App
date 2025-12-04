"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Crown, 
  Sparkles, 
  Shield, 
  Zap, 
  MessageSquare, 
  Video, 
  Calendar,
  Coins,
  ArrowRight,
  Loader2,
  Star,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SUBSCRIPTION_TIERS, CREDIT_PACKAGES } from "@/convex/premiumConfig";
import { SAFETY_PROMISE, getSafetyFeaturesList } from "@/lib/safety-access";
import type { Id } from "@/convex/_generated/dataModel";

// Regional pricing type
interface RegionalPricing {
  country: string;
  multiplier: number;
  subscriptions: {
    plus: { monthly: number; annual: number };
    pro: { monthly: number; annual: number };
    elite: { monthly: number; annual: number };
  };
  credits: {
    small: { credits: number; price: number };
    medium: { credits: number; price: number };
    large: { credits: number; price: number };
    xl: { credits: number; price: number };
  };
  paymentMethods: string[];
}

export default function PremiumPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userCountry, setUserCountry] = useState<string>("US");
  const [regionalPricing, setRegionalPricing] = useState<RegionalPricing | null>(null);

  // Detect user country and fetch regional pricing
  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Try to get country from timezone or use default
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const countryMap: Record<string, string> = {
          'America/New_York': 'US', 'America/Los_Angeles': 'US', 'America/Chicago': 'US',
          'Europe/London': 'GB', 'Europe/Paris': 'EU', 'Europe/Berlin': 'DE',
          'Asia/Kolkata': 'IN', 'Asia/Mumbai': 'IN',
          'America/Sao_Paulo': 'BR', 'America/Mexico_City': 'MX',
          'Australia/Sydney': 'AU', 'Asia/Tokyo': 'JP',
          'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE', 'Africa/Johannesburg': 'ZA',
        };
        const detected = countryMap[timezone] || 'US';
        setUserCountry(detected);
        
        // Fetch regional pricing
        const response = await fetch(`/api/stripe/checkout?country=${detected}`);
        if (response.ok) {
          const pricing = await response.json();
          setRegionalPricing(pricing);
        }
      } catch {
        // Fallback to US pricing
        setUserCountry('US');
      }
    };
    
    detectCountry();
  }, []);

  useEffect(() => {
    const storedUserId = localStorage.getItem("aurora_user_id");
    if (storedUserId) {
      setUserId(storedUserId as Id<"users">);
    }
  }, []);

  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");
  const userLoading = userId === null;

  const subscription = useQuery(
    api.subscriptions.getUserSubscription,
    userId ? { userId } : "skip"
  );

  // Memoized tier data with regional pricing
  const tiersWithPricing = useMemo(() => {
    return SUBSCRIPTION_TIERS.filter(t => t.tierId !== "free").map(tier => {
      const regionalTier = regionalPricing?.subscriptions[tier.tierId as keyof typeof regionalPricing.subscriptions];
      return {
        ...tier,
        displayPrice: {
          monthly: regionalTier?.monthly ?? tier.monthlyPrice,
          annual: regionalTier?.annual ?? tier.annualPrice,
        },
      };
    });
  }, [regionalPricing]);

  // Memoized credit packages with regional pricing
  const creditsWithPricing = useMemo(() => {
    return CREDIT_PACKAGES.map(pkg => {
      const regionalPkg = regionalPricing?.credits[pkg.packageId as keyof typeof regionalPricing.credits];
      return {
        ...pkg,
        displayPrice: regionalPkg?.price ?? pkg.priceUSD,
      };
    });
  }, [regionalPricing]);

  const handleSubscribe = useCallback(async (tierId: string) => {
    if (!userId || !user) return;
    setIsProcessing(true);
    setSelectedTier(tierId);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: user.email,
          type: 'subscription',
          tier: tierId,
          billingCycle,
          country: userCountry,
        }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        console.error("Checkout error:", data.message || data.error);
        alert(data.message || "Unable to process subscription. Please try again.");
      }
    } catch (error) {
      console.error("Subscription failed:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
      setSelectedTier(null);
    }
  }, [userId, user, billingCycle, userCountry]);

  const handlePurchaseCredits = useCallback(async (packageId: string) => {
    if (!userId || !user) return;
    setIsProcessing(true);
    setSelectedPackage(packageId);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: user.email,
          type: 'credits',
          packageId,
          country: userCountry,
        }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        console.error("Checkout error:", data.message || data.error);
        alert(data.message || "Unable to process purchase. Please try again.");
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
      setSelectedPackage(null);
    }
  }, [userId, user, userCountry]);

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-aurora-purple)]" />
      </div>
    );
  }

  const currentTier = subscription?.tier || "free";

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[var(--color-aurora-violet)] to-[var(--color-aurora-purple)] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="bg-white/20 text-white mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Aurora Premium
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Unlock Your Full Potential
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Get more from Aurora App with premium features designed to help you thrive.
            Safety features are always free.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Current Plan Banner */}
        {currentTier !== "free" && (
          <Card className="mb-8 border-[var(--color-aurora-purple)] bg-[var(--color-aurora-purple)]/5">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-[var(--color-aurora-purple)]" />
                <div>
                  <p className="font-semibold text-[var(--foreground)]">
                    You&apos;re on {SUBSCRIPTION_TIERS.find(t => t.tierId === currentTier)?.name}
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {subscription?.billingCycle === "annual" ? "Annual" : "Monthly"} billing
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Manage Subscription
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-[var(--muted)] p-1 rounded-xl inline-flex">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-medium transition-all",
                billingCycle === "monthly"
                  ? "bg-white dark:bg-[var(--card)] shadow-sm text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)]"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                billingCycle === "annual"
                  ? "bg-white dark:bg-[var(--card)] shadow-sm text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)]"
              )}
            >
              Annual
              <Badge className="bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] text-xs">
                Save 20%
              </Badge>
            </button>
          </div>
        </div>

        {/* Regional Pricing Indicator */}
        {regionalPricing && regionalPricing.multiplier < 1 && (
          <div className="flex items-center justify-center gap-2 mb-6 p-3 rounded-xl bg-[var(--color-aurora-mint)]/20">
            <Globe className="w-4 h-4 text-[var(--color-aurora-violet)]" />
            <span className="text-sm text-[var(--foreground)]">
              Regional pricing applied for your location
            </span>
            <Badge className="bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] text-xs">
              Save {Math.round((1 - regionalPricing.multiplier) * 100)}%
            </Badge>
          </div>
        )}

        {/* Subscription Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {tiersWithPricing.map((tier) => {
            const isCurrentTier = currentTier === tier.tierId;
            const price = billingCycle === "annual" ? tier.displayPrice.annual : tier.displayPrice.monthly;
            const monthlyEquivalent = billingCycle === "annual" ? tier.displayPrice.annual / 12 : tier.displayPrice.monthly;
            const isPopular = tier.tierId === "pro";

            return (
              <Card 
                key={tier.tierId}
                className={cn(
                  "relative overflow-hidden transition-all",
                  isPopular && "border-[var(--color-aurora-purple)] shadow-lg scale-105",
                  isCurrentTier && "ring-2 ring-[var(--color-aurora-mint)]"
                )}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-[var(--color-aurora-purple)] text-white text-xs px-3 py-1 rounded-bl-lg">
                    Most Popular
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {tier.tierId === "plus" && <Zap className="w-5 h-5 text-[var(--color-aurora-blue)]" />}
                    {tier.tierId === "pro" && <Star className="w-5 h-5 text-[var(--color-aurora-purple)]" />}
                    {tier.tierId === "elite" && <Crown className="w-5 h-5 text-[var(--color-aurora-yellow)]" />}
                    {tier.name}
                  </CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-[var(--foreground)]">
                      ${monthlyEquivalent.toFixed(0)}
                    </span>
                    <span className="text-[var(--muted-foreground)]">/month</span>
                    {billingCycle === "annual" && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        Billed ${price.toFixed(0)} annually
                      </p>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {tier.benefits.adFree && (
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-[var(--color-aurora-mint)]" />
                        Ad-free experience
                      </li>
                    )}
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-[var(--color-aurora-mint)]" />
                      {tier.benefits.aiMessagesPerDay === -1 
                        ? "Unlimited AI messages" 
                        : `${tier.benefits.aiMessagesPerDay} AI messages/day`}
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-[var(--color-aurora-mint)]" />
                      {tier.benefits.monthlyCredits} credits/month
                    </li>
                    {tier.benefits.prioritySupport && (
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-[var(--color-aurora-mint)]" />
                        Priority support
                      </li>
                    )}
                    {tier.benefits.advancedAnalytics && (
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-[var(--color-aurora-mint)]" />
                        Advanced analytics
                      </li>
                    )}
                    {tier.benefits.exclusiveEvents && (
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-[var(--color-aurora-mint)]" />
                        Exclusive events access
                      </li>
                    )}
                    {tier.benefits.safetyConsultations && (
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-[var(--color-aurora-mint)]" />
                        Safety consultations
                      </li>
                    )}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(tier.tierId)}
                    disabled={isCurrentTier || isProcessing}
                    className={cn(
                      "w-full",
                      isPopular 
                        ? "bg-[var(--color-aurora-purple)] hover:bg-[var(--color-aurora-purple)]/90"
                        : ""
                    )}
                  >
                    {isProcessing && selectedTier === tier.tierId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrentTier ? (
                      "Current Plan"
                    ) : (
                      <>
                        Get {tier.name}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Credit Packages Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2 text-center">
            Buy Credits
          </h2>
          <p className="text-[var(--muted-foreground)] text-center mb-6">
            Use credits for gifts, events, and premium content
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {creditsWithPricing.map((pkg) => (
              <Card key={pkg.packageId} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--color-aurora-yellow)]/20 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-[var(--color-aurora-yellow)]" />
                  </div>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {pkg.credits}
                  </p>
                  {pkg.bonus && (
                    <Badge className="bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)] text-xs mb-2">
                      +{pkg.bonus} bonus
                    </Badge>
                  )}
                  <p className="text-lg font-semibold text-[var(--color-aurora-purple)]">
                    ${pkg.displayPrice.toFixed(2)}
                  </p>
                  <Button
                    onClick={() => handlePurchaseCredits(pkg.packageId)}
                    disabled={isProcessing || selectedPackage === pkg.packageId}
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 min-h-[44px]"
                  >
                    {isProcessing && selectedPackage === pkg.packageId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Buy"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Comparison */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6 text-center">
            What You Get
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-aurora-blue)]/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-[var(--color-aurora-blue)]" />
              </div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">
                Unlimited AI Assistant
              </h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Get unlimited access to Aurora AI for safety advice, career guidance, and emotional support.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-aurora-purple)]/10 flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-[var(--color-aurora-purple)]" />
              </div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">
                Premium Content
              </h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Access exclusive livestreams, events, and content from top creators in the community.
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-aurora-pink)]/10 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-[var(--color-aurora-pink)]" />
              </div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">
                Exclusive Events
              </h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Join members-only events, workshops, and networking sessions with industry leaders.
              </p>
            </Card>
          </div>
        </div>

        {/* Safety Promise */}
        <Card className="bg-[var(--color-aurora-mint)]/10 border-[var(--color-aurora-mint)]">
          <CardContent className="p-6 text-center">
            <Shield className="w-10 h-10 mx-auto mb-4 text-[var(--color-aurora-violet)]" />
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Safety Features Are Always Free
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] max-w-xl mx-auto">
              Panic button, emergency contacts, safety check-ins, and basic routes will always be free. 
              Your safety is our priority, not a premium feature.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
