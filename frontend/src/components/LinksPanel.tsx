import { useState } from "react";
import {
  UserLink, LinkType, LINK_PRESETS,
  loadLinks, saveLinks, deleteLink,
} from "../lib/links";
import { Link2, Plus, Trash2, X, Check } from "lucide-react";

type LinkTypeOption = { value: LinkType; label: string; icon: string };

const LINK_TYPES: LinkTypeOption[] = [
  { value: "linkedin",  label: "LinkedIn",  icon: "💼" },
  { value: "github",    label: "GitHub",    icon: "🐙" },
  { value: "portfolio", label: "Portfolio", icon: "🌐" },
  { value: "other",     label: "Other",     icon: "🔗" },
];

const TYPE_COLORS: Record<LinkType, string> = {
  linkedin:  "bg-primary/5 text-primary border-primary/20",
  github:    "bg-secondary/50 text-foreground border-border",
  portfolio: "bg-primary/5 text-primary border-primary/20",
  other:     "bg-secondary/50 text-foreground border-border",
};

type Props = { onChanged?: () => void };

export default function LinksPanel({ onChanged }: Props) {
  const [links, setLinks] = useState<UserLink[]>(() => loadLinks());
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<LinkType>("linkedin");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [saved, setSaved] = useState(false);

  const preset = LINK_PRESETS[type];

  function handleAdd() {
    if (!url.trim()) return;
    const newLink: UserLink = {
      id: `link-${Date.now()}`,
      type,
      url: url.trim(),
      label: preset.label,
      description: preset.needsDescription ? description.trim() : undefined,
    };
    const updated = [...links, newLink];
    saveLinks(updated);
    setLinks(updated);
    setUrl("");
    setDescription("");
    setShowForm(false);
    onChanged?.();
  }

  function handleDelete(id: string) {
    deleteLink(id);
    const updated = links.filter(l => l.id !== id);
    setLinks(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onChanged?.();
  }

  return (
    <div className="glass rounded-2xl border-primary/10 p-8 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Link2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Profile Links</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Added to resume headers automatically when you download
            </p>
          </div>
        </div>
        {saved && (
          <span className="flex items-center gap-2 text-sm text-green-500 font-bold animate-pulse">
            <Check className="w-4 h-4" /> Saved
          </span>
        )}
      </div>

      {/* Existing links */}
      {links.length > 0 && (
        <div className="space-y-2 mb-4">
          {links.map(link => {
            const t = LINK_TYPES.find(x => x.value === link.type);
            return (
              <div
                key={link.id}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-sm ${TYPE_COLORS[link.type]}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base flex-shrink-0">{t?.icon}</span>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{link.url}</p>
                    {link.description && (
                      <p className="text-xs opacity-70 truncate">{link.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(link.id)}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-red-100 hover:text-red-600 transition opacity-60 hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <div className="glass border-white/5 rounded-2xl p-6 space-y-4 bg-secondary/20">
          {/* Link type selector */}
          <div className="flex flex-wrap gap-2">
            {LINK_TYPES.map(lt => (
              <button
                key={lt.value}
                onClick={() => setType(lt.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  type === lt.value
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                <span>{lt.icon}</span> {lt.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder={preset.placeholder}
              className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none transition-all placeholder:text-muted-foreground"
            />

            {preset.needsDescription && (
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={`Describe this ${preset.label.toLowerCase()} (e.g. "UI/UX design portfolio")`}
                className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none transition-all placeholder:text-muted-foreground"
              />
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              disabled={!url.trim()}
              className="flex-1 bg-primary text-primary-foreground text-sm font-bold px-4 py-3 rounded-xl hover:opacity-90 disabled:opacity-40 transition-all shadow-lg shadow-primary/10"
            >
              Add Link
            </button>
            <button
              onClick={() => { setShowForm(false); setUrl(""); setDescription(""); }}
              className="px-4 py-3 rounded-xl border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground border-2 border-dashed border-primary/20 rounded-2xl py-4 hover:border-primary/50 hover:text-primary transition-all bg-primary/5"
        >
          <Plus className="w-5 h-5" /> Add a link
        </button>
      )}
    </div>
  );
}
