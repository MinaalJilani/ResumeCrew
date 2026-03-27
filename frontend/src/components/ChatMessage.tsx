import ReactMarkdown from "react-markdown";
import { Bot, User } from "lucide-react";

type Props = {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
};

export default function ChatMessage({ role, content, isLoading }: Props) {
  const isUser = role === "user";

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
      </div>
    </div>
  );
}
