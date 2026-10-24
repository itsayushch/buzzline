import { LocationsContextType } from "./locationsContext";
import {
  CampusService,
  CanteenStatus,
  DeskReservation,
  Location,
  Order,
  QueueTicket,
  QueueToken,
  Room,
} from "./types";
import { mockRooms } from "./mockData";

export interface ToolCallLog {
  name:
    | "getLocationStatus"
    | "claimQueueToken"
    | "reserveSpot"
    | "listAllLocations"
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
  // New primary agent tools
  getLocationStatus: (locationId: string) => Location | undefined;
  listAllLocations: () => Location[];
  claimQueueToken: (
    locationId: string,
    studentLabel?: string,
    scheduledTime?: string
  ) => QueueToken;
  reserveSpot: (
    locationId: string,
    deskLabel: string,
    reservedFor?: string
  ) => DeskReservation;

  // Legacy/canteen tools for backward compatibility
  getCanteenStatus: () => CanteenStatus;
  getCampusQueues: () => Location[];
  getServiceQueue: (serviceId: string) => Location | undefined;
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
export function createAgentTools(ctx: LocationsContextType): AgentTools {
  const findLoc = (id: string): Location | undefined =>
    ctx.locations.find(
      (l) =>
        l.id.toLowerCase() === id.toLowerCase() ||
        l.category.toLowerCase() === id.toLowerCase() ||
        l.type.toLowerCase() === id.toLowerCase()
    );

  return {
    // Primary agent tools
    getLocationStatus: (locationId: string) => findLoc(locationId),
    listAllLocations: () => ctx.locations,
    claimQueueToken: (
      locationId: string,
      studentLabel: string = "Student",
      scheduledTime: string = "In 15 mins"
    ) => ctx.claimToken(locationId, studentLabel, scheduledTime),
    reserveSpot: (
      locationId: string,
      deskLabel: string,
      reservedFor: string = "Student"
    ) => ctx.reserveDesk(locationId, deskLabel, reservedFor),

    // Backward compatibility methods
    getCanteenStatus: () => ctx.status,
    getCampusQueues: () => ctx.locations,
    getServiceQueue: (serviceId: string) => findLoc(serviceId),
    placeOrderTool: (item: string, pickupTime: string = "in 15 mins") =>
      ctx.placeOrder(item, pickupTime),
    bookTicketTool: (
      serviceId: string,
      itemOrPurpose: string,
      scheduledTime: string = "in 15 mins"
    ) => ctx.claimToken(serviceId, itemOrPurpose, scheduledTime),
    getRoomAvailability: () => mockRooms,
  };
}

/**
 * Client-side tool calling and intent parser for all campus queues.
 */
export function parseAndExecuteIntent(
  input: string,
  context: LocationsContextType
): AgentResponse {
  const tools = createAgentTools(context);
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
  const canteenLoc = tools.getLocationStatus("canteen");
  const menuList = canteenLoc?.menu || canteenLoc?.items || [];
  const foundMenuItem = menuList.find((dish) =>
    lower.includes(dish.toLowerCase())
  );

  if (
    (isBookingAction && foundMenuItem) ||
    (lower.startsWith("order ") && foundMenuItem)
  ) {
    const pickupTime = extractTime(input);
    const token = tools.claimQueueToken("canteen", foundMenuItem, pickupTime);
    return {
      reply: `I've placed your order for ${foundMenuItem} (${pickupTime})! Token #${token.tokenNumber} (ID: #${token.id}). It is currently pending and will confirm in 2 seconds.`,
      toolCall: {
        name: "claimQueueToken",
        args: { locationId: "canteen", studentLabel: foundMenuItem, scheduledTime: pickupTime },
        result: token,
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
    const token = tools.claimQueueToken("xerox", "Print & Binding Job", time);
    return {
      reply: `I've reserved your print slot at Campus Print & Xerox Hub (#${token.id}, Token #${token.tokenNumber}) for ${time}! Skip the walk-in rush.`,
      toolCall: {
        name: "claimQueueToken",
        args: { locationId: "print-hub", studentLabel: "Print & Binding Job", scheduledTime: time },
        result: token,
      },
    };
  }

  // Check Library Desk booking
  if (
    isBookingAction &&
    (lower.includes("desk") || lower.includes("library") || lower.includes("pod"))
  ) {
    const time = extractTime(input, "now");
    const reservation = tools.reserveSpot(
      "library",
      "Floor 2 Silent Desk #14",
      "Student"
    );
    return {
      reply: `Reserved a study spot for you at Central Library (${reservation.deskLabel}, Pass #${reservation.id})!`,
      toolCall: {
        name: "reserveSpot",
        args: {
          locationId: "library",
          deskLabel: "Floor 2 Silent Desk #14",
          reservedFor: "Student",
        },
        result: reservation,
      },
    };
  }

  // Check Admin / Registrar token
  if (
    isBookingAction &&
    (lower.includes("admin") ||
      lower.includes("id card") ||
      lower.includes("transcript") ||
      lower.includes("fee") ||
      lower.includes("registrar"))
  ) {
    const purpose = lower.includes("id")
      ? "ID Card Verification"
      : lower.includes("transcript")
      ? "Transcript Attestation"
      : "Student Affairs Clearance";
    const token = tools.claimQueueToken("admin", purpose, "In 20 mins");
    return {
      reply: `Generated Admin Token #${token.tokenNumber} (Ticket #${token.id}) for ${purpose}. Head over in about 20 minutes to skip the physical line!`,
      toolCall: {
        name: "claimQueueToken",
        args: { locationId: "registrar", studentLabel: purpose, scheduledTime: "In 20 mins" },
        result: token,
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
    const lib = tools.getLocationStatus("library");
    const itemsPreview = lib?.items.join("; ") || "Desks available";
    return {
      reply: `Central Library wait is currently ~${lib?.queueMinutes || 12} minutes (${lib?.rushLevel} rush, ${lib?.spotsAvailable || 16} free desks). Status: ${itemsPreview}. Want me to reserve a study desk token?`,
      toolCall: {
        name: "getLocationStatus",
        args: { locationId: "library" },
        result: lib,
      },
    };
  }

  // 3. Print & Xerox Queue Query
  if (
    lower.includes("xerox") ||
    lower.includes("print") ||
    lower.includes("photocopy") ||
    lower.includes("binding")
  ) {
    const xerox = tools.getLocationStatus("xerox");
    const itemsPreview = xerox?.items.join("; ") || "Machines active";
    return {
      reply: `Campus Print & Xerox Hub has an estimated ~${xerox?.queueMinutes || 15} min wait (${xerox?.rushLevel} rush). Current machines: ${itemsPreview}. Want me to hold a print slot for you?`,
      toolCall: {
        name: "getLocationStatus",
        args: { locationId: "print-hub" },
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
    const admin = tools.getLocationStatus("admin");
    const counters = admin?.items.join("; ") || "Counters open";
    return {
      reply: `Student Affairs & Registrar Office has a ~${admin?.queueMinutes || 22} min wait (${admin?.rushLevel} rush). ${counters}. Would you like a digital queue token?`,
      toolCall: {
        name: "getLocationStatus",
        args: { locationId: "registrar" },
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
    const clinic = tools.getLocationStatus("clinic");
    return {
      reply: `Campus Health Clinic is moving very fast with ~${clinic?.queueMinutes || 5} min wait. Dr. Sharma (OPD) and First Aid are open with minimal wait.`,
      toolCall: {
        name: "getLocationStatus",
        args: { locationId: "clinic" },
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
    const gym = tools.getLocationStatus("gym");
    const details = gym?.items.join("; ") || "Open";
    return {
      reply: `University Gym has a ~${gym?.queueMinutes || 10} min wait. Current status: ${details}.`,
      toolCall: {
        name: "getLocationStatus",
        args: { locationId: "gym" },
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
    const canteen = tools.getLocationStatus("canteen");
    const menuFormatted = (canteen?.menu || canteen?.items || []).join(", ");
    return {
      reply: `Central Canteen queue's about ${canteen?.queueMinutes || 8} minutes right now, and today's menu has ${menuFormatted} — want me to place an order?`,
      toolCall: {
        name: "getLocationStatus",
        args: { locationId: "canteen" },
        result: canteen,
      },
    };
  }

  // 9. General Queue / Campus Rush summary
  if (
    lower.includes("all queues") ||
    lower.includes("campus") ||
    lower.includes("everywhere") ||
    lower.includes("crowd") ||
    lower.includes("overview") ||
    lower.includes("spots") ||
    lower.includes("list")
  ) {
    const all = tools.listAllLocations();
    const summary = all
      .map((s) => `${s.name}: ~${s.queueMinutes}m (${s.rushLevel})`)
      .join(" | ");
    return {
      reply: `Here is the live campus queue overview: ${summary}. What spot would you like details on?`,
      toolCall: {
        name: "listAllLocations",
        result: all,
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
  const canteen = tools.getLocationStatus("canteen");
  return {
    reply: `Queue's about ${canteen?.queueMinutes || 8} minutes right now at the canteen, and today's menu has ${(canteen?.menu || canteen?.items || []).join(", ")} — want me to check other campus queues like Library or Xerox?`,
    toolCall: {
      name: "getLocationStatus",
      args: { locationId: "canteen" },
      result: canteen,
    },
  };
}
