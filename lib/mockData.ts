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

export function formatCurrentTime(date: Date = new Date()): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function generateTokenId(prefix: string = "TK"): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export function generateOrderId(): string {
  return generateTokenId("ORD");
}

export const initialCampusServices: Location[] = [
  {
    id: "canteen",
    name: "Central Canteen & Cafeteria",
    type: "canteen",
    category: "canteen",
    icon: "🍲",
    location: "Student Center, Ground Floor",
    queueMinutes: 8,
    capacity: 150,
    spotsAvailable: 42,
    rushLevel: "Moderate",
    lastUpdated: "2:14 PM",
    detailsLabel: "Today's Specials",
    items: ["Chole Bhature", "Dosa", "Maggi", "Cold Coffee", "Veg Sandwich"],
    menu: ["Chole Bhature", "Dosa", "Maggi", "Cold Coffee", "Veg Sandwich"],
  },
  {
    id: "library",
    name: "Central Library & Study Desks",
    type: "library",
    category: "library",
    icon: "📚",
    location: "Main Library Building",
    queueMinutes: 12,
    capacity: 120,
    spotsAvailable: 16,
    rushLevel: "Moderate",
    lastUpdated: "2:10 PM",
    detailsLabel: "Desk & Pod Availability",
    items: [
      "Floor 2 Silent Zone: 16 Desks Free",
      "Discussion Pods: 2 Pods Free",
      "Floor 1 Group Study: 4 Desks Free",
      "Circulation/Borrow Counter: 3 ahead",
    ],
  },
  {
    id: "xerox",
    name: "Campus Print & Xerox Hub",
    type: "print-hub",
    category: "xerox",
    icon: "🖨️",
    location: "Academic Block A, Near Stairs",
    queueMinutes: 15,
    capacity: 25,
    spotsAvailable: 4,
    rushLevel: "High",
    lastUpdated: "2:12 PM",
    detailsLabel: "Machine Status",
    items: [
      "High-Speed B&W: Printing assignment batch",
      "Color LaserJet: 2 jobs in queue",
      "Spiral Binding: Available immediately",
      "Self-Serve Terminal: Free",
    ],
  },
  {
    id: "admin",
    name: "Student Affairs & Registrar Office",
    type: "registrar",
    category: "admin",
    icon: "🏛️",
    location: "Administrative Block, 1st Floor",
    queueMinutes: 22,
    capacity: 60,
    spotsAvailable: 12,
    rushLevel: "High",
    lastUpdated: "2:05 PM",
    detailsLabel: "Counter Status",
    items: [
      "Counter 1 (Fees & Dues): 4 students ahead",
      "Counter 2 (ID Cards & Bonafide): 6 students ahead",
      "Counter 3 (Transcripts & Attestation): 2 students ahead",
      "Counter 4 (Hostel Clearance): Open",
    ],
  },
  {
    id: "clinic",
    name: "Campus Health Clinic",
    type: "clinic",
    category: "clinic",
    icon: "🏥",
    location: "Hostel Zone, Block C Ground Floor",
    queueMinutes: 5,
    capacity: 20,
    spotsAvailable: 8,
    rushLevel: "Low",
    lastUpdated: "2:15 PM",
    detailsLabel: "Doctor Availability",
    items: [
      "General Physician (Dr. Sharma): 1 student waiting",
      "First Aid & Dressing: Immediate",
      "Pharmacy Dispensing: Immediate",
    ],
  },
  {
    id: "gym",
    name: "University Gym & Fitness Arena",
    type: "gym",
    category: "gym",
    icon: "🏋️",
    location: "Sports Complex",
    queueMinutes: 10,
    capacity: 50,
    spotsAvailable: 18,
    rushLevel: "Moderate",
    lastUpdated: "2:08 PM",
    detailsLabel: "Equipment & Court Status",
    items: [
      "Weight Training Rack: Moderate capacity",
      "Treadmills (Cardio): 2 available",
      "Badminton Court 1: Free for walk-in",
      "Locker Rooms: Open",
    ],
  },
];

export const initialCanteenStatus: CanteenStatus = {
  queueMinutes: initialCampusServices[0].queueMinutes,
  menu: initialCampusServices[0].menu || initialCampusServices[0].items,
  lastUpdated: initialCampusServices[0].lastUpdated,
};

export const initialOrders: Order[] = [];
export const initialTickets: QueueTicket[] = [];
export const initialTokens: QueueToken[] = [];
export const initialReservations: DeskReservation[] = [];

export const mockRooms: Room[] = [
  { name: "Room 204", building: "Library", free: true },
  { name: "Discussion Pod 3", building: "Student Center", free: true },
  { name: "Seminar Hall B", building: "Tech Wing", free: false },
  { name: "Conference Room 101", building: "Academic Block", free: false },
  { name: "Study Lounge 2A", building: "Library", free: true },
];

export const rooms = mockRooms;
