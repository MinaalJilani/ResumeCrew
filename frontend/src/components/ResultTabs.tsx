import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, Check, FileText, Mail, Search, Mic, AlertCircle, ClipboardList, Download, Loader2 } from "lucide-react";
import { API_BASE } from "../lib/api";
import { getToken } from "../lib/auth";
import { loadLinks, formatLinksForResume } from "../lib/links";

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
        throw new Error(err.detail || "Download failed");
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
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mt-3 slide-up">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {/* Tab headers */}
        <div className="flex border-b overflow-x-auto bg-gray-50">
          {tabs.map((tab) => {
            const config = TAB_CONFIG[tab] || { label: tab, icon: null };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition border-b-2 ${
                  activeTab === tab
                    ? "text-blue-600 border-blue-600 bg-white"
                    : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                {config.icon}
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-4">
          <div className="flex justify-end items-center gap-2 mb-2">
            {/* Download DOCX — only on resume tab */}
            {activeTab === "resume" && results["resume"] && (
              <button
                onClick={downloadDocx}
                disabled={downloading}
                className="flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition px-3 py-1.5 rounded-lg font-medium"
              >
                {downloading ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                ) : (
                  <><Download className="w-3.5 h-3.5" /> Download DOCX</>
                )}
              </button>
            )}

            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition px-2 py-1 rounded hover:bg-blue-50"
            >
              {copied ? (
                <><Check className="w-3.5 h-3.5" /> Copied!</>
              ) : (
                <><Copy className="w-3.5 h-3.5" /> Copy</>
              )}
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 max-h-[500px] overflow-y-auto chat-scroll">
            <div className="markdown-content text-sm text-gray-700">
              <ReactMarkdown>{results[activeTab]}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
