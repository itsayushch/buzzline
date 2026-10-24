import { CanteenContextType } from "./canteenContext";
import { CampusService, CanteenStatus, Order, QueueTicket, Room } from "./types";
import { mockRooms } from "./mockData";

export interface ToolCallLog {
  name:
    | "getCanteenStatus"
    | "getCampusQueues"
    | "getServiceQueue"
    | "placeOrderTool"
    | "bookTicketTool"
    | "getRoomAvailability";
  args?: Record<string, unknown>;
  result?: unknown;
}

export interface AgentResponse {
  reply: string;
  toolCall?: ToolCallLog;
}

export interface AgentTools {
  getCanteenStatus: () => CanteenStatus;
  getCampusQueues: () => CampusService[];
  getServiceQueue: (serviceId: string) => CampusService | undefined;
  placeOrderTool: (item: string, pickupTime?: string) => Order;
  bookTicketTool: (
    serviceId: string,
    itemOrPurpose: string,
    scheduledTime?: string
  ) => QueueTicket;
  getRoomAvailability: () => Room[];
}

/**
 * Factory to create campus & canteen agent tools connected to live context.
 */
export function createAgentTools(canteen: CanteenContextType): AgentTools {
  return {
    getCanteenStatus: () => canteen.status,
    getCampusQueues: () => canteen.services,
    getServiceQueue: (serviceId: string) =>
      canteen.services.find((s) => s.id === serviceId),
    placeOrderTool: (item: string, pickupTime: string = "in 15 mins") => {
      return canteen.placeOrder(item, pickupTime);
    },
    bookTicketTool: (
      serviceId: string,
      itemOrPurpose: string,
      scheduledTime: string = "in 15 mins"
    ) => {
      return canteen.bookTicket(serviceId, itemOrPurpose, scheduledTime);
    },
    getRoomAvailability: () => mockRooms,
  };
}

/**
 * Client-side tool calling and intent parser for all campus queues.
 */
