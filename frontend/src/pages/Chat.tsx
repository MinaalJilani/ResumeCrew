import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ChatMessage from "@/components/ChatMessage";
import ResultTabs from "@/components/ResultTabs";
import { getToken, isLoggedIn } from "@/lib/auth";
import { API_BASE } from "@/lib/api";
import { 
  Send, Loader2, ArrowDown, Plus, MessageSquare, Trash2, LayoutDashboard, 
  Mic, MicOff, Sparkles, ChevronLeft, Menu 
} from "lucide-react";
import { apiGenerateChatTitle } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
  crewResults?: Record<string, string>;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

let msgCounter = 0;
function newId() { return `msg-${Date.now()}-${++msgCounter}`; }

const STORAGE_KEY = "resumecrew_sessions";
const ACTIVE_KEY = "resumecrew_active_session";

function loadSessions(): ChatSession[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function saveSessions(sessions: ChatSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function createNewSession(): ChatSession {
  return {
    id: `session-${Date.now()}`,
    title: "New Chat",
    createdAt: Date.now(),
    messages: [{
      id: newId(),
      role: "assistant",
      content:
        "Hi! I'm your ResumeCrew assistant. You can:\n\n" +
        "- **Paste a job description** — I'll generate a tailored resume, cover letter, company research, and interview prep\n" +
        "- **Ask questions** — about your profile, skills, or career advice\n\n" +
        "Make sure you've uploaded your CV from the Dashboard first!",
    }],
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const navigate = useNavigate();

  // Load sessions from localStorage
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = loadSessions();
    if (saved.length === 0) {
      const first = createNewSession();
      saveSessions([first]);
      return [first];
    }
    return saved;
  });

  const [activeId, setActiveId] = useState<string>(() => {
    const saved = localStorage.getItem(ACTIVE_KEY);
    const sessions = loadSessions();
    if (saved && sessions.find(s => s.id === saved)) return saved;
    return sessions[0]?.id || "";
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find(s => s.id === activeId) || sessions[0];
  const messages = activeSession?.messages || [];

  useEffect(() => { if (!isLoggedIn()) navigate("/login"); }, [navigate]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { localStorage.setItem(ACTIVE_KEY, activeId); }, [activeId]);

  // Update messages for active session and persist
  const updateMessages = useCallback((updater: (prev: Message[]) => Message[]) => {
    setSessions(prev => {
      const updated = prev.map(s =>
        s.id === activeId ? { ...s, messages: updater(s.messages) } : s
      );
      saveSessions(updated);
      return updated;
    });
  }, [activeId]);

  // Update session title using Groq AI (background, non-blocking)
  const updateTitle = useCallback(async (text: string) => {
    try {
      const { title } = await apiGenerateChatTitle(text);
      setSessions(prev => {
        const updated = prev.map(s =>
          s.id === activeId && s.title === "New Chat" ? { ...s, title } : s
        );
        saveSessions(updated);
        return updated;
      });
    } catch {
      // Fallback: use truncated raw text
      const title = text.slice(0, 40) + (text.length > 40 ? "..." : "");
      setSessions(prev => {
        const updated = prev.map(s =>
          s.id === activeId && s.title === "New Chat" ? { ...s, title } : s
        );
        saveSessions(updated);
        return updated;
      });
    }
  }, [activeId]);

  function handleNewChat() {
    const session = createNewSession();
    setSessions(prev => {
      const updated = [session, ...prev];
      saveSessions(updated);
      return updated;
    });
    setActiveId(session.id);
  }

  function handleDeleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      if (updated.length === 0) {
        const fresh = createNewSession();
        saveSessions([fresh]);
        setActiveId(fresh.id);
        return [fresh];
      }
      saveSessions(updated);
      if (id === activeId) setActiveId(updated[0].id);
      return updated;
    });
  }

  function handleScroll() {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }

  function toggleRecording() {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // Keep track of the input before recording started
    const baseInput = input.trim() ? input.trim() + " " : "";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const newText = baseInput + finalTranscript + interimTranscript;
      setInput(newText);
      
      // Auto-adjust height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      if (event.error !== "no-speech") {
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    setIsRecording(true);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    // Update title with first user message
    if (activeSession?.title === "New Chat") updateTitle(userMessage);

    const userMsgId = newId();
    updateMessages(prev => [...prev, { id: userMsgId, role: "user", content: userMessage }]);

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMessage, session_id: activeId }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.type === "crew_started") {
          const loadingMsgId = newId();
          updateMessages(prev => [
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
          updateMessages(prev => [
            ...prev,
            { id: newId(), role: "assistant", content: data.message || "Received response." },
          ]);
          setLoading(false);
        }
      } else {
        await handleStream(res);
      }
    } catch (err: any) {
      updateMessages(prev => [
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
    updateMessages(prev => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";
    if (!reader) { setLoading(false); return; }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) {
              accumulated += data.text;
              updateMessages(prev =>
                prev.map(m => m.id === assistantMsgId ? { ...m, content: accumulated } : m)
              );
            }
            if (data.done) { setLoading(false); return; }
            if (data.error) {
              accumulated += `\n\n⚠️ Error: ${data.error}`;
              updateMessages(prev =>
                prev.map(m => m.id === assistantMsgId ? { ...m, content: accumulated } : m)
              );
            }
          } catch { /* skip malformed */ }
        }
      }
    } finally { setLoading(false); }
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
        if (data.logs?.length > lastLogCount) {
          const latestLog = data.logs[data.logs.length - 1];
          lastLogCount = data.logs.length;
          updateMessages(prev =>
            prev.map(m =>
              m.id === loadingMsgId
                ? { ...m, content: `🤖 ${latestLog}\n\n_Progress: ${data.logs.length} steps completed..._` }
                : m
            )
          );
        }
        if (data.done) {
          clearInterval(interval);
          updateMessages(prev => {
            const filtered = prev.filter(m => m.id !== loadingMsgId);
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
      } catch (err) { console.error("Poll error:", err); }
    }, 2000);
    setTimeout(() => { clearInterval(interval); setLoading(false); }, 300000);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-background text-foreground pt-16 overflow-hidden animate-slide-up">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 transform border-r border-border/50 glass transition-all duration-300 ease-in-out md:relative overflow-hidden ${sidebarOpen ? "w-72 translate-x-0 opacity-100" : "w-0 -translate-x-full md:translate-x-0 opacity-0"}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              History
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handleNewChat}
                className="p-2 transition-colors hover:bg-primary/10 text-primary rounded-lg border border-primary/20 btn-hover"
                title="New Chat"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all btn-hover"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {sessions.map(session => (
              <button
                key={session.id}
                onClick={() => setActiveId(session.id)}
                className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition group ${
                  session.id === activeId
                    ? "bg-primary/10 text-primary font-medium border border-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <MessageSquare className="h-4 w-4 shrink-0 opacity-50" />
                <span className="flex-1 truncate">{session.title}</span>
                <span
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/10 hover:text-red-500 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
        </div>

        {/* Topbar (Mobile Only) */}
        {/* Open Sidebar Toggle (When closed) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-30 p-2.5 glass rounded-xl border border-border shadow-xl text-primary hover:scale-110 transition-all btn-hover"
            title="Open History"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Messages */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto chat-scroll relative z-10"
        >
          <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-display">How can I help you today?</h2>
                <p className="text-muted-foreground max-w-sm">
                  Paste a job description to get started, or ask about your career journey.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <ChatMessage role={msg.role} content={msg.content} isLoading={msg.isLoading} />
                  {msg.crewResults && (
                    <div className="mt-4 ml-0 md:ml-12">
                      <ResultTabs results={msg.crewResults} />
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
            <div className="h-[110px]" /> {/* Massive spacer to clear input box */}
          </div>
        </div>

        {/* Scroll to bottom */}
        {showScrollBtn && (
          <button
            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 glass border border-border shadow-2xl rounded-full p-3 hover:bg-secondary transition-all"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        )}

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-background via-background to-transparent z-20">
          <div className="max-w-3xl mx-auto">
            <div className="glass border border-border p-2 rounded-2xl shadow-2xl focus-within:border-primary/50 transition-all">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                  placeholder="Paste job description or ask anything..."
                  rows={1}
                  className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:ring-0 text-sm md:text-base p-3 resize-none max-h-[200px] placeholder:text-muted-foreground"
                />
                
                <div className="flex gap-2 p-1">
                  <button
                    onClick={toggleRecording}
                    title={isRecording ? "Stop recording" : "Voice input"}
                    className={`p-3 rounded-xl transition-all btn-hover ${
                      isRecording 
                        ? "bg-red-500 text-white animate-pulse" 
                        : "bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/10"
                    }`}
                  >
                    {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>

                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="bg-primary text-primary-foreground p-3 rounded-xl hover:opacity-90 disabled:opacity-40 transition-all btn-hover"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-3 text-center">
              ResumeCrew can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
