"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/file-upload";
import { Info } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface OpportunityEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: Id<"users">;
  opportunity: {
    _id: Id<"opportunities">;
    title: string;
    description: string;
    category: string;
    company?: string;
    location?: string;
    creditCost: number;
    contactEmail?: string;
    externalLink?: string;
    salary?: string;
    requirements?: string[];
    thumbnailStorageId?: Id<"_storage">;
  };
}

export function OpportunityEditDialog({
  open,
  onOpenChange,
  userId,
  opportunity,
}: OpportunityEditDialogProps) {
  const [category, setCategory] = useState(opportunity.category);
  const [title, setTitle] = useState(opportunity.title);
  const [description, setDescription] = useState(opportunity.description);
  const [company, setCompany] = useState(opportunity.company || "");
  const [location, setLocation] = useState(opportunity.location || "");
  const [creditCost, setCreditCost] = useState(opportunity.creditCost);
  const [contactEmail, setContactEmail] = useState(opportunity.contactEmail || "");
  const [externalLink, setExternalLink] = useState(opportunity.externalLink || "");
  const [salary, setSalary] = useState(opportunity.salary || "");
  const [requirements, setRequirements] = useState(
    opportunity.requirements?.join("\n") || ""
  );
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when opportunity changes
  useEffect(() => {
    setCategory(opportunity.category);
    setTitle(opportunity.title);
    setDescription(opportunity.description);
    setCompany(opportunity.company || "");
    setLocation(opportunity.location || "");
    setCreditCost(opportunity.creditCost);
    setContactEmail(opportunity.contactEmail || "");
    setExternalLink(opportunity.externalLink || "");
    setSalary(opportunity.salary || "");
    setRequirements(opportunity.requirements?.join("\n") || "");
    setUploadedFiles([]);
  }, [opportunity]);

  const updateOpportunity = useMutation(api.opportunities.update);

  const handleSubmit = async () => {
    // Validation
    if (!category) {
      setError("Please select a category");
      return;
    }
    if (title.length < 5 || title.length > 100) {
      setError("Title must be 5-100 characters");
      return;
    }
    if (description.length < 20 || description.length > 1000) {
      setError("Description must be 20-1000 characters");
      return;
    }
    if (creditCost < 5 || creditCost > 100) {
      setError("Credit cost must be between 5 and 100");
      return;
    }
    if (contactEmail && !contactEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Parse requirements
      const requirementsList = requirements
        .split("\n")
        .map((r) => r.trim())
        .filter((r) => r.length > 0);

      // Update opportunity
      const result = await updateOpportunity({
        opportunityId: opportunity._id,
        userId,
        title,
        description,
        category: category as any,
        company: company || undefined,
        location: location || undefined,
        creditCost,
        contactEmail: contactEmail || undefined,
        externalLink: externalLink || undefined,
        salary: salary || undefined,
        requirements: requirementsList.length > 0 ? requirementsList : undefined,
        thumbnailStorageId: uploadedFiles.length > 0 ? uploadedFiles[0].storageId : undefined,
      });

      if (result.success) {
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error("Opportunity update error:", err);
      setError(err.message || "Failed to update opportunity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Opportunity</DialogTitle>
          <DialogDescription>
            Update your opportunity details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Category */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Category *
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="job">Job - Employment opportunities</SelectItem>
                <SelectItem value="mentorship">Mentorship - Guidance & coaching</SelectItem>
                <SelectItem value="resource">Resource - Tools & materials</SelectItem>
                <SelectItem value="event">Event - Workshops & networking</SelectItem>
                <SelectItem value="funding">Funding - Grants & investments</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Title * (5-100 characters)
            </label>
            <Input
              placeholder="e.g., Senior Software Engineer at TechCorp"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              {title.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Description * (20-1000 characters)
            </label>
            <Textarea
              placeholder="Describe the opportunity in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/1000 characters
            </p>
          </div>

          {/* Company/Organization */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Company/Organization (Optional)
            </label>
            <Input
              placeholder="e.g., TechCorp Inc."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Location (Optional)
            </label>
            <Input
              placeholder="e.g., San Francisco, CA or Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Salary (for jobs) */}
          {category === "job" && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Salary Range (Optional)
              </label>
              <Input
                placeholder="e.g., $80,000 - $120,000"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
              />
            </div>
          )}

          {/* Credit Cost */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Credit Cost * (5-100 credits)
            </label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min={5}
                max={100}
                value={creditCost}
                onChange={(e) => setCreditCost(parseInt(e.target.value) || 5)}
                className="w-32"
              />
              <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Set how many credits users need to unlock this opportunity. Higher value = more exclusive.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Email */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Contact Email (Optional)
            </label>
            <Input
              type="email"
              placeholder="e.g., hiring@company.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>

          {/* External Link */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              External Link (Optional)
            </label>
            <Input
              type="url"
              placeholder="e.g., https://company.com/careers"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Requirements (Optional)
            </label>
            <Textarea
              placeholder="Enter each requirement on a new line&#10;e.g.,&#10;5+ years experience&#10;Bachelor's degree&#10;Strong communication skills"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              One requirement per line
            </p>
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Update Thumbnail Image (Optional)
            </label>
            <FileUpload
              onFilesChange={setUploadedFiles}
              maxFiles={1}
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload a new logo or image (leave empty to keep current)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Updating..." : "Update Opportunity"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
