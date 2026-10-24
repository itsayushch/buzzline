import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { LocationsProvider } from "@/lib/locationsContext";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Buzzline - Campus Real-Time Queue & Fast-Pass Hub",
  description:
    "Real-time campus queue wait times, digital tokens, and study desk reservations across canteens, libraries, print hubs, registrar desks, clinics, and gyms.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-amber-100 selection:text-amber-900">
        <LocationsProvider>
          <Navbar />
          {children}
        </LocationsProvider>
      </body>
    </html>
  );
}