export function parseAndExecuteIntent(
  input: string,
  canteen: CanteenContextType
): AgentResponse {
  const tools = createAgentTools(canteen);
  const lower = input.trim().toLowerCase();

  // Helper to extract time if present (e.g. "in 10 mins", "at 2:30", "for 1:15 pm")
  const extractTime = (str: string, fallback: string = "in 15 mins"): string => {
    const match = str.match(
      /\b(in \d+\s*(?:mins?|minutes?)|at \d{1,2}(?::\d{2})?\s*(?:am|pm)?|for \d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i
    );
    return match ? match[0] : fallback;
  };

  // 1. Order or Queue Booking Intent
  const isBookingAction =
    lower.includes("order") ||
    lower.includes("book") ||
    lower.includes("reserve") ||
    lower.includes("get token") ||
    lower.includes("join queue") ||
    lower.includes("print");

  // Check Canteen dishes
  const foundMenuItem = canteen.status.menu.find((dish) =>
    lower.includes(dish.toLowerCase())
  );

  if ((isBookingAction && foundMenuItem) || (lower.startsWith("order ") && foundMenuItem)) {
    const pickupTime = extractTime(input);
    const order = tools.placeOrderTool(foundMenuItem, pickupTime);
    return {
      reply: `I've placed your order for ${foundMenuItem} (${pickupTime})! Order ID is #${order.id}. It is currently pending and will be confirmed in just a couple seconds.`,
      toolCall: {
        name: "placeOrderTool",
        args: { item: foundMenuItem, pickupTime },
        result: order,
      },
    };
  }

  // Check Print / Xerox booking
  if (
    (isBookingAction && (lower.includes("print") || lower.includes("xerox"))) ||
    lower.includes("print pages") ||
    lower.includes("binding")
  ) {
    const time = extractTime(input, "in 10 mins");
    const ticket = tools.bookTicketTool("xerox", "Print & Binding Job", time);
    return {
      reply: `I've reserved your print slot at Campus Print & Xerox Hub (#${ticket.id}, Token #${ticket.tokenNumber}) for ${time}! Skip the walk-in rush.`,
      toolCall: {
        name: "bookTicketTool",
        args: { serviceId: "xerox", itemOrPurpose: "Print & Binding Job", scheduledTime: time },
        result: ticket,
      },
    };
  }

  // Check Library Desk booking
  if (
    isBookingAction &&
    (lower.includes("desk") || lower.includes("library") || lower.includes("pod"))
  ) {
    const time = extractTime(input, "now");
    const ticket = tools.bookTicketTool("library", "Quiet Zone Study Desk", time);
    return {
      reply: `Reserved a study spot for you at Central Library (#${ticket.id}, Desk Token #${ticket.tokenNumber}) for ${time}!`,
      toolCall: {
        name: "bookTicketTool",
        args: { serviceId: "library", itemOrPurpose: "Quiet Zone Study Desk", scheduledTime: time },
        result: ticket,
      },
    };
  }

  // Check Admin / Registrar token
  if (
    isBookingAction &&
    (lower.includes("admin") ||
      lower.includes("id card") ||
      lower.includes("transcript") ||
      lower.includes("fee"))
  ) {
    const purpose = lower.includes("id")
      ? "ID Card Verification"
      : lower.includes("transcript")
      ? "Transcript Attestation"
      : "Student Affairs Clearance";
    const ticket = tools.bookTicketTool("admin", purpose, "In 20 mins");
    return {
      reply: `Generated Admin Token #${ticket.tokenNumber} (Ticket #${ticket.id}) for ${purpose}. Head over in about 20 minutes to skip the physical line!`,
      toolCall: {
        name: "bookTicketTool",
        args: { serviceId: "admin", itemOrPurpose: purpose, scheduledTime: "In 20 mins" },
        result: ticket,
      },
    };
  }

  // 2. Library Queue & Desks Query
  if (
    lower.includes("library") ||
    lower.includes("study desk") ||
    lower.includes("quiet zone") ||
    lower.includes("book borrow")
  ) {
    const lib = tools.getServiceQueue("library");
    const itemsPreview = lib?.items.join("; ") || "Desks available";
    return {
      reply: `Central Library wait is currently ~${lib?.queueMinutes || 12} minutes (${lib?.rushLevel} rush). Status: ${itemsPreview}. Want me to reserve a study desk token?`,
      toolCall: {
        name: "getServiceQueue",
        args: { serviceId: "library" },
        result: lib,
      },
    };
  }

  // 3. Print & Xerox Queue Query
  if (
    lower.includes("xerox") ||
    lower.includes("print shop") ||
    lower.includes("printing") ||
    lower.includes("photocopy") ||
    lower.includes("binding")
  ) {
    const xerox = tools.getServiceQueue("xerox");
    const itemsPreview = xerox?.items.join("; ") || "Machines active";
    return {
      reply: `Campus Print & Xerox Hub has an estimated ~${xerox?.queueMinutes || 15} min wait (${xerox?.rushLevel} rush). Current machines: ${itemsPreview}. Want me to hold a print slot for you?`,
      toolCall: {
        name: "getServiceQueue",
        args: { serviceId: "xerox" },
        result: xerox,
      },
    };
  }

  // 4. Admin / Registrar / Student Affairs Query
  if (
    lower.includes("admin") ||
    lower.includes("registrar") ||
    lower.includes("id card") ||
    lower.includes("transcript") ||
    lower.includes("fees counter") ||
    lower.includes("bonafide")
  ) {
    const admin = tools.getServiceQueue("admin");
    const counters = admin?.items.join("; ") || "Counters open";
    return {
      reply: `Student Affairs & Registrar Office has a ~${admin?.queueMinutes || 22} min wait (${admin?.rushLevel} rush). ${counters}. Would you like a digital queue token?`,
      toolCall: {
        name: "getServiceQueue",
        args: { serviceId: "admin" },
        result: admin,
      },
    };
  }

  // 5. Health Clinic Query
  if (
    lower.includes("clinic") ||
    lower.includes("doctor") ||
    lower.includes("health") ||
    lower.includes("medical") ||
    lower.includes("medicine")
  ) {
    const clinic = tools.getServiceQueue("clinic");
    return {
      reply: `Campus Health Clinic is moving very fast with ~${clinic?.queueMinutes || 5} min wait. Dr. Sharma (OPD) and First Aid are open with minimal wait.`,
      toolCall: {
        name: "getServiceQueue",
        args: { serviceId: "clinic" },
        result: clinic,
      },
    };
  }

  // 6. Gym & Sports Query
  if (
    lower.includes("gym") ||
    lower.includes("workout") ||
    lower.includes("fitness") ||
    lower.includes("badminton") ||
    lower.includes("treadmill")
  ) {
    const gym = tools.getServiceQueue("gym");
    const details = gym?.items.join("; ") || "Open";
    return {
      reply: `University Gym has a ~${gym?.queueMinutes || 10} min wait. Current status: ${details}.`,
      toolCall: {
        name: "getServiceQueue",
        args: { serviceId: "gym" },
        result: gym,
      },
    };
  }

  // 7. Room Availability Query
  if (
    lower.includes("room") ||
    lower.includes("free room") ||
    lower.includes("study pod") ||
    lower.includes("empty room") ||
    lower.includes("classroom") ||
    lower.includes("hall")
  ) {
    const allRooms = tools.getRoomAvailability();
    const freeRooms = allRooms.filter((r) => r.free);
    const primary = freeRooms[0] || allRooms[0];

    let reply = "";
    if (primary && primary.free) {
      reply = `${primary.name} in the ${primary.building} block is free right now — want directions?`;
      if (freeRooms.length > 1) {
        const others = freeRooms
          .slice(1)
          .map((r) => `${r.name} (${r.building})`)
          .join(", ");
        reply += ` (${others} are also available.)`;
      }
    } else {
      reply =
        "All monitored campus rooms are currently occupied. Would you like me to check the library study desks instead?";
    }

    return {
      reply,
      toolCall: {
        name: "getRoomAvailability",
        result: freeRooms,
      },
    };
  }

  // 8. Canteen / Food / Menu Query
  if (
    lower.includes("canteen") ||
    lower.includes("food") ||
    lower.includes("menu") ||
    lower.includes("eat") ||
    lower.includes("snack") ||
    lower.includes("lunch") ||
    lower.includes("coffee")
  ) {
    const status = tools.getCanteenStatus();
    const menuFormatted =
      status.menu.length > 0 ? status.menu.join(", ") : "items";
    return {
      reply: `Central Canteen queue's about ${status.queueMinutes} minutes right now, and today's menu has ${menuFormatted} — want me to place an order?`,
      toolCall: {
        name: "getCanteenStatus",
        result: status,
      },
    };
  }

  // 9. General Queue / Campus Rush summary
  if (
    lower.includes("all queues") ||
    lower.includes("campus") ||
    lower.includes("everywhere") ||
    lower.includes("crowd") ||
    lower.includes("overview")
  ) {
    const services = tools.getCampusQueues();
    const summary = services
      .map((s) => `${s.name}: ~${s.queueMinutes}m (${s.rushLevel})`)
      .join(" | ");
    return {
      reply: `Here is the live campus queue overview: ${summary}. What spot would you like details on?`,
      toolCall: {
        name: "getCampusQueues",
        result: services,
      },
    };
  }

  // 10. Greetings
  if (
    lower === "hi" ||
    lower === "hello" ||
    lower === "hey" ||
    lower.startsWith("hi ") ||
    lower.startsWith("hello ") ||
    lower.startsWith("hey ")
  ) {
    return {
      reply: `Hey! I'm your Buzzline Campus Assistant. I track live queues for the Canteen, Library, Print Shop, Admin Office, Gym, and Clinic, and can check free rooms. Try asking "Print queue?" or "How busy is the library?"!`,
    };
  }

  // 11. General fallback
  const status = tools.getCanteenStatus();
  return {
    reply: `Queue's about ${status.queueMinutes} minutes right now at the canteen, and today's menu has ${status.menu.join(", ")} — want me to check other campus queues like Library or Xerox?`,
    toolCall: {
      name: "getCanteenStatus",
      result: status,
    },
  };
}
