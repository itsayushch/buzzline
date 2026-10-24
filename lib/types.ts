export type LocationType =
  | "canteen"
  | "library"
  | "print-hub"
  | "registrar"
  | "clinic"
  | "gym";

export type ServiceCategory =
  | "canteen"
  | "library"
  | "xerox"
  | "admin"
  | "clinic"
  | "gym"
  | "print-hub"
  | "registrar";

export type RushLevel = "Low" | "Moderate" | "High";

export type Location = {
  id: string;
  name: string;
  type: LocationType;
  category: ServiceCategory;
  queueMinutes: number;
  capacity: number;
  spotsAvailable: number;
  rushLevel: RushLevel;
  lastUpdated: string;
  icon: string;
  location: string;
  detailsLabel: string;
  items: string[];
  menu?: string[];
};

// CampusService is an alias/superset of Location for full backward compatibility
export type CampusService = Location;

export type QueueTokenStatus =
  | "waiting"
  | "called"
  | "completed"
  | "pending"
  | "confirmed";

export type QueueToken = {
  id: string;
  locationId: string;
  studentLabel?: string;
  serviceName?: string;
  itemOrPurpose?: string;
  scheduledTime?: string;
  status: QueueTokenStatus;
  claimedAt?: string;
  tokenNumber?: number;
};

// QueueTicket is an alias of QueueToken for full backward compatibility
export type QueueTicket = QueueToken;

export type DeskReservation = {
  id: string;
  locationId: string;
  deskLabel: string;
  reservedFor: string;
  timeSlot?: string;
  status: "pending" | "confirmed";
  createdAt?: string;
};

// Legacy Canteen aliases for backward compatibility
export type CanteenStatus = {
  queueMinutes: number;
  menu: string[];
  lastUpdated: string;
};

export type Order = {
  id: string;
  item: string;
  pickupTime: string;
  status: "pending" | "confirmed";
};

export type Room = {
  name: string;
  building: string;
  free: boolean;
};
