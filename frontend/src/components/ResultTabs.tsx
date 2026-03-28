import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, Check, FileText, Mail, Search, Mic, AlertCircle, ClipboardList, Download, Loader2, Sparkles } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { loadLinks, formatLinksForResume } from "@/lib/links";

type Props = {
  results: Record<string, string>;
};

const TAB_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  resume: { label: "Resume", icon: <FileText className="w-4 h-4" /> },
  cover_letter: { label: "Cover Letter", icon: <Mail className="w-4 h-4" /> },
  company_research: { label: "Research", icon: <Search className="w-4 h-4" /> },
  interview_prep: { label: "Interview", icon: <Mic className="w-4 h-4" /> },
  full_output: { label: "Full Output", icon: <ClipboardList className="w-4 h-4" /> },
  error: { label: "Error", icon: <AlertCircle className="w-4 h-4" /> },
};

export default function ResultTabs({ results }: Props) {
  const tabs = Object.keys(results).filter(
    (key) => results[key] && results[key] !== "Not generated"
  );
  const [activeTab, setActiveTab] = useState(tabs[0] || "");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (tabs.length === 0) return null;

  function copyToClipboard() {
    navigator.clipboard.writeText(results[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function downloadDocx() {
    setDownloading(true);
    try {
      const token = getToken();
      const profileLinks = formatLinksForResume(loadLinks());
      const res = await fetch(`${API_BASE}/resume/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resume_text: results["resume"],
          candidate_name: localStorage.getItem("full_name") || "",
          profile_links: profileLinks,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        const detail = typeof err.detail === 'string' 
          ? err.detail 
          : JSON.stringify(err.detail) || "Download failed";
        throw new Error(detail);
      }

      // Trigger browser download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Resume_ResumeCrew.docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Download error:", err);
      alert(`Download failed: ${err.message || "Unknown error"}`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass border-border/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Tab headers */}
        <div className="flex border-b border-border/50 overflow-x-auto bg-muted/30 scrollbar-hide">
          {tabs.map((tab) => {
            const config = TAB_CONFIG[tab] || { label: tab, icon: null };
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition-all relative ${
                  active
                    ? "text-primary active-tab-indicator"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {config.icon && <span className={active ? "text-primary" : "opacity-70"}>{config.icon}</span>}
                {config.label}
                {active && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(20,184,166,0.8)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-6">
          <div className="flex justify-between items-center gap-4 mb-6">
            <h3 className="font-display font-bold text-sm tracking-wider uppercase opacity-50 flex items-center gap-2">
              {activeTab === 'resume' && <Sparkles className="w-3.5 h-3.5 text-primary" />}
              {TAB_CONFIG[activeTab]?.label || activeTab} Output
            </h3>
            
            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all px-3 py-1.5 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 btn-hover"
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5" /> Copied!</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Copy Text</>
                )}
              </button>

              {activeTab === "resume" && results["resume"] && (
                <button
                  onClick={downloadDocx}
                  disabled={downloading}
                  className="flex items-center gap-2 text-xs text-primary-foreground bg-primary hover:opacity-90 disabled:opacity-50 transition-all px-4 py-2 rounded-xl font-bold shadow-lg shadow-primary/25 btn-hover"
                >
                  {downloading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Working...</>
                  ) : (
                    <><Download className="w-3.5 h-3.5" /> Get DOCX</>
                  )}
                </button>
              )}
            </div>
          </div>
          
          <div className="bg-background/40 border border-border/30 rounded-xl p-6 max-h-[600px] overflow-y-auto chat-scroll custom-markdown">
            <div className="markdown-content text-sm md:text-base leading-relaxed text-foreground/90 prose prose-invert max-w-none">
              <ReactMarkdown>{results[activeTab]}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
