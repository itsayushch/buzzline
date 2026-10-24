"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  Location,
  QueueToken,
  DeskReservation,
  CampusService,
  QueueTicket,
  CanteenStatus,
  Order,
} from "./types";
import {
  initialCampusServices,
  initialCanteenStatus,
  initialOrders,
  initialTokens,
  initialReservations,
  generateTokenId,
  formatCurrentTime,
} from "./mockData";
import { db } from "./firebase";
import { ref, onValue, set, update, push } from "firebase/database";

export interface LocationsContextType {
  // Realtime locations / campus services
  locations: Location[];
  services: CampusService[]; // alias for backward compatibility
  tokens: QueueToken[];
  tickets: QueueTicket[]; // alias for backward compatibility
  reservations: DeskReservation[];
  isFirebaseLive: boolean;

  // Primary API
  updateLocation: (id: string, updates: Partial<Location>) => Promise<void> | void;
  claimToken: (
    locationId: string,
    studentLabelOrItem?: string,
    scheduledTime?: string
  ) => QueueToken;
  reserveDesk: (
    locationId: string,
    deskLabel: string,
    timeSlot?: string
  ) => DeskReservation;

  // Backward compatibility methods & aliases
  updateServiceStatus: (
    serviceId: string,
    updates: Partial<CampusService>
  ) => void;
  bookTicket: (
    serviceId: string,
    itemOrPurpose: string,
    scheduledTime: string
  ) => QueueTicket;
  status: CanteenStatus;
  orders: Order[];
  updateStatus: (newStatus: Partial<CanteenStatus>) => void;
  placeOrder: (item: string, pickupTime: string) => Order;
}

export const LocationsContext = createContext<LocationsContextType | undefined>(
  undefined
);

