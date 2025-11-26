"use client";


import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { FileText, BarChart3, Video, Route, Briefcase, Radio } from "lucide-react";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-is-mobile";

interface CreateOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPost?: () => void;
  onSelectPoll?: () => void;
}

export function CreateOptionsModal({
  open,
  onOpenChange,
  onSelectPost,
  onSelectPoll,
}: CreateOptionsModalProps) {
  const router = useRouter();
  const isMobile = useIsMobile();

  const options = [
    {
      icon: FileText,
      emoji: "💬",
      title: "New Post",
      description: "Share your experience",
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-50",
      action: () => {
        onOpenChange(false);
        onSelectPost?.();
      },
    },
    {
      icon: BarChart3,
      emoji: "📊",
      title: "New Poll",
      description: "Ask the community",
      color: "bg-green-500",
      hoverColor: "hover:bg-green-50",
      action: () => {
        onOpenChange(false);
        onSelectPoll?.();
      },
    },
    {
      icon: Video,
      emoji: "🎥",
      title: "New Reel",
      description: "Record safety video",
      color: "bg-purple-500",
      hoverColor: "hover:bg-purple-50",
      action: () => {
        onOpenChange(false);
        router.push("/reels/create");
      },
    },
    {
      icon: Route,
      emoji: "🗺️",
      title: "Track Route",
      description: "Record your journey",
      color: "bg-orange-500",
      hoverColor: "hover:bg-orange-50",
      action: () => {
        onOpenChange(false);
        router.push("/routes/track");
      },
    },
    {
      icon: Radio,
      emoji: "📡",
      title: "Go Live",
      description: "Start livestream",
      color: "bg-red-500",
      hoverColor: "hover:bg-red-50",
      action: () => {
        onOpenChange(false);
        router.push("/live/broadcast");
      },
    },
    {
      icon: Briefcase,
      emoji: "💼",
      title: "Post Opportunity",
      description: "Share a job or resource",
      color: "bg-pink-500",
      hoverColor: "hover:bg-pink-50",
      action: () => {
        onOpenChange(false);
        router.push("/opportunities");
      },
    },
  ];

  const content = (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 max-h-[60vh] overflow-y-auto">
      {options.map((option) => (
        <button
          key={option.title}
          onClick={option.action}
          className={`flex flex-col items-center gap-3 p-4 sm:p-6 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] transition-all hover:border-[var(--color-aurora-purple)]/50 hover:shadow-md active:scale-95 relative overflow-hidden group min-h-[120px]`}
        >
          <div className="absolute top-2 right-2 text-xl sm:text-2xl opacity-20 group-hover:opacity-40 transition-opacity">
            {option.emoji}
          </div>
          <div className={`w-12 h-12 sm:w-14 sm:h-14 ${option.color} rounded-full flex items-center justify-center shadow-lg`}>
            <option.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-xs sm:text-sm flex items-center justify-center gap-1 text-[var(--foreground)]">
              {option.title}
            </p>
            <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] mt-1">{option.description}</p>
          </div>
        </button>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Create Something New</DrawerTitle>
            <DrawerDescription>
              Choose what you'd like to share with the community
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Something New</DialogTitle>
          <DialogDescription>
            Choose what you'd like to share with the community
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
