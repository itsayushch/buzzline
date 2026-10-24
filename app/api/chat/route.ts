import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { retrieveCampusKnowledge, formatRetrievedContext } from "@/lib/campusKnowledge";
import { Location } from "@/lib/types";

interface ChatRequestPayload {
  message: string;
  history?: Array<{ sender: "user" | "agent"; text: string }>;
  locations?: Location[];
}

// Tool definitions for Groq function calling
const agentTools: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "claimQueueToken",
      description:
        "Issues a digital line token/fast-pass for a campus facility (canteen, library, xerox print hub, admin registrar, clinic, gym).",
      parameters: {
        type: "object",
        properties: {
          locationId: {
            type: "string",
            description: "Facility ID: 'canteen', 'library', 'xerox', 'admin', 'clinic', or 'gym'",
            enum: ["canteen", "library", "xerox", "admin", "clinic", "gym"],
          },
          itemOrPurpose: {
            type: "string",
            description: "The specific item, dish, or purpose (e.g. 'Chole Bhature', 'Print 20 Pages', 'ID Card Renewal')",
          },
          scheduledTime: {
            type: "string",
            description: "Scheduled arrival time (e.g. 'In 15 mins', '2:30 PM')",
          },
        },
        required: ["locationId", "itemOrPurpose"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reserveDesk",
      description:
        "Reserves a study desk, discussion pod, or workspace in the library or campus facilities.",
      parameters: {
        type: "object",
        properties: {
          locationId: {
            type: "string",
            description: "Location ID, typically 'library'",
            enum: ["library", "canteen", "gym"],
          },
          deskLabel: {
            type: "string",
            description: "Desk or pod label (e.g. 'Silent Desk #14', 'Discussion Pod 2')",
          },
          timeSlot: {
            type: "string",
            description: "Time slot or arrival time (e.g. 'In 15 mins', 'Next 2 Hours')",
          },
        },
        required: ["locationId", "deskLabel"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "checkRoomAvailability",
      description: "Checks availability of campus breakout spaces, discussion pods, and seminar rooms.",
      parameters: {
        type: "object",
        properties: {
          building: {
            type: "string",
            description: "Optional building filter (e.g. 'Library', 'Student Center', 'Tech Wing')",
          },
        },
      },
    },
  },
];

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestPayload = await req.json();
    const userMessage = (body.message || "").trim();

    if (!userMessage) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1. RAG STEP: Retrieve relevant campus knowledge base documents
    const retrievedChunks = retrieveCampusKnowledge(userMessage, 3);
    const ragContext = formatRetrievedContext(retrievedChunks);

    // 2. Real-time Live Queues Context (from client Firebase state)
    const liveLocations = body.locations || [];
    const liveQueuesContext =
      liveLocations.length > 0
        ? liveLocations
            .map(
              (l) =>
                `• ${l.name} (${l.id}): ~${l.queueMinutes}m wait, ${l.spotsAvailable ?? 0}/${l.capacity} spots open, rush level: ${l.rushLevel}. Details: ${l.items.join(", ")}`
            )
            .join("\n")
        : "Live facility queues: Canteen (~8m wait), Library (~12m wait, 16 desks free), Print Hub (~15m wait), Admin Registrar (~22m wait), Clinic (~5m wait), Gym (~10m wait).";

    // 3. System Prompt for Groq Llama 3.3
    const systemPrompt = `You are Buzzline Campus AI, an ultra-fast and intelligent campus assistant powered by Groq and RAG.
You help students with real-time queue wait times, meal pre-ordering, digital token issuance, library desk reservations, campus rules, print pricing, clinic availability, and free study rooms.

### RETRIEVED CAMPUS KNOWLEDGE BASE (RAG):
${ragContext}

### REAL-TIME LIVE QUEUE & SPOT STATUS (FIREBASE RTDB):
${liveQueuesContext}

### INSTRUCTIONS:
- Ground your answers in the retrieved campus knowledge and live queue data.
- If the student wants to claim a queue token, pre-order food, or reserve a desk, call the corresponding tool ('claimQueueToken' or 'reserveDesk').
- Be concise, helpful, friendly, and accurate. Mention exact wait times, prices, and room numbers from the retrieved documents.`;

    const groqApiKey = process.env.GROQ_API_KEY;
    const isGroqConfigured =
      groqApiKey &&
      !groqApiKey.includes("your_groq_api_key") &&
      groqApiKey.startsWith("gsk_");

    // 4. GROQ INFERENCE EXECUTION
    if (isGroqConfigured) {
      const groq = new Groq({ apiKey: groqApiKey });

      // Build message array with conversation history
      const formattedHistory: Groq.Chat.Completions.ChatCompletionMessageParam[] = (
        body.history || []
      )
        .slice(-6)
        .map((msg) => ({
          role: msg.sender === "user" ? ("user" as const) : ("assistant" as const),
          content: msg.text,
        }));

      const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...formattedHistory,
        { role: "user", content: userMessage },
      ];

      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages,
        tools: agentTools,
        tool_choice: "auto",
        temperature: 0.3,
        max_tokens: 650,
      });

      const responseMessage = completion.choices[0]?.message;

      // Check if Groq invoked any tool calls
      if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCall = responseMessage.tool_calls[0];
        const fnName = toolCall.function.name;
        let fnArgs: Record<string, unknown> = {};

        try {
          fnArgs = JSON.parse(toolCall.function.arguments);
        } catch {
          fnArgs = {};
        }

        return NextResponse.json({
          reply:
            responseMessage.content ||
            `I've executed the tool: ${fnName} with your requested details!`,
          toolCall: {
            name: fnName,
            args: fnArgs,
          },
          retrievedSources: retrievedChunks.map((c) => ({ id: c.id, title: c.title })),
          poweredBy: "Groq (GPT-OSS 120B + RAG)",
        });
      }

      return NextResponse.json({
        reply:
          responseMessage?.content ||
          "I couldn't process that request. Please try asking again.",
        retrievedSources: retrievedChunks.map((c) => ({ id: c.id, title: c.title })),
        poweredBy: "Groq (GPT-OSS 120B + RAG)",
      });
    }

    // 5. LOCAL RAG FALLBACK (if GROQ_API_KEY is not yet set or during offline testing)
    // Intelligent fallback synthesizing RAG context + live queues + client tools
    const lower = userMessage.toLowerCase();

    // Check for tool calling intent
    let fallbackToolCall: { name: string; args: Record<string, unknown> } | undefined;

    if (
      lower.includes("order") ||
      lower.includes("maggi") ||
      lower.includes("dosa") ||
      lower.includes("coffee") ||
      lower.includes("bhature")
    ) {
      fallbackToolCall = {
        name: "claimQueueToken",
        args: {
          locationId: "canteen",
          itemOrPurpose: lower.includes("maggi")
            ? "Maggi Noodles"
            : lower.includes("dosa")
            ? "Masala Dosa"
            : lower.includes("coffee")
            ? "Cold Coffee"
            : "Chole Bhature",
          scheduledTime: "In 15 mins",
        },
      };
    } else if (
      lower.includes("reserve desk") ||
      lower.includes("book desk") ||
      lower.includes("pod")
    ) {
      fallbackToolCall = {
        name: "reserveDesk",
        args: {
          locationId: "library",
          deskLabel: lower.includes("pod") ? "Discussion Pod 2" : "Silent Desk #14",
          timeSlot: "Next 2 Hours",
        },
      };
    } else if (
      lower.includes("print") &&
      (lower.includes("token") || lower.includes("slot") || lower.includes("reserve"))
    ) {
      fallbackToolCall = {
        name: "claimQueueToken",
        args: {
          locationId: "xerox",
          itemOrPurpose: "Assignment Print Batch",
          scheduledTime: "In 15 mins",
        },
      };
    }

    // Construct response using retrieved RAG documents
    const topChunk = retrievedChunks[0];
    let synthesizedReply = "";

    if (fallbackToolCall) {
      synthesizedReply = `⚡ **Fast-Pass Executed:** I've booked your ticket for **${
        fallbackToolCall.args.itemOrPurpose || fallbackToolCall.args.deskLabel
      }**.\n\nFrom the campus knowledge base (${topChunk?.title}): Online digital token holders skip the physical queue and proceed directly to the express counter.`;
    } else if (topChunk) {
      synthesizedReply = `Here is what I found from the **Campus Knowledge Base** regarding your query:\n\n${topChunk.content}\n\n*Live Queue Update:* Current estimated wait time is live on your Buzzline dashboard.`;
    } else {
      synthesizedReply = `Buzzline AI Agent online! All 6 campus facilities are currently live. How can I help you today?`;
    }

    return NextResponse.json({
      reply: synthesizedReply,
      toolCall: fallbackToolCall,
      retrievedSources: retrievedChunks.map((c) => ({ id: c.id, title: c.title })),
      poweredBy: "Local RAG Engine (Add GROQ_API_KEY in .env.local to activate Groq Llama 3.3)",
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
