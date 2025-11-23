"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DollarSign,
  Users,
  Gift,
  CreditCard,
  TrendingUp,
  Star,
  Crown,
  Gem,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface MonetizationPanelProps {
  creatorId: Id<"users">;
}

export function MonetizationPanel({ creatorId }: MonetizationPanelProps) {
  const [payoutAmount, setPayoutAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [paymentDetails, setPaymentDetails] = useState("");

  const subscribers = useQuery(api.monetization.getCreatorSubscribers, { creatorId });
  const tips = useQuery(api.monetization.getCreatorTips, { creatorId, limit: 10 });
  const tiers = useQuery(api.monetization.getCreatorTiers, { creatorId });
  
  const requestPayout = useMutation(api.monetization.requestPayout);

  const handlePayoutRequest = async () => {
    if (!payoutAmount || !paymentDetails) return;
    
    try {
      await requestPayout({
        userId: creatorId,
        amount: parseInt(payoutAmount),
        paymentMethod,
        paymentDetails,
      });
      alert("Payout request submitted!");
      setPayoutAmount("");
      setPaymentDetails("");
    } catch (error) {
      alert("Failed to request payout: " + error);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "basic": return <Star className="w-4 h-4 text-yellow-500" />;
      case "premium": return <Crown className="w-4 h-4 text-purple-500" />;
      case "vip": return <Gem className="w-4 h-4 text-blue-500" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <p className="text-sm text-gray-600">Total Subscribers</p>
          </div>
          <p className="text-2xl font-bold">{subscribers?.totalSubscribers || 0}</p>
          <p className="text-xs text-gray-500">
            Monthly Revenue: {subscribers?.monthlyRevenue || 0} credits
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-5 h-5 text-pink-500" />
            <p className="text-sm text-gray-600">Tips Received</p>
          </div>
          <p className="text-2xl font-bold">{tips?.totalTips || 0}</p>
          <p className="text-xs text-gray-500">
            From {tips?.count || 0} supporters
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <p className="text-sm text-gray-600">Total Earnings</p>
          </div>
          <p className="text-2xl font-bold">
            {(subscribers?.monthlyRevenue || 0) + (tips?.totalTips || 0)}
          </p>
          <p className="text-xs text-gray-500">This month</p>
        </Card>
      </div>

      {/* Subscription Tiers */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Subscription Tiers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers && Object.entries(tiers).map(([tierKey, tier]) => (
            <div key={tierKey} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {getTierIcon(tierKey)}
                <h4 className="font-bold">{tier.name}</h4>
              </div>
              <p className="text-2xl font-bold text-green-600 mb-2">
                {tier.price} credits/month
              </p>
              <p className="text-sm text-gray-600 mb-3">
                {subscribers?.tierCounts[tierKey as keyof typeof subscribers.tierCounts] || 0} subscribers
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                {tier.benefits.map((benefit: string, i: number) => (
                  <li key={i}>• {benefit}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Tips */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Recent Tips</h3>
        <div className="space-y-3">
          {tips && tips.tips && tips.tips.length > 0 ? (
            tips.tips.map((tip) => (
              <div key={tip._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <Gift className="w-4 h-4 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {tip.sender?.name || "Anonymous"}
                    </p>
                    {tip.message && (
                      <p className="text-xs text-gray-600">"{tip.message}"</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">+{Math.floor(tip.amount * 0.95)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(tip._creationTime).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">
              No tips received yet. Keep creating great content!
            </p>
          )}
        </div>
      </Card>

      {/* Payout Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Withdraw Earnings</h3>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <CreditCard className="w-4 h-4 mr-2" />
                Request Payout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Payout</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Amount (credits)</label>
                  <Input
                    type="number"
                    placeholder="Minimum 100 credits"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="paypal">PayPal</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    {paymentMethod === "paypal" ? "PayPal Email" : 
                     paymentMethod === "bank" ? "Bank Account Details" : "Wallet Address"}
                  </label>
                  <Textarea
                    placeholder={paymentMethod === "paypal" ? "your@email.com" : 
                               paymentMethod === "bank" ? "Account number, routing number, etc." : "Wallet address"}
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handlePayoutRequest}
                  className="w-full"
                  disabled={!payoutAmount || !paymentDetails}
                >
                  Submit Payout Request
                </Button>
                <p className="text-xs text-gray-500">
                  Payouts are processed within 3-5 business days. 
                  Platform fee: 5% for tips, 10% for subscriptions.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <p className="font-medium text-green-800">Available for Withdrawal</p>
          </div>
          <p className="text-2xl font-bold text-green-600">
            Coming soon
          </p>
          <p className="text-sm text-green-700">
            Check your credits balance in the Credits page
          </p>
        </div>
      </Card>

      {/* Monetization Tips */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
        <h3 className="text-lg font-bold mb-3">💰 Monetization Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Offer exclusive content to subscribers (behind-the-scenes, tutorials)</li>
          <li>• Engage with your community regularly to build loyalty</li>
          <li>• Create subscriber-only livestreams for premium tiers</li>
          <li>• Share personal safety stories that resonate with your audience</li>
          <li>• Collaborate with other creators to cross-promote</li>
          <li>• Respond to tips and messages to encourage more support</li>
        </ul>
      </Card>
    </div>
  );
}
