import { LegalViewer } from "@/components/legal/legal-viewer";
import { readFileSync } from "fs";
import { join } from "path";

export const metadata = {
  title: "Terms of Service - Aurora",
  description: "Terms of Service and User Agreement for Aurora - Women's Safety Platform",
};

export default function TermsPage() {
  // Read the terms content from the legal directory
  const termsPath = join(process.cwd(), "legal", "T&C.md");
  const termsContent = readFileSync(termsPath, "utf8");

  return (
    <LegalViewer
      content={termsContent}
      title="Terms of Service"
      lastUpdated="December 2024"
    />
  );
}
