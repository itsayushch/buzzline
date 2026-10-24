"use client";

import { useState, useRef, useEffect } from "react";
import { useCanteen } from "@/lib/canteenContext";
import { parseAndExecuteIntent, ToolCallLog } from "@/lib/agentTools";
import { formatCurrentTime } from "@/lib/mockData";

interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  toolCall?: ToolCallLog;
}

export default function AgentChatPage() {
  const canteen = useCanteen();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "agent",
      text: `Hello! I'm your Buzzline Campus Assistant. I monitor real-time queues across the Central Canteen (~${
        canteen.services.find((s) => s.id === "canteen")?.queueMinutes || 8
      }m), Library (~${
        canteen.services.find((s) => s.id === "library")?.queueMinutes || 12
      }m), Print Shop, Admin Office, Clinic, and Gym, plus free study rooms. How can I help you today?`,
      timestamp: canteen.status.lastUpdated,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (messageText: string) => {
    const text = messageText.trim();
    if (!text || isTyping) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: formatCurrentTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = parseAndExecuteIntent(text, canteen);

      const agentMessage: Message = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: response.reply,
        timestamp: formatCurrentTime(),
        toolCall: response.toolCall,
      };

      setMessages((prev) => [...prev, agentMessage]);
      setIsTyping(false);
    }, 350);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const samplePrompts = [
    "How busy is the canteen?",
    "Is the library crowded?",
    "How long is the print shop line?",
    "Admin queue for ID card?",
    "Find a free room",
    "Order Maggi in 10 mins",
    "Reserve print slot for 2:30 PM",
  ];

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-61px)] bg-slate-50 text-slate-800">
      {/* Subheader Banner */}
      <div className="border-b border-slate-200/80 bg-white px-4 py-2.5 text-xs text-slate-600 shadow-2xs">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-800">Campus Agent:</span>
            <span>6 Facilities + Room Lookup Tools active</span>
          </div>
          <span className="font-mono text-slate-500 text-[11px]">
            Live Sync: Canteen, Library, Xerox, Admin
          </span>
        </div>
      </div>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((message) => {
            const isUser = message.sender === "user";

            return (
              <div
                key={message.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 shadow-2xs text-sm ${
                    isUser
                      ? "bg-slate-900 text-white rounded-br-xs"
                      : "bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs"
                  }`}
                >
                  {/* Tool Call Visualization */}
                  {!isUser && message.toolCall && (
                    <div className="mb-2.5 rounded-lg border border-purple-200 bg-purple-50/80 px-2.5 py-1.5 font-mono text-[11px] text-purple-950">
                      <div className="flex items-center gap-1.5 font-bold text-purple-800">
                        <span>⚡ Tool Executed:</span>
                        <code className="text-purple-950 bg-purple-100/80 px-1 py-0.5 rounded">
                          {message.toolCall.name}()
                        </code>
                      </div>
                      {message.toolCall.args && (
                        <div className="mt-1 text-purple-900/90">
                          Args: {JSON.stringify(message.toolCall.args)}
                        </div>
                      )}
                    </div>
                  )}

                  <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
                </div>

                <span className="mt-1 px-1 text-[11px] text-slate-400">
                  {isUser ? "You" : "Buzzline Agent"} · {message.timestamp}
                </span>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-2 pl-2">
              <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-bounce" />
              <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]" />
              <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-slate-500 font-medium">Agent querying campus queue tools...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Suggested Prompts & Input Box */}
      <footer className="border-t border-slate-200 bg-white p-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="self-center font-semibold text-slate-500 text-[11px] mr-1">
              Ask about:
            </span>
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 cursor-pointer whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about library desks, print shop line, canteen menu, admin tokens, or rooms..."
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 shadow-2xs focus:border-purple-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/30 disabled:opacity-50 cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
