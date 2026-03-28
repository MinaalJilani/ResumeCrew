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
  linkedin:  "bg-blue-50 text-blue-700 border-blue-200",
  github:    "bg-gray-50 text-gray-700 border-gray-200",
  portfolio: "bg-violet-50 text-violet-700 border-violet-200",
  other:     "bg-green-50 text-green-700 border-green-200",
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
    <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Link2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Profile Links</h2>
            <p className="text-gray-500 text-xs">
              Added to resume headers automatically when you download
            </p>
          </div>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <Check className="w-3.5 h-3.5" /> Saved
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
        <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
          {/* Link type selector */}
          <div className="flex flex-wrap gap-2">
            {LINK_TYPES.map(lt => (
              <button
                key={lt.value}
                onClick={() => setType(lt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                  type === lt.value
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                }`}
              >
                <span>{lt.icon}</span> {lt.label}
              </button>
            ))}
          </div>

          {/* URL input */}
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder={preset.placeholder}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />

          {/* Description — only for portfolio/behance/other */}
          {preset.needsDescription && (
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={`Describe this ${preset.label.toLowerCase()} (e.g. "UI/UX design portfolio")`}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          )}

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!url.trim()}
              className="flex-1 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition"
            >
              Add Link
            </button>
            <button
              onClick={() => { setShowForm(false); setUrl(""); setDescription(""); }}
              className="px-3 py-2 rounded-xl border text-gray-500 hover:bg-gray-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-xl py-3 hover:border-blue-400 hover:text-blue-600 transition"
        >
          <Plus className="w-4 h-4" /> Add a link
        </button>
      )}
    </div>
  );
}
