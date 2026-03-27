import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatMessage from "../components/ChatMessage";
import ResultTabs from "../components/ResultTabs";
import { getToken, isLoggedIn } from "../lib/auth";
import { API_BASE } from "../lib/api";
import { Send, Loader2, ArrowDown } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
  crewResults?: Record<string, string>;
};

let msgCounter = 0;
function newId() {
  return `msg-${Date.now()}-${++msgCounter}`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: newId(),
      role: "assistant",
      content:
        "Hi! I'm your AI career assistant. You can:\n\n" +
        "- **Paste a job description** — I'll generate a tailored resume, cover letter, company research, and interview prep\n" +
        "- **Ask questions** — about your profile, skills, or career advice\n\n" +
        "Make sure you've uploaded your CV from the Dashboard first!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn()) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function handleScroll() {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  }

  // Auto-resize textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    const userMsgId = newId();
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", content: userMessage }]);

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage, session_id: "main" }),
      });

      // Check content type — JSON means crew_started, SSE means streaming
      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const data = await res.json();

        if (data.type === "crew_started") {
          const loadingMsgId = newId();
          setMessages((prev) => [
            ...prev,
            {
              id: loadingMsgId,
              role: "assistant",
              content: "🤖 AI agents are working on your application...\n\nThis usually takes 1-2 minutes. I'll show progress updates below.",
              isLoading: true,
            },
          ]);
          pollResults(data.job_id, loadingMsgId);
        } else {
          setMessages((prev) => [
            ...prev,
            { id: newId(), role: "assistant", content: data.message || "Received response." },
          ]);
          setLoading(false);
        }
      } else {
        // SSE streaming
        await handleStream(res);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "assistant",
          content: `⚠️ **Connection Error**\n\n${err.message}\n\nMake sure the backend is running at \`${API_BASE}\``,
        },
      ]);
      setLoading(false);
    }
  }

  async function handleStream(res: Response) {
    const assistantMsgId = newId();
    setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";

    if (!reader) {
      setLoading(false);
      return;
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                accumulated += data.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: accumulated } : m
                  )
                );
              }
              if (data.done) {
                setLoading(false);
                return;
              }
              if (data.error) {
                accumulated += `\n\n⚠️ Error: ${data.error}`;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: accumulated } : m
                  )
                );
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function pollResults(jobId: string, loadingMsgId: string) {
    const token = getToken();
    let lastLogCount = 0;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/results/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        // Update logs
        if (data.logs?.length > lastLogCount) {
          const latestLog = data.logs[data.logs.length - 1];
          lastLogCount = data.logs.length;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === loadingMsgId
                ? { ...m, content: `🤖 ${latestLog}\n\n_Progress: ${data.logs.length} steps completed..._` }
                : m
            )
          );
        }

        if (data.done) {
          clearInterval(interval);

          // Remove the loading message and add the results
          setMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== loadingMsgId);
            return [
              ...filtered,
              {
                id: newId(),
                role: "assistant",
                content: data.outputs?.error
                  ? `⚠️ **Error:** ${data.outputs.error}`
                  : "✅ **All agents have finished!** Here are your results:",
                crewResults: data.outputs?.error ? undefined : data.outputs,
              },
            ];
          });
          setLoading(false);
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }, 2000);

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      setLoading(false);
    }, 300000);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] bg-gray-50">
      {/* Messages area */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto chat-scroll"
      >
        <div className="max-w-3xl mx-auto p-4 space-y-4 pb-4">
          {messages.map((msg) => (
            <div key={msg.id}>
              <ChatMessage role={msg.role} content={msg.content} isLoading={msg.isLoading} />
              {msg.crewResults && (
                <div className="ml-11">
                  <ResultTabs results={msg.crewResults} />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
          <button
            onClick={scrollToBottom}
            className="bg-white border shadow-lg rounded-full p-2 hover:bg-blue-50 transition"
          >
            <ArrowDown className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="border-t bg-white p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Paste a job description or ask anything..."
                rows={1}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition max-h-[200px]"
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
              title="Send message"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Press Enter to send · Shift+Enter for new line · Paste a job description to trigger AI agents
          </p>
        </div>
      </div>
    </div>
  );
}
