import zeroretryIndexIcon from "@/assets/zeroretry-icon.svg";
import zeroDistractIcon from "@/assets/zero-distract-icon.svg";

export interface ExtensionInfo {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  chromeStoreUrl: string;
  icon: string;
  path: string;
  features: string[];
  platforms?: string[];
  privacySummary: string;
}

export const extensions: ExtensionInfo[] = [
  {
    slug: "zeroretry-index",
    name: "ZeroRetry Index",
    tagline: "Index and navigate long AI conversations",
    description:
      "Index questions, bookmark insights, and continue across AI tools instantly. Works with ChatGPT, Claude, Gemini, Grok, Perplexity & Copilot.",
    chromeStoreUrl: "https://chrome.google.com/webstore",
    icon: zeroretryIndexIcon,
    path: "/extensions/zeroretry-index",
    features: [
      "Conversation Index",
      "Search & Filter",
      "Bookmarks",
      "Cross-AI Handoff",
      "Projects",
      "Tags",
      "Milestones",
      "Dark Mode",
    ],
    platforms: ["ChatGPT", "Claude", "Gemini", "Perplexity", "Grok", "Copilot"],
    privacySummary: "100% local. No data collection, no analytics, no tracking.",
  },
  {
    slug: "zero-distract",
    name: "Zero Distract",
    tagline: "Reclaim your focus with intelligent nudges",
    description:
      "Stay focused with smart nudges, time tracking, and feed replacement. Understand your habits and make intentional choices about your attention.",
    chromeStoreUrl: "https://chrome.google.com/webstore",
    icon: zeroDistractIcon,
    path: "/extensions/zero-distract",
    features: [
      "Focus Mode",
      "Time Tracking",
      "Smart Nudges",
      "Feed Replacement",
      "Analytics Dashboard",
      "Pattern Detection",
      "Interactive Onboarding",
      "Settings",
    ],
    platforms: [
      "YouTube",
      "Reddit",
      "Twitter / X",
      "Instagram",
      "Facebook",
      "TikTok",
    ],
    privacySummary:
      "Local only. Tracks domain names and time spent. No identity or content tracked.",
  },
];

export function getExtension(slug: string): ExtensionInfo | undefined {
  return extensions.find((e) => e.slug === slug);
}
