export interface KnowledgeChunk {
  id: string;
  category: "canteen" | "library" | "print-hub" | "registrar" | "clinic" | "gym" | "rooms" | "general";
  title: string;
  tags: string[];
  content: string;
}

export const campusKnowledgeBase: KnowledgeChunk[] = [
  {
    id: "canteen-hours-menu",
    category: "canteen",
    title: "Central Canteen Hours, Specials & Dietary Policies",
    tags: ["canteen", "food", "cafeteria", "menu", "eat", "lunch", "breakfast", "dinner", "specials", "dietary", "vegan", "vegetarian"],
    content: `Central Canteen & Cafeteria operates daily from 7:30 AM to 10:30 PM.
Today's Popular Menu:
- Chole Bhature ($3.50, freshly fried bhature with spiced chickpea curry)
- Masala Dosa ($3.00, crispy fermented crepe with potato masala & coconut chutney)
- Maggi Noodles ($2.00 regular, $2.50 cheese burst)
- Cold Coffee ($2.00, blended espresso with cold milk; oat milk available on request)
- Grilled Veg Sandwich ($2.50, whole grain bread with fresh garden veggies & mint spread)

Dietary & Allergen Policies:
- 100% dedicated vegetarian prep counter.
- Gluten-free dosas made on separate griddles.
- Vegan options clearly marked on electronic boards.
- Online Buzzline Fast-Pass holders collect food directly from Express Window #3.
Peak rush hours occur during lunch (12:45 PM – 2:00 PM) and evening tea (5:00 PM – 6:15 PM).`,
  },
  {
    id: "library-zones-policies",
    category: "library",
    title: "Central Library Zones, Desk Reservations & Borrowing Rules",
    tags: ["library", "study", "books", "desks", "pods", "silent", "quiet", "hours", "borrow", "fines"],
    content: `Central Library is open 8:00 AM – Midnight on weekdays, and 24/7 during mid-term and final exam weeks.
Study Zones:
- Floor 1: Collaborative group study tables & discussion booths (talking & group discussions permitted).
- Floor 2: Strict Silent Study Zone with 120 individual partitioned desks equipped with power outlets & reading lamps.
- Discussion Pods (Pods 1–4): Soundproof pods equipped with 55" 4K presentation screens & whiteboards, bookable in 2-hour blocks via Buzzline.

Borrowing Policies:
- Undergraduates: Up to 5 books for 14 days.
- Graduate students / Researchers: Up to 10 books for 30 days.
- Overdue fee: $0.50 per day per book.
- Food & open drinks are prohibited on Floor 2; closed water tumblers are allowed.`,
  },
  {
    id: "print-hub-services-pricing",
    category: "print-hub",
    title: "Campus Print & Xerox Hub Services, Pricing & Queue Fast-Pass",
    tags: ["print", "xerox", "photocopy", "binding", "pricing", "cost", "plotter", "spiral", "laminating"],
    content: `Campus Print & Xerox Hub is located in Academic Block A, Ground Floor near the central stairs.
Operating Hours: Monday – Saturday, 8:00 AM – 9:00 PM (Closed Sundays).

Services & Pricing:
- High-Speed B&W Double-Sided: $0.05 per page (Batch discounts for >100 pages).
- Full-Color Laser Prints: $0.25 per page (Premium 100gsm bond paper).
- Architectural & Engineering Plotting: $4.00 per A1 sheet / $7.00 per A0 sheet.
- Spiral / Comb Binding: $1.50 per book (includes clear PVC cover & black cardstock back).
- Hardcover Project Binding with Gold Foil: $8.00 (Ready in 3 hours).
- Self-Serve USB Terminal: Free terminal access for quick 1-5 page print jobs.
Fast-Pass Policy: Buzzline digital token holders can submit assignments via the portal and collect printed & bound copies from Tray #2 without waiting in line.`,
  },
  {
    id: "registrar-office-counters",
    category: "registrar",
    title: "Student Affairs & Registrar Office Counter Allocations & Timings",
    tags: ["admin", "registrar", "fees", "id card", "transcript", "bonafide", "hostel", "clearance", "dues", "scholarship"],
    content: `Student Affairs & Registrar Office is located in Administrative Block, 1st Floor.
Operating Hours: Monday – Friday, 9:00 AM – 5:00 PM (Counter ticket issuance closes at 4:30 PM).

Counter Breakdown:
- Counter 1 (Fees & Dues): Semester tuition payments, fine waivers, scholarship disbursements, and fee receipts.
- Counter 2 (ID Cards & Bonafide): Replacement student ID cards ($5 fee), bonafide student status certificates, bus/railway concession forms.
- Counter 3 (Transcripts & Attestation): Official semester transcripts, degree certificates, migration certificates, and embassy attestations (Standard processing: 48 business hours).
- Counter 4 (Hostel & Clearance): Semester hostel room allocation, semester no-dues clearance forms, and sports quota verification.
Tokens can be pre-booked on Buzzline to get notified 15 minutes before your token is called.`,
  },
  {
    id: "clinic-services-emergency",
    category: "clinic",
    title: "Campus Health Clinic Services, Doctors & Emergency Protocols",
    tags: ["clinic", "health", "doctor", "medical", "first aid", "medicine", "emergency", "ambulance", "pharmacy", "sick"],
    content: `Campus Health Clinic is situated at Hostel Zone, Block C Ground Floor.
Hours: 24/7 Emergency Triage & First Aid. Outpatient Physician Consultations: 8:30 AM – 7:30 PM daily.

Staff & Doctors:
- Dr. Sharma (General Physician): Morning shift (8:30 AM – 2:00 PM).
- Dr. Patel (Internal Medicine & Sports Health): Evening shift (2:30 PM – 7:30 PM).
- Resident Nursing Staff on duty 24/7.

Available Services:
- Walk-in consultations and prescription issuance (No charges for enrolled students).
- Immediate dressing, minor wound stitching, and tetanus toxoid administration.
- Free basic OTC pharmacy dispensary (Pain relievers, antacids, ORS, anti-allergy, cough syrups).
- In-house rapid antigen tests, blood glucose testing, and nebulization.
- Ambulance Dispatch: For acute emergencies, call internal campus extension 2222 or 911 directly.`,
  },
  {
    id: "gym-sports-complex",
    category: "gym",
    title: "University Gym & Sports Complex Rules, Equipment & Timings",
    tags: ["gym", "fitness", "workout", "sports", "badminton", "cardio", "treadmill", "lockers", "weights"],
    content: `University Gym & Fitness Arena is inside the Sports Complex Building.
Operating Hours:
- Monday – Saturday: 6:00 AM – 10:00 PM (Separate women-only cardio slot from 10:00 AM – 11:30 AM).
- Sunday: 8:00 AM – 2:00 PM.

Facilities & Equipment:
- Olympic Free Weight Area: Squat racks, flat/incline Olympic benches, dumbells up to 50kg.
- Cardio Zone: 12 Commercial LifeFitness treadmills, 6 cross-trainers, 4 rowing machines.
- Court Facilities: 2 indoor wooden badminton courts (walk-in or bookable via Buzzline).
- Amenities: Men's & Women's locker rooms with hot showers. Locker keys issued against physical Student ID card.
Dress Code: Clean, non-marking athletic shoes and sweat towels are strictly enforced.`,
  },
  {
    id: "rooms-availability-study",
    category: "rooms",
    title: "Walk-in & Bookable Campus Study Rooms & Breakout Lounges",
    tags: ["rooms", "pod", "seminar", "lounge", "study", "meeting", "conference", "space"],
    content: `Free Study Rooms & Breakout Spaces across campus:
1. Room 204: Library 2nd Floor (12 seats, dry-erase whiteboard, available for walk-in students).
2. Discussion Pod 3: Student Center (6 seats, 55" HDMI monitor, soundproof, bookable on Buzzline).
3. Study Lounge 2A: Library 2nd Floor (Open study lounge with comfy sofas and individual charging stations, walk-in).
4. Seminar Hall B: Tech Wing (120 seats, projection screen, reserved for academic lectures & events).
5. Conference Room 101: Academic Block (Reserved for faculty and committee meetings).`,
  },
];

