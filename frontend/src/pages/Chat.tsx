import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ChatMessage from "../components/ChatMessage";
import ResultTabs from "../components/ResultTabs";
import { getToken, isLoggedIn } from "../lib/auth";
import { API_BASE } from "../lib/api";
import { Send, Loader2, ArrowDown, Plus, MessageSquare, Trash2, LayoutDashboard, Mic, MicOff } from "lucide-react";
import { apiGenerateChatTitle } from "../lib/api";

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
        "Hi! I'm your AI career assistant. You can:\n\n" +
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
    <div className="flex h-[calc(100vh-57px)] bg-gray-50">

      {/* Sidebar */}
      <div className={`flex-shrink-0 bg-white border-r flex flex-col transition-all duration-200 ${sidebarOpen ? "w-64" : "w-0 overflow-hidden"}`}>
        <div className="p-3 border-b flex items-center gap-2">
          <button
            onClick={handleNewChat}
            className="flex-1 flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
            title="Dashboard"
          >
            <LayoutDashboard className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => setActiveId(session.id)}
              className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition group ${
                session.id === activeId
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
              <span className="flex-1 truncate">{session.title}</span>
              <span
                onClick={(e) => handleDeleteSession(session.id, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-500 transition"
              >
                <Trash2 className="w-3 h-3" />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* Topbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-white shadow-sm">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
            title="Toggle sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700 truncate">
            {activeSession?.title || "New Chat"}
          </span>
        </div>

        {/* Messages */}
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

        {/* Scroll to bottom */}
        {showScrollBtn && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
            <button
              onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="bg-white border shadow-lg rounded-full p-2 hover:bg-blue-50 transition"
            >
              <ArrowDown className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}

        {/* Input */}
        <div className="border-t bg-white p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                  placeholder="Paste a job description, or ask anything..."
                  rows={1}
                  className="w-full border border-gray-300 rounded-xl pl-4 pr-12 py-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition max-h-[200px]"
                />
              </div>
              
              <button
                onClick={toggleRecording}
                className={`p-3 rounded-xl transition flex-shrink-0 ${
                  isRecording 
                    ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-blue-600"
                }`}
                title={isRecording ? "Stop recording" : "Start voice input"}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
                title="Send message"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Press Enter to send · Shift+Enter for new line · Or click the microphone to dictate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
