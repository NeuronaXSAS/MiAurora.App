"use client";

import { motion } from "framer-motion";
import { pageTransition } from "@/lib/motion";

/**
 * PageTransition — Wrap page content for a subtle entrance animation.
 *
 * Usage:
 *   import { PageTransition } from "@/components/page-transition";
 *   export default function SomePage() {
 *     return <PageTransition>…</PageTransition>;
 *   }
 */
export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}
