import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, User, Download, Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { loadLinks, formatLinksForResume } from "@/lib/links";

type Props = {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
};

// Detect if a message looks like a resume (has typical resume section keywords)
const RESUME_KEYWORDS = ["experience", "education", "skills", "summary", "contact"];
function looksLikeResume(text: string): boolean {
  if (text.length < 400) return false;
  const lower = text.toLowerCase();
  const matches = RESUME_KEYWORDS.filter(k => lower.includes(k));
  return matches.length >= 3;
}

export default function ChatMessage({ role, content, isLoading }: Props) {
  const isUser = role === "user";
  const [downloading, setDownloading] = useState(false);
  const showDownload = !isUser && !isLoading && looksLikeResume(content);

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
          resume_text: content,
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
    <div className={`flex gap-3 slide-up ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 ${
          isUser
            ? "bg-primary text-primary-foreground shadow-primary/20"
            : "bg-secondary text-primary border border-primary/20 shadow-primary/5"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message bubble */}
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm transition-all duration-300 ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm shadow-lg shadow-primary/20"
            : "glass border-primary/10 text-foreground rounded-tl-sm shadow-xl"
        }`}
      >
        <div className={isLoading ? "typing-cursor pulse-subtle" : ""}>
          {isUser ? (
            <div className="whitespace-pre-wrap">{content}</div>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Download button for resume-like messages */}
        {showDownload && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <button
              onClick={downloadDocx}
              disabled={downloading}
              className="flex items-center gap-2 text-xs text-primary-foreground bg-primary hover:opacity-90 disabled:opacity-50 transition-all px-4 py-2 rounded-xl font-bold shadow-lg shadow-primary/20 btn-hover"
            >
              {downloading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
              ) : (
                <><Download className="w-3.5 h-3.5" /> Download (.docx)</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
