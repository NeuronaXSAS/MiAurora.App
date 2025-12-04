"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Crown,
  Coins,
  Users,
  TrendingUp,
  Plus,
  Edit,
  Loader2,
  Check,
  Star,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";
import { REVENUE_SHARES } from "@/convex/premiumConfig";

interface CirclePremiumManagerProps {
  circleId: Id<"circles">;
  userId: Id<"users">;
  isAdmin: boolean;
}

interface TierFormData {
  name: string;
  price: string;
  benefits: string[];
}

const DEFAULT_TIERS: TierFormData[] = [
  { name: "Supporter", price: "50", benefits: ["Access to supporter chat", "Exclusive posts", "Badge"] },
  { name: "VIP", price: "150", benefits: ["All Supporter benefits", "Video rooms access", "Direct messaging", "VIP badge"] },
];

export function CirclePremiumManager({ circleId, userId, isAdmin }: CirclePremiumManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [tierForm, setTierForm] = useState<TierFormData>({ name: "", price: "", benefits: [] });
  const [newBenefit, setNewBenefit] = useState("");

  // In a real implementation, these would be actual queries
  // For now, we'll use placeholder data structure
  const circleTiers = useQuery(api.rooms.getCircleRooms, { circleId }); // Placeholder
  
  const memberCount = 127; // Placeholder
  const paidMemberCount = 45; // Placeholder
  const monthlyRevenue = 4500; // Placeholder credits
  const platformFee = memberCount >= 100 
    ? REVENUE_SHARES.CIRCLE_HOST_SHARE_100 
    : REVENUE_SHARES.CIRCLE_HOST_SHARE_DEFAULT;
  const hostEarnings = Math.floor(monthlyRevenue * platformFee);

  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      setTierForm(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()]
      }));
      setNewBenefit("");
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setTierForm(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const handleCreateTier = async () => {
    if (!tierForm.name || !tierForm.price) return;
    
    setIsCreating(true);
    try {
      // In production, this would call a mutation
      console.log("Creating tier:", tierForm);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTierForm({ name: "", price: "", benefits: [] });
      setIsCreateOpen(false);
    } catch (error) {
      console.error("Failed to create tier:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const applyTemplate = (template: TierFormData) => {
    setTierForm(template);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Revenue Dashboard */}
      <Card className="bg-gradient-to-br from-[var(--color-aurora-purple)]/10 to-[var(--color-aurora-pink)]/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--color-aurora-purple)]" />
            Revenue Dashboard
          </CardTitle>
          <CardDescription>
            Your Circle&apos;s premium performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-xl bg-[var(--background)]">
              <Users className="w-5 h-5 mx-auto mb-1 text-[var(--color-aurora-blue)]" />
              <p className="text-2xl font-bold text-[var(--foreground)]">{memberCount}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Total Members</p>
            </div>
            
            <div className="text-center p-3 rounded-xl bg-[var(--background)]">
              <Crown className="w-5 h-5 mx-auto mb-1 text-[var(--color-aurora-yellow)]" />
              <p className="text-2xl font-bold text-[var(--foreground)]">{paidMemberCount}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Paid Members</p>
            </div>
            
            <div className="text-center p-3 rounded-xl bg-[var(--background)]">
              <Coins className="w-5 h-5 mx-auto mb-1 text-[var(--color-aurora-yellow)]" />
              <p className="text-2xl font-bold text-[var(--foreground)]">{monthlyRevenue}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Monthly Credits</p>
            </div>
            
            <div className="text-center p-3 rounded-xl bg-[var(--background)]">
              <Sparkles className="w-5 h-5 mx-auto mb-1 text-[var(--color-aurora-mint)]" />
              <p className="text-2xl font-bold text-[var(--foreground)]">{hostEarnings}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Your Earnings</p>
            </div>
          </div>

          {/* Fee Info */}
          <div className="mt-4 p-3 rounded-xl bg-[var(--color-aurora-mint)]/10 border border-[var(--color-aurora-mint)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  Platform Fee: {Math.round((1 - platformFee) * 100)}%
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {memberCount >= 100 
                    ? "Reduced fee for 100+ members!" 
                    : `${100 - memberCount} more members for reduced fee`}
                </p>
              </div>
              {memberCount >= 100 && (
                <Badge className="bg-[var(--color-aurora-mint)] text-[var(--color-aurora-violet)]">
                  <Check className="w-3 h-3 mr-1" />
                  Reduced
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                Membership Tiers
              </CardTitle>
              <CardDescription>
                Create tiers to monetize your Circle
              </CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-[var(--color-aurora-blue)]">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Tier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Membership Tier</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {/* Quick Templates */}
                  <div>
                    <Label className="text-xs text-[var(--muted-foreground)]">Quick Templates</Label>
                    <div className="flex gap-2 mt-1">
                      {DEFAULT_TIERS.map((template) => (
                        <Button
                          key={template.name}
                          variant="outline"
                          size="sm"
                          onClick={() => applyTemplate(template)}
                        >
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tierName">Tier Name</Label>
                    <Input
                      id="tierName"
                      value={tierForm.name}
                      onChange={(e) => setTierForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Supporter"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tierPrice">Monthly Price (Credits)</Label>
                    <Input
                      id="tierPrice"
                      type="number"
                      value={tierForm.price}
                      onChange={(e) => setTierForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="50"
                      className="mt-1"
                    />
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      You receive {Math.round(platformFee * 100)}% ({Math.floor(parseInt(tierForm.price || "0") * platformFee)} credits)
                    </p>
                  </div>

                  <div>
                    <Label>Benefits</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={newBenefit}
                        onChange={(e) => setNewBenefit(e.target.value)}
                        placeholder="Add a benefit"
                        onKeyDown={(e) => e.key === "Enter" && handleAddBenefit()}
                      />
                      <Button type="button" variant="outline" onClick={handleAddBenefit}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {tierForm.benefits.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {tierForm.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center justify-between text-sm p-2 rounded-lg bg-[var(--muted)]">
                            <span className="flex items-center gap-2">
                              <Check className="w-3 h-3 text-[var(--color-aurora-mint)]" />
                              {benefit}
                            </span>
                            <button
                              onClick={() => handleRemoveBenefit(index)}
                              className="text-[var(--muted-foreground)] hover:text-[var(--color-aurora-salmon)]"
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <Button
                    onClick={handleCreateTier}
                    disabled={isCreating || !tierForm.name || !tierForm.price}
                    className="w-full bg-[var(--color-aurora-blue)]"
                  >
                    {isCreating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Create Tier"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Existing Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Free Tier (always exists) */}
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[var(--muted-foreground)]" />
                    <span className="font-semibold">Free</span>
                  </div>
                  <Badge variant="outline">Default</Badge>
                </div>
                <ul className="space-y-1 text-sm text-[var(--muted-foreground)]">
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3" />
                    Access to public rooms
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3" />
                    View public posts
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3" />
                    Join free events
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Supporter Tier Example */}
            <Card className="border-[var(--color-aurora-purple)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-[var(--color-aurora-purple)]" />
                    <span className="font-semibold">Supporter</span>
                  </div>
                  <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-violet)]">
                    <Coins className="w-3 h-3 mr-1" />
                    50/mo
                  </Badge>
                </div>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2 text-[var(--foreground)]">
                    <Check className="w-3 h-3 text-[var(--color-aurora-mint)]" />
                    Supporter chat access
                  </li>
                  <li className="flex items-center gap-2 text-[var(--foreground)]">
                    <Check className="w-3 h-3 text-[var(--color-aurora-mint)]" />
                    Exclusive posts
                  </li>
                  <li className="flex items-center gap-2 text-[var(--foreground)]">
                    <Check className="w-3 h-3 text-[var(--color-aurora-mint)]" />
                    Supporter badge
                  </li>
                </ul>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
                  <span className="text-xs text-[var(--muted-foreground)]">23 subscribers</span>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* VIP Tier Example */}
            <Card className="border-[var(--color-aurora-yellow)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-[var(--color-aurora-yellow)]" />
                    <span className="font-semibold">VIP</span>
                  </div>
                  <Badge className="bg-[var(--color-aurora-yellow)]/20 text-[var(--color-aurora-violet)]">
                    <Coins className="w-3 h-3 mr-1" />
                    150/mo
                  </Badge>
                </div>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2 text-[var(--foreground)]">
                    <Check className="w-3 h-3 text-[var(--color-aurora-mint)]" />
                    All Supporter benefits
                  </li>
                  <li className="flex items-center gap-2 text-[var(--foreground)]">
                    <Check className="w-3 h-3 text-[var(--color-aurora-mint)]" />
                    Video rooms access
                  </li>
                  <li className="flex items-center gap-2 text-[var(--foreground)]">
                    <Check className="w-3 h-3 text-[var(--color-aurora-mint)]" />
                    Direct messaging
                  </li>
                  <li className="flex items-center gap-2 text-[var(--foreground)]">
                    <Check className="w-3 h-3 text-[var(--color-aurora-mint)]" />
                    VIP badge
                  </li>
                </ul>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
                  <span className="text-xs text-[var(--muted-foreground)]">12 subscribers</span>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
