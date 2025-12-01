"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Globe, 
  MapPin, 
  Clock, 
  Shield, 
  Heart, 
  Scale, 
  Home,
  MessageCircle,
  DollarSign,
  Briefcase,
  BookOpen,
  Users,
  Search,
  CheckCircle,
  ExternalLink,
  Languages
} from "lucide-react";
import { motion } from "framer-motion";

interface ResourceDirectoryProps {
  userId?: Id<"users">;
  country?: string;
  city?: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  hotline: Phone,
  shelter: Home,
  legal: Scale,
  medical: Heart,
  counseling: MessageCircle,
  financial: DollarSign,
  employment: Briefcase,
  education: BookOpen,
  community: Users,
};

const CATEGORY_COLORS: Record<string, string> = {
  hotline: "bg-red-500",
  shelter: "bg-purple-500",
  legal: "bg-blue-500",
  medical: "bg-pink-500",
  counseling: "bg-green-500",
  financial: "bg-yellow-500",
  employment: "bg-indigo-500",
  education: "bg-cyan-500",
  community: "bg-orange-500",
};

export function ResourceDirectory({ userId, country, city }: ResourceDirectoryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Safe queries with null coalescing for error handling
  const categories = useQuery(api.resources.getCategories, { country }) ?? [];
  const resources = useQuery(api.resources.getResources, {
    category: selectedCategory || undefined,
    country,
    city,
  }) ?? [];
  const searchResults = useQuery(
    api.resources.searchResources,
    searchQuery.length >= 2 ? { query: searchQuery } : "skip"
  ) ?? [];
  const verifyResource = useMutation(api.resources.verifyResource);

  const displayResources = searchQuery.length >= 2 ? searchResults : resources;

  const handleVerify = async (resourceId: Id<"safetyResources">) => {
    if (!userId) return;
    try {
      await verifyResource({ resourceId, userId });
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Emergency Banner */}
      <Card className="bg-gradient-to-r from-[var(--color-aurora-orange)] to-[var(--color-aurora-pink)] text-white border-0" role="alert">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse">
              <Phone className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-bold mb-1">In Immediate Danger?</h2>
              <p className="text-white/90 text-sm mb-3">
                Call emergency services immediately
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="tel:911" className="inline-block" aria-label="Call 911 for US emergency services">
                  <Button variant="secondary" size="sm" className="min-h-[48px] min-w-[120px] font-semibold transition-all active:scale-95">
                    <Phone className="w-5 h-5 mr-2" />
                    Call 911 (US)
                  </Button>
                </a>
                <a href="tel:112" className="inline-block" aria-label="Call 112 for EU emergency services">
                  <Button variant="outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white/20 min-h-[48px] min-w-[120px] font-semibold transition-all active:scale-95">
                    <Phone className="w-5 h-5 mr-2" />
                    Call 112 (EU)
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Search resources, services, or organizations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[var(--background)] border-[var(--border)] min-h-[44px]"
        />
      </div>

      {/* Categories */}
      {!searchQuery && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {categories?.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id] || Shield;
            const isSelected = selectedCategory === cat.id;
            
            return (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                className={`
                  p-3 sm:p-4 rounded-xl text-center transition-all min-h-[80px]
                  ${isSelected 
                    ? `${CATEGORY_COLORS[cat.id]} text-white shadow-lg` 
                    : 'bg-[var(--card)] border border-[var(--border)] hover:border-[var(--color-aurora-purple)]/50 hover:shadow'
                  }
                `}
              >
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 ${isSelected ? '' : 'text-[var(--muted-foreground)]'}`} />
                <p className={`text-xs font-medium ${isSelected ? '' : 'text-[var(--foreground)]'}`}>
                  {cat.name}
                </p>
                <Badge 
                  variant="secondary" 
                  className={`mt-1 text-xs ${isSelected ? 'bg-white/20 text-white' : 'bg-[var(--accent)]'}`}
                >
                  {cat.count}
                </Badge>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Resources List */}
      <div className="space-y-4">
        {displayResources?.length === 0 && (
          <Card className="bg-[var(--card)] border-[var(--border)]">
            <CardContent className="py-12 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-[var(--color-aurora-lavender)]" />
              <h3 className="text-lg font-semibold mb-2 text-[var(--foreground)]">No resources found</h3>
              <p className="text-[var(--muted-foreground)] text-sm">
                {searchQuery 
                  ? "Try a different search term"
                  : "Select a category or search for resources"
                }
              </p>
            </CardContent>
          </Card>
        )}

        {displayResources?.map((resource: any) => {
          const Icon = CATEGORY_ICONS[resource.category] || Shield;
          
          return (
            <motion.div
              key={resource._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="hover:shadow-lg transition-shadow bg-[var(--card)] border-[var(--border)]">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className={`w-12 h-12 ${CATEGORY_COLORS[resource.category]} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-[var(--foreground)]">{resource.name}</h3>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            {resource.isVerified && (
                              <Badge className="bg-[var(--color-aurora-mint)]/20 text-[var(--color-aurora-mint)]">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            {resource.isGlobal && (
                              <Badge variant="outline" className="border-[var(--border)]">
                                <Globe className="w-3 h-3 mr-1" />
                                Global
                              </Badge>
                            )}
                            {resource.country && !resource.isGlobal && (
                              <Badge variant="outline" className="border-[var(--border)]">
                                <MapPin className="w-3 h-3 mr-1" />
                                {resource.country}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-[var(--muted-foreground)] text-sm mb-4">
                        {resource.description}
                      </p>
                      
                      {/* Services */}
                      {resource.services?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {resource.services.map((service: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs bg-[var(--accent)]">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {/* Contact Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        {resource.phone && (
                          <a 
                            href={`tel:${resource.phone}`}
                            className="flex items-center gap-2 text-[var(--color-aurora-blue)] hover:underline min-h-[44px]"
                          >
                            <Phone className="w-4 h-4" />
                            {resource.phone}
                          </a>
                        )}
                        {resource.website && (
                          <a 
                            href={resource.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-[var(--color-aurora-blue)] hover:underline min-h-[44px]"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Website
                          </a>
                        )}
                        {resource.hours && (
                          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                            <Clock className="w-4 h-4" />
                            {resource.hours}
                          </div>
                        )}
                        {resource.languages?.length > 0 && (
                          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                            <Languages className="w-4 h-4" />
                            {resource.languages.join(", ")}
                          </div>
                        )}
                      </div>
                      
                      {resource.address && (
                        <p className="text-sm text-[var(--muted-foreground)] mt-2 flex items-start gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          {resource.address}
                        </p>
                      )}
                      
                      {/* Actions */}
                      {userId && !resource.isVerified && (
                        <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {resource.verificationCount || 0}/5 verifications
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerify(resource._id)}
                            className="border-[var(--border)] min-h-[44px]"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Verify Resource (+5 credits)
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
