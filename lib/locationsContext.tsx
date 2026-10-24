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
import { firestore, db } from "./firebase";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
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

  // Subscribe to Cloud Firestore & Firebase Realtime Database on mount
  useEffect(() => {
    let unsubFirestoreLoc: (() => void) | undefined;
    let unsubFirestoreTok: (() => void) | undefined;
    let unsubFirestoreRes: (() => void) | undefined;

    // 1. Subscribe to Cloud Firestore collections
    try {
      unsubFirestoreLoc = onSnapshot(
        collection(firestore, "locations"),
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as Location);
            if (list.length > 0) {
              setLocations(list);
              setIsFirebaseLive(true);

              const canteen = list.find((l) => l.id === "canteen");
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
        (err) => {
          console.warn("Firestore locations listener:", err.message);
        }
      );

      unsubFirestoreTok = onSnapshot(
        collection(firestore, "tokens"),
        (snapshot) => {
          const list = snapshot.docs.map((d) => d.data() as QueueToken);
          setTokens(list.reverse());
        },
        (err) => {
          console.warn("Firestore tokens listener:", err.message);
        }
      );

      unsubFirestoreRes = onSnapshot(
        collection(firestore, "reservations"),
        (snapshot) => {
          const list = snapshot.docs.map((d) => d.data() as DeskReservation);
          setReservations(list.reverse());
        },
        (err) => {
          console.warn("Firestore reservations listener:", err.message);
        }
      );
    } catch (e) {
      console.warn("Cloud Firestore initialization notice:", e);
    }

    // 2. Also listen to Realtime Database if configured
    try {
      const locationsRef = ref(db, "locations");
      const unsubRTDB = onValue(
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
            }
          }
        },
        () => {}
      );

      return () => {
        unsubFirestoreLoc?.();
        unsubFirestoreTok?.();
        unsubFirestoreRes?.();
        unsubRTDB();
      };
    } catch {
      return () => {
        unsubFirestoreLoc?.();
        unsubFirestoreTok?.();
        unsubFirestoreRes?.();
      };
    }
  }, []);

  // Update a location via Firestore & Realtime Database
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

    const payload: Record<string, any> = {
      ...updates,
      lastUpdated: updatedTime,
      ...(rushLevel ? { rushLevel } : {}),
    };
    Object.keys(payload).forEach(
      (key) => payload[key] === undefined && delete payload[key]
    );

    // Write to Cloud Firestore
    try {
      await setDoc(doc(firestore, "locations", id), payload, { merge: true });
    } catch (e) {
      console.warn(`Firestore update failed for locations/${id}:`, e);
    }

    // Write to Realtime Database
    try {
      const locRef = ref(db, `locations/${id}`);
      await update(locRef, payload);
    } catch {}
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

    const tokenId = generateTokenId(locationId.substring(0, 3).toUpperCase());

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

    // Write to Cloud Firestore
    setDoc(doc(firestore, "tokens", tokenId), newToken).catch((e) =>
      console.warn("Firestore token push failed:", e)
    );

    // Write to Realtime Database
    try {
      set(ref(db, `tokens/${tokenId}`), newToken).catch(() => {});
    } catch {}

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

      // Update in Cloud Firestore
      updateDoc(doc(firestore, "tokens", tokenId), { status: "called" }).catch(
        (e) => console.warn("Firestore token status update failed:", e)
      );

      // Update in Realtime Database
      try {
        update(ref(db, `tokens/${tokenId}`), { status: "called" }).catch(
          () => {}
        );
      } catch {}
    }, 2000);

    return newToken;
  };

  // Push new reservation to /reservations with status "pending", then update to "confirmed" after 2s
  const reserveDesk = (
    locationId: string,
    deskLabel: string,
    timeSlot?: string
  ): DeskReservation => {
    const reservationId = generateTokenId("RES");
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

    // Write to Cloud Firestore
    setDoc(doc(firestore, "reservations", reservationId), newReservation).catch(
      (e) => console.warn("Firestore reservation push failed:", e)
    );

    // Write to Realtime Database
    try {
      set(ref(db, `reservations/${reservationId}`), newReservation).catch(
        () => {}
      );
    } catch {}

    // 2-second client-side timer: transition to "confirmed"
    setTimeout(() => {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationId ? { ...r, status: "confirmed" } : r
        )
      );

      // Update in Cloud Firestore
      updateDoc(doc(firestore, "reservations", reservationId), {
        status: "confirmed",
      }).catch((e) =>
        console.warn("Firestore reservation status update failed:", e)
      );

      // Update in Realtime Database
      try {
        update(ref(db, `reservations/${reservationId}`), {
          status: "confirmed",
        }).catch(() => {});
      } catch {}
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