/**
 * Lightweight BM25-style keyword and semantic token retrieval engine.
 */
export function retrieveCampusKnowledge(query: string, topK: number = 3): KnowledgeChunk[] {
  const normalizedQuery = query.toLowerCase();
  const queryTokens = normalizedQuery
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (queryTokens.length === 0) {
    return campusKnowledgeBase.slice(0, topK);
  }

  const scored = campusKnowledgeBase.map((chunk) => {
    let score = 0;
    const chunkTitle = chunk.title.toLowerCase();
    const chunkCategory = chunk.category.toLowerCase();
    const chunkContent = chunk.content.toLowerCase();
    const chunkTags = chunk.tags.map((t) => t.toLowerCase());

    for (const token of queryTokens) {
      // Direct category match: high boost
      if (chunkCategory.includes(token)) score += 8;

      // Tag match: strong boost
      if (chunkTags.some((tag) => tag.includes(token))) score += 5;

      // Title match: moderate boost
      if (chunkTitle.includes(token)) score += 4;

      // Content match: frequency count
      const occurrences = (chunkContent.match(new RegExp(token, "g")) || []).length;
      score += Math.min(occurrences, 4);
    }

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored
    .filter((item) => item.score > 0)
    .slice(0, topK)
    .map((item) => item.chunk);
}

/**
 * Format retrieved knowledge chunks into structured markdown for LLM prompt context.
 */
export function formatRetrievedContext(chunks: KnowledgeChunk[]): string {
  if (chunks.length === 0) return "No specific knowledge base documents retrieved.";

  return chunks
    .map(
      (c, idx) =>
        `### [Source ${idx + 1}: ${c.title}]\nCategory: ${c.category}\n${c.content}`
    )
    .join("\n\n");
}
