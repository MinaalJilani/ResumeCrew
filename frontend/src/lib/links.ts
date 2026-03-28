/**
 * Utils for managing persistent user profile links in localStorage.
 * Used for LinkedIn, GitHub, Portfolios, etc.
 */

export type LinkType = "linkedin" | "github" | "portfolio" | "other";

export interface UserLink {
  id: string;
  type: LinkType;
  url: string;
  label: string;
  description?: string;
}

export const LINK_PRESETS: Record<LinkType, { label: string; placeholder: string; needsDescription?: boolean }> = {
  linkedin: { label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
  github: { label: "GitHub", placeholder: "https://github.com/username" },
  portfolio: { label: "Portfolio", placeholder: "https://myportfolio.com", needsDescription: true },
  other: { label: "Other", placeholder: "https://...", needsDescription: true },
};

const STORAGE_KEY = "resumecrew_profile_links";

export function loadLinks(): UserLink[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Failed to load links", e);
    return [];
  }
}

export function saveLinks(links: UserLink[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

export function deleteLink(id: string): void {
  const current = loadLinks();
  const updated = current.filter(l => l.id !== id);
  saveLinks(updated);
}

export function formatLinksForResume(links: UserLink[]): string[] {
  if (links.length === 0) return [];
  return links.map(l => {
    const cleanUrl = l.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return l.description ? `${cleanUrl} (${l.description})` : cleanUrl;
  });
}
