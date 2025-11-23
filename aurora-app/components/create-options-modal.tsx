"use client";

import { useState } from "react";
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
import { FileText, BarChart3, Video, Route, Briefcase } from "lucide-react";
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
      icon: Briefcase,
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
    <div className="grid grid-cols-2 gap-4 p-4">
      {options.map((option) => (
        <button
          key={option.title}
          onClick={option.action}
          className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-100 transition-all ${option.hoverColor} hover:border-gray-200 hover:shadow-md active:scale-95`}
        >
          <div className={`w-14 h-14 ${option.color} rounded-full flex items-center justify-center`}>
            <option.icon className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm">{option.title}</p>
            <p className="text-xs text-gray-500 mt-1">{option.description}</p>
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
