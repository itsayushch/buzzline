"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { CampusService, CanteenStatus, Order, QueueTicket } from "./types";
import {
  initialCampusServices,
  initialCanteenStatus,
  initialOrders,
  initialTickets,
  generateTokenId,
  formatCurrentTime,
} from "./mockData";

export interface CanteenContextType {
  // Campus-wide services & state
  services: CampusService[];
  tickets: QueueTicket[];
  updateServiceStatus: (
    serviceId: string,
    updates: Partial<CampusService>
  ) => void;
  bookTicket: (
    serviceId: string,
    itemOrPurpose: string,
    scheduledTime: string
  ) => QueueTicket;

  // Legacy Canteen-specific properties
  status: CanteenStatus;
  orders: Order[];
  updateStatus: (newStatus: Partial<CanteenStatus>) => void;
  placeOrder: (item: string, pickupTime: string) => Order;
}

export const CanteenContext = createContext<CanteenContextType | undefined>(
  undefined
);

export function CanteenProvider({ children }: { children: ReactNode }) {
  const [services, setServices] =
    useState<CampusService[]>(initialCampusServices);
  const [tickets, setTickets] = useState<QueueTicket[]>(initialTickets);
  const [status, setStatus] = useState<CanteenStatus>(initialCanteenStatus);
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  // Update any campus service by ID
  const updateServiceStatus = (
    serviceId: string,
    updates: Partial<CampusService>
  ) => {
    const updatedTime = updates.lastUpdated ?? formatCurrentTime();

    setServices((prev) =>
      prev.map((service) => {
        if (service.id !== serviceId) return service;
        const queueMinutes = updates.queueMinutes ?? service.queueMinutes;
        const rushLevel =
          updates.rushLevel ??
          (queueMinutes <= 5 ? "Low" : queueMinutes <= 15 ? "Moderate" : "High");

        return {
          ...service,
          ...updates,
          rushLevel,
          lastUpdated: updatedTime,
        };
      })
    );

    // If updating the canteen, also keep legacy canteen status synchronized
    if (serviceId === "canteen") {
      setStatus((prev) => ({
        ...prev,
        queueMinutes: updates.queueMinutes ?? prev.queueMinutes,
        menu: updates.items ?? prev.menu,
        lastUpdated: updatedTime,
      }));
    }
  };

  // Legacy Canteen updateStatus
  const updateStatus = (newStatus: Partial<CanteenStatus>) => {
    const updatedTime = newStatus.lastUpdated ?? formatCurrentTime();
    setStatus((prev) => ({
      ...prev,
      ...newStatus,
      lastUpdated: updatedTime,
    }));

    setServices((prev) =>
      prev.map((service) =>
        service.id === "canteen"
          ? {
              ...service,
              queueMinutes: newStatus.queueMinutes ?? service.queueMinutes,
              items: newStatus.menu ?? service.items,
              lastUpdated: updatedTime,
              rushLevel:
                (newStatus.queueMinutes ?? service.queueMinutes) <= 5
                  ? "Low"
                  : (newStatus.queueMinutes ?? service.queueMinutes) <= 15
                  ? "Moderate"
                  : "High",
            }
          : service
      )
    );
  };

  // Campus-wide ticket / slot booking with 2s live state transition
  const bookTicket = (
    serviceId: string,
    itemOrPurpose: string,
    scheduledTime: string
  ): QueueTicket => {
    const targetService = services.find((s) => s.id === serviceId);
    const serviceName = targetService ? targetService.name : "Campus Desk";
    const prefix = serviceId.substring(0, 3).toUpperCase();

    const newTicket: QueueTicket = {
      id: generateTokenId(prefix),
      serviceId,
      serviceName,
      itemOrPurpose,
      scheduledTime: scheduledTime || "In 15 mins",
      status: "pending",
      tokenNumber: Math.floor(10 + Math.random() * 90),
    };

    setTickets((prev) => [newTicket, ...prev]);

    // Also sync to legacy orders if it's the canteen
    if (serviceId === "canteen") {
      const orderEntry: Order = {
        id: newTicket.id,
        item: itemOrPurpose,
        pickupTime: scheduledTime || "In 15 mins",
        status: "pending",
      };
      setOrders((prev) => [orderEntry, ...prev]);
    }

    // Live status flip after 2 seconds
    setTimeout(() => {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === newTicket.id ? { ...t, status: "confirmed" } : t
        )
      );

      if (serviceId === "canteen") {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === newTicket.id ? { ...o, status: "confirmed" } : o
          )
        );
      }
    }, 2000);

    return newTicket;
  };

  // Legacy placeOrder wrapper
  const placeOrder = (item: string, pickupTime: string): Order => {
    const ticket = bookTicket("canteen", item, pickupTime);
    return {
      id: ticket.id,
      item,
      pickupTime,
      status: "pending",
    };
  };

  return (
    <CanteenContext.Provider
      value={{
        services,
        tickets,
        updateServiceStatus,
        bookTicket,
        status,
        orders,
        updateStatus,
        placeOrder,
      }}
    >
      {children}
    </CanteenContext.Provider>
  );
}

export function useCanteen(): CanteenContextType {
  const context = useContext(CanteenContext);
  if (!context) {
    throw new Error("useCanteen must be used within a CanteenProvider");
  }
  return context;
}
