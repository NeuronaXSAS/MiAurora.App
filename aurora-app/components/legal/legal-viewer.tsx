"use client";

import { useState, useEffect } from "react";
import Markdown from "markdown-to-jsx";
import { cn } from "@/lib/utils";
import { ChevronRight, FileText, Shield, Scale } from "lucide-react";

interface LegalViewerProps {
  content: string;
  title: string;
  lastUpdated?: string;
}

interface TocItem {
  id: string;
  title: string;
  level: number;
}

export function LegalViewer({ content, title, lastUpdated }: LegalViewerProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeSection, setActiveSection] = useState<string>("");

  // Extract table of contents from markdown headers
  useEffect(() => {
    const lines = content.split("\n");
    const toc: TocItem[] = [];
    
    lines.forEach((line) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const title = match[2].trim();
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        
        if (level <= 3) { // Only show h1, h2, h3 in TOC
          toc.push({ id, title, level });
        }
      }
    });
    
    setTocItems(toc);
  }, [content]);

  // Handle scroll spy for active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = tocItems.map(item => document.getElementById(item.id)).filter(Boolean);
      const scrollPosition = window.scrollY + 100;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(tocItems[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [tocItems]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Custom markdown components with proper heading IDs
  const markdownOptions = {
    overrides: {
      h1: ({ children, ...props }: any) => {
        const id = children.toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return (
          <h1 id={id} className="scroll-mt-20" {...props}>
            {children}
          </h1>
        );
      },
      h2: ({ children, ...props }: any) => {
        const id = children.toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return (
          <h2 id={id} className="scroll-mt-20" {...props}>
            {children}
          </h2>
        );
      },
      h3: ({ children, ...props }: any) => {
        const id = children.toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return (
          <h3 id={id} className="scroll-mt-20" {...props}>
            {children}
          </h3>
        );
      },
    },
  };

  const getIcon = (title: string) => {
    if (title.toLowerCase().includes("terms")) return <FileText className="w-5 h-5" />;
    if (title.toLowerCase().includes("privacy")) return <Shield className="w-5 h-5" />;
    return <Scale className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              {getIcon(title)}
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
                {lastUpdated && (
                  <p className="text-sm text-slate-500">Last updated: {lastUpdated}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-slate-600">Legal Document</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Table of Contents - Sticky Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Table of Contents
                </h3>
                <nav className="space-y-1">
                  {tocItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={cn(
                        "block w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                        "hover:bg-slate-100",
                        activeSection === item.id
                          ? "bg-purple-50 text-purple-700 border-l-2 border-purple-500"
                          : "text-slate-600 hover:text-slate-900",
                        item.level === 1 && "font-medium",
                        item.level === 2 && "ml-3",
                        item.level === 3 && "ml-6 text-xs"
                      )}
                    >
                      <div className="flex items-center">
                        {activeSection === item.id && (
                          <ChevronRight className="w-3 h-3 mr-1 flex-shrink-0" />
                        )}
                        <span className="truncate">{item.title}</span>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-8 lg:p-12">
                <article className="prose prose-slate lg:prose-xl max-w-none">
                  <Markdown options={markdownOptions}>{content}</Markdown>
                </article>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Scale className="w-5 h-5 text-slate-500" />
                  <span className="text-sm text-slate-600">
                    This document is legally binding and enforceable.
                  </span>
                </div>
                <div className="text-sm text-slate-500">
                  © 2024 Aurora. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
