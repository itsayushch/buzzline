"use client";

import { useState, useRef, useEffect } from "react";
import { useLocations } from "@/lib/locationsContext";
import { formatCurrentTime } from "@/lib/mockData";
import { Zap, Send, Sparkles, BookOpen, ExternalLink, Bot, CheckCircle2 } from "lucide-react";

interface RetrievedSource {
  id: string;
  title: string;
}

interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  toolCall?: {
    name: string;
    args?: Record<string, unknown>;
  };
  retrievedSources?: RetrievedSource[];
  poweredBy?: string;
}

export default function AgentChatPage() {
  const context = useLocations();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "agent",
      text: `Hello! I'm your Buzzline Campus AI powered by Groq & RAG.\n\nI have access to real-time campus queue wait times across all 6 facilities, plus the official **Campus Knowledge Base** (library borrowing rules, printing pricing, clinic doctors, canteen menus & registrar procedures).\n\nAsk me anything or tell me to pre-order food, reserve a study desk, or claim a digital line pass!`,
      timestamp: context.status.lastUpdated,
      poweredBy: "Groq Llama 3.3 + RAG",
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

  const handleSendMessage = async (messageText: string) => {
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

    try {
      // Call the Groq + RAG API endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
          locations: context.locations,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // If the AI agent executed a tool call, run the actual mutation against the live context!
      if (data.toolCall) {
        const { name, args } = data.toolCall;
        if (name === "claimQueueToken" && args?.locationId) {
          context.claimToken(
            String(args.locationId),
            String(args.itemOrPurpose || "Campus Access"),
            args.scheduledTime ? String(args.scheduledTime) : undefined
          );
        } else if (name === "reserveDesk" && args?.locationId) {
          context.reserveDesk(
            String(args.locationId),
            String(args.deskLabel || "Silent Desk #14"),
            args.timeSlot ? String(args.timeSlot) : undefined
          );
        }
      }

      const agentMessage: Message = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: data.reply,
        timestamp: formatCurrentTime(),
        toolCall: data.toolCall,
        retrievedSources: data.retrievedSources,
        poweredBy: data.poweredBy,
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (err) {
      console.warn("Error communicating with chat API:", err);

      const errorMessage: Message = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: "I encountered a brief connection issue. However, live facility wait times are synced on your student dashboard!",
        timestamp: formatCurrentTime(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const samplePrompts = [
    "What are the printing rates & hours?",
    "How many books can undergrads borrow?",
    "Which doctor is at the clinic right now?",
    "Are discussion pods soundproof?",
    "Order Chole Bhature in 15 mins",
    "Which counter for student ID cards?",
    "Is the library crowded right now?",
  ];

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-57px)] sm:h-[calc(100vh-61px)] bg-[#fbfbfd] text-[#1d1d1f] font-sans">
      {/* Subheader Banner */}
      <div className="border-b border-black/[0.04] bg-white/70 backdrop-blur-md px-4 py-2 text-xs text-[#6e6e73] shrink-0">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-[#1d1d1f]">Groq AI + Campus RAG Engine</span>
            <span className="text-[#86868b] hidden sm:inline">· Llama 3.3 70B</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
            <Sparkles className="h-3 w-3 text-emerald-600" />
            <span>RAG Active</span>
          </div>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
        <div className="mx-auto max-w-2xl space-y-5">
          {messages.map((message) => {
            const isUser = message.sender === "user";

            return (
              <div
                key={message.id}
                className={`flex flex-col ${
                  isUser ? "items-end" : "items-start"
                }`}
              >
                {/* Message Bubble */}
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-3xl px-4.5 py-3 text-sm leading-relaxed transition-all ${
                    isUser
                      ? "bg-[#1d1d1f] text-white rounded-br-md shadow-xs font-normal"
                      : "bg-white text-[#1d1d1f] border border-black/[0.06] rounded-bl-md shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
                  }`}
                >
                  {/* Tool Call Card */}
                  {!isUser && message.toolCall && (
                    <div className="mb-3 rounded-2xl border border-black/[0.06] bg-neutral-50/90 p-3 font-mono text-[11px] text-[#1d1d1f]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-neutral-800">
                          <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          <span>Tool Action Executed:</span>
                          <code className="bg-neutral-200/70 px-1.5 py-0.5 rounded font-semibold text-neutral-900">
                            {message.toolCall.name}()
                          </code>
                        </div>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      {message.toolCall.args && (
                        <div className="mt-1 text-[#6e6e73] text-[10px] truncate">
                          Payload: {JSON.stringify(message.toolCall.args)}
                        </div>
                      )}
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{message.text}</p>

                  {/* RAG Source Citation Chips */}
                  {!isUser &&
                    message.retrievedSources &&
                    message.retrievedSources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-black/[0.05] flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider flex items-center gap-1 mr-1">
                          <BookOpen className="h-2.5 w-2.5" />
                          RAG Sources:
                        </span>
                        {message.retrievedSources.map((source) => (
                          <span
                            key={source.id}
                            className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-[#6e6e73] border border-black/[0.04]"
                          >
                            <span>{source.title.split(",")[0].split(" ")[0]}</span>
                          </span>
                        ))}
                      </div>
                    )}
                </div>

                {/* Sender & Engine Metadata */}
                <div className="mt-1 px-1 flex items-center gap-2 text-[11px] text-[#86868b]">
                  <span>{isUser ? "You" : "Buzzline AI"} · {message.timestamp}</span>
                  {!isUser && message.poweredBy && (
                    <span className="text-[10px] font-mono text-neutral-400">
                      ({message.poweredBy})
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Subtle Thinking State */}
          {isTyping && (
            <div className="flex items-center gap-2.5 animate-in fade-in duration-200">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1d1d1f] text-white text-[10px]">
                <Zap className="h-3 w-3 text-amber-400 fill-amber-400" />
              </div>
              <div className="rounded-2xl rounded-bl-xs border border-black/[0.06] bg-white px-3.5 py-2 shadow-xs flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-xs text-[#6e6e73] font-medium">
                  Groq is searching campus knowledge & live queues...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Suggested Prompts & Floating Input Bar */}
      <footer className="border-t border-black/[0.05] bg-white/80 backdrop-blur-xl p-3 sm:p-4 shrink-0">
        <div className="mx-auto max-w-2xl space-y-3">
          {/* Quick suggestions */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="rounded-full border border-black/[0.06] bg-neutral-100/70 px-3 py-1 text-[#6e6e73] transition-all hover:bg-neutral-200/80 hover:text-[#1d1d1f] active:scale-95 cursor-pointer whitespace-nowrap text-xs font-medium shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form: Apple-style Rounded Full Bar */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about library borrowing, print rates, doctor shifts, or claim a pass..."
              className="flex-1 rounded-full border border-black/[0.08] bg-white px-4 py-2.5 text-sm text-[#1d1d1f] outline-none transition focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 shadow-xs"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1d1d1f] hover:bg-black text-white shadow-xs transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95 cursor-pointer shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
