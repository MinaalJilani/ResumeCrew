/**
 * User profile links — stored in localStorage, keyed by user email.
 * Used to inject social/portfolio links into DOCX resume headers.
 */

export type LinkType = "linkedin" | "github" | "portfolio" | "other";

export type UserLink = {
  id: string;
  type: LinkType;
  url: string;
  label: string;       // display name e.g. "LinkedIn", "GitHub", "Behance"
  description?: string; // only for portfolio/other — "UI/UX design portfolio"
};

const STORAGE_KEY = "resumecrew_links";

export function loadLinks(): UserLink[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

export function saveLinks(links: UserLink[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

export function addLink(link: Omit<UserLink, "id">): UserLink {
  const newLink: UserLink = { ...link, id: `link-${Date.now()}` };
  const existing = loadLinks();
  saveLinks([...existing, newLink]);
  return newLink;
}

export function deleteLink(id: string) {
  saveLinks(loadLinks().filter(l => l.id !== id));
}

export function updateLink(id: string, updates: Partial<UserLink>) {
  saveLinks(loadLinks().map(l => l.id === id ? { ...l, ...updates } : l));
}

/** Format links for display in the DOCX contact line */
export function formatLinksForResume(links: UserLink[]): string[] {
  return links.map(l => {
    const base = l.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return l.description ? `${base} (${l.description})` : base;
  });
}

export const LINK_PRESETS: Record<LinkType, { label: string; placeholder: string; needsDescription: boolean }> = {
  linkedin:  { label: "LinkedIn",  placeholder: "https://linkedin.com/in/yourname",   needsDescription: false },
  github:    { label: "GitHub",    placeholder: "https://github.com/yourname",         needsDescription: false },
  portfolio: { label: "Portfolio", placeholder: "https://yourportfolio.com",           needsDescription: true  },
  other:     { label: "Other",     placeholder: "https://...",                         needsDescription: true  },
};
