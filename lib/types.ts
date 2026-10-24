export type ServiceCategory =
  | "canteen"
  | "library"
  | "xerox"
  | "admin"
  | "clinic"
  | "gym";

export type CampusService = {
  id: string;
  name: string;
  category: ServiceCategory;
  icon: string;
  location: string;
  queueMinutes: number;
  rushLevel: "Low" | "Moderate" | "High";
  lastUpdated: string;
  detailsLabel: string;
  items: string[];
};

export type QueueTicket = {
  id: string;
  serviceId: string;
  serviceName: string;
  itemOrPurpose: string;
  scheduledTime: string;
  status: "pending" | "confirmed";
  tokenNumber?: number;
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
