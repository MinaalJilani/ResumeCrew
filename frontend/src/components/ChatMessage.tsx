import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, User, Download, Loader2 } from "lucide-react";
import { API_BASE } from "../lib/api";
import { getToken } from "../lib/auth";
import { loadLinks, formatLinksForResume } from "../lib/links";

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
        throw new Error(err.detail || "Download failed");
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
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className={`flex gap-3 slide-up ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gradient-to-br from-violet-500 to-blue-500 text-white"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-sm"
            : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
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
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={downloadDocx}
              disabled={downloading}
              className="flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition px-3 py-1.5 rounded-lg font-medium"
            >
              {downloading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating DOCX...</>
              ) : (
                <><Download className="w-3.5 h-3.5" /> Download as DOCX</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
