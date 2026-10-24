import { db } from "../lib/firebase";
import { ref, set } from "firebase/database";
import { initialCampusServices } from "../lib/mockData";

async function seed() {
  console.log("⚡ [Buzzline] Seeding demo locations to Firebase Realtime Database...\n");

  const databaseUrl =
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "default";
  console.log(`📡 Target Database URL: ${databaseUrl}`);

  // Safety timer to prevent hanging if placeholder / unreachable URL is configured
  const timeoutMs = 8000;
  const timeout = setTimeout(() => {
    console.error(
      `\n⏱️ [Timeout] Unable to reach Firebase at "${databaseUrl}" within ${timeoutMs / 1000}s.`
    );
    console.error(
      "💡 Tip: Ensure your real Firebase configuration is saved in .env.local and Realtime Database rules permit write access."
    );
    process.exit(1);
  }, timeoutMs);

  try {
    for (const service of initialCampusServices) {
      const locRef = ref(db, `locations/${service.id}`);
      await set(locRef, service);
      console.log(`  ✓ Seeded /locations/${service.id} (${service.name})`);
    }

    clearTimeout(timeout);
    console.log(
      `\n🎉 Successfully seeded all ${initialCampusServices.length} demo locations to Firebase Realtime Database!`
    );
    process.exit(0);
  } catch (error) {
    clearTimeout(timeout);
    console.error("❌ Seeding failed with error:", error);
    process.exit(1);
  }
}

seed();