export function LocationsProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<Location[]>(initialCampusServices);
  const [tokens, setTokens] = useState<QueueToken[]>(initialTokens);
  const [reservations, setReservations] = useState<DeskReservation[]>(
    initialReservations
  );
  const [isFirebaseLive, setIsFirebaseLive] = useState<boolean>(false);

  // Legacy canteen status & order state
  const [status, setStatus] = useState<CanteenStatus>(initialCanteenStatus);
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  // Subscribe to Firebase Realtime Database on mount
  useEffect(() => {
    try {
      const locationsRef = ref(db, "locations");
      const tokensRef = ref(db, "tokens");
      const reservationsRef = ref(db, "reservations");

      // 1. Subscribe to /locations
      const unsubscribeLocations = onValue(
        locationsRef,
        (snapshot) => {
          const val = snapshot.val();
          if (val) {
            const locList: Location[] = Array.isArray(val)
              ? val.filter(Boolean)
              : Object.values(val);

            if (locList.length > 0) {
              setLocations(locList);
              setIsFirebaseLive(true);

              // Update legacy canteen status if canteen exists
              const canteen = locList.find((l) => l.id === "canteen");
              if (canteen) {
                setStatus({
                  queueMinutes: canteen.queueMinutes,
                  menu: canteen.menu || canteen.items,
                  lastUpdated: canteen.lastUpdated,
                });
              }
            }
          }
        },
        (error) => {
          console.warn("Firebase locations onValue error:", error.message);
          setIsFirebaseLive(false);
        }
      );

      // 2. Subscribe to /tokens
      const unsubscribeTokens = onValue(
        tokensRef,
        (snapshot) => {
          const val = snapshot.val();
          if (val) {
            const tokenList: QueueToken[] = Array.isArray(val)
              ? val.filter(Boolean)
              : Object.values(val);
            setTokens(tokenList.reverse());
          } else {
            setTokens([]);
          }
        },
        (error) => {
          console.warn("Firebase tokens onValue error:", error.message);
        }
      );

      // 3. Subscribe to /reservations
      const unsubscribeReservations = onValue(
        reservationsRef,
        (snapshot) => {
          const val = snapshot.val();
          if (val) {
            const resList: DeskReservation[] = Array.isArray(val)
              ? val.filter(Boolean)
              : Object.values(val);
            setReservations(resList.reverse());
          } else {
            setReservations([]);
          }
        },
        (error) => {
          console.warn("Firebase reservations onValue error:", error.message);
        }
      );

      return () => {
        unsubscribeLocations();
        unsubscribeTokens();
        unsubscribeReservations();
      };
    } catch (err) {
      console.warn("Firebase realtime listeners setup failed:", err);
    }
  }, []);

  // Update a location via /locations/{id}
  const updateLocation = async (id: string, updates: Partial<Location>) => {
    const updatedTime = updates.lastUpdated ?? formatCurrentTime();
    const queueMinutes = updates.queueMinutes;
    const rushLevel =
      updates.rushLevel ??
      (queueMinutes !== undefined
        ? queueMinutes <= 5
          ? "Low"
          : queueMinutes <= 15
          ? "Moderate"
          : "High"
        : undefined);

    // Optimistic local state update
    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== id) return loc;
        return {
          ...loc,
          ...updates,
          ...(rushLevel ? { rushLevel } : {}),
          lastUpdated: updatedTime,
        };
      })
    );

    // Legacy canteen sync
    if (id === "canteen") {
      setStatus((prev) => ({
        ...prev,
        queueMinutes: updates.queueMinutes ?? prev.queueMinutes,
        menu: updates.menu ?? updates.items ?? prev.menu,
        lastUpdated: updatedTime,
      }));
    }

    // Write to Firebase /locations/{id} via update()
    try {
      const locRef = ref(db, `locations/${id}`);
      const payload: Record<string, any> = {
        ...updates,
        lastUpdated: updatedTime,
        ...(rushLevel ? { rushLevel } : {}),
      };

      // Strip undefined keys for RTDB compatibility
      Object.keys(payload).forEach(
        (key) => payload[key] === undefined && delete payload[key]
      );

      await update(locRef, payload);
    } catch (e) {
      console.warn(`Firebase update failed for /locations/${id}:`, e);
    }
  };

  // Push new token to /tokens with status "waiting", then update to "called" after 2s
  const claimToken = (
    locationId: string,
    studentLabelOrItem?: string,
    scheduledTime?: string
  ): QueueToken => {
    const targetLoc = locations.find(
      (l) => l.id === locationId || l.category === locationId || l.type === locationId
    );
    const serviceName = targetLoc ? targetLoc.name : "Campus Facility";
    const tokenTime = scheduledTime || "In 15 mins";
    const label = studentLabelOrItem || "Student Token";

    const tokensRef = ref(db, "tokens");
    const newRef = push(tokensRef);
    const tokenId = newRef.key || generateTokenId("TK");

    const newToken: QueueToken = {
      id: tokenId,
      locationId,
      serviceName,
      studentLabel: label,
      itemOrPurpose: label,
      scheduledTime: tokenTime,
      status: "waiting",
      claimedAt: formatCurrentTime(),
      tokenNumber: Math.floor(10 + Math.random() * 90),
    };

    // Optimistic local update
    setTokens((prev) => [newToken, ...prev]);

    // Legacy order tracking for canteen
    if (locationId === "canteen") {
      const orderEntry: Order = {
        id: newToken.id,
        item: label,
        pickupTime: tokenTime,
        status: "pending",
      };
      setOrders((prev) => [orderEntry, ...prev]);
    }

    // Push token to /tokens in Firebase
    set(ref(db, `tokens/${tokenId}`), newToken).catch((e) =>
      console.warn("Firebase token push failed:", e)
    );

    // 2-second client-side timer: transition to "called"
    setTimeout(() => {
      setTokens((prev) =>
        prev.map((t) => (t.id === tokenId ? { ...t, status: "called" } : t))
      );

      if (locationId === "canteen") {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === tokenId ? { ...o, status: "confirmed" } : o
          )
        );
      }

      update(ref(db, `tokens/${tokenId}`), { status: "called" }).catch((e) =>
        console.warn("Firebase token status update failed:", e)
      );
    }, 2000);

    return newToken;
  };

  // Push new reservation to /reservations with status "pending", then update to "confirmed" after 2s
  const reserveDesk = (
    locationId: string,
    deskLabel: string,
    timeSlot?: string
  ): DeskReservation => {
    const reservationsRef = ref(db, "reservations");
    const newRef = push(reservationsRef);
    const reservationId = newRef.key || generateTokenId("RES");
    const slot = timeSlot || "Next Available";

    const newReservation: DeskReservation = {
      id: reservationId,
      locationId,
      deskLabel,
      reservedFor: slot,
      timeSlot: slot,
      status: "pending",
      createdAt: formatCurrentTime(),
    };

    // Optimistic local update
    setReservations((prev) => [newReservation, ...prev]);

    // Push reservation to /reservations in Firebase
    set(ref(db, `reservations/${reservationId}`), newReservation).catch((e) =>
      console.warn("Firebase reservation push failed:", e)
    );

    // 2-second client-side timer: transition to "confirmed"
    setTimeout(() => {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationId ? { ...r, status: "confirmed" } : r
        )
      );

      update(ref(db, `reservations/${reservationId}`), {
        status: "confirmed",
      }).catch((e) =>
        console.warn("Firebase reservation status update failed:", e)
      );
    }, 2000);

    return newReservation;
  };

  // Backward compatibility methods & aliases
  const updateServiceStatus = (
    serviceId: string,
    updates: Partial<CampusService>
  ) => {
    updateLocation(serviceId, updates);
  };

  const bookTicket = (
    serviceId: string,
    itemOrPurpose: string,
    scheduledTime: string
  ): QueueTicket => {
    return claimToken(serviceId, itemOrPurpose, scheduledTime);
  };

  const updateStatus = (newStatus: Partial<CanteenStatus>) => {
    const updatedTime = newStatus.lastUpdated ?? formatCurrentTime();
    setStatus((prev) => ({
      ...prev,
      ...newStatus,
      lastUpdated: updatedTime,
    }));

    updateLocation("canteen", {
      queueMinutes: newStatus.queueMinutes,
      items: newStatus.menu,
      menu: newStatus.menu,
      lastUpdated: updatedTime,
    });
  };

  const placeOrder = (item: string, pickupTime: string): Order => {
    const ticket = claimToken("canteen", item, pickupTime);
    return {
      id: ticket.id,
      item,
      pickupTime,
      status: "pending",
    };
  };

  return (
    <LocationsContext.Provider
      value={{
        locations,
        services: locations,
        tokens,
        tickets: tokens,
        reservations,
        isFirebaseLive,
        updateLocation,
        claimToken,
        reserveDesk,
        updateServiceStatus,
        bookTicket,
        status,
        orders,
        updateStatus,
        placeOrder,
      }}
    >
      {children}
    </LocationsContext.Provider>
  );
}

export function useLocations(): LocationsContextType {
  const context = useContext(LocationsContext);
  if (!context) {
    throw new Error("useLocations must be used within a LocationsProvider");
  }
  return context;
}

// CanteenContext aliases for backward compatibility
export const CanteenContext = LocationsContext;
export const CanteenProvider = LocationsProvider;
export const useCanteen = useLocations;
export type CanteenContextType = LocationsContextType;
