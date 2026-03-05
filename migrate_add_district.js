// ============================================================
// MIGRATION: Add district field to all existing officers
// Also creates district stats docs and Hansi district
// Run ONCE: node migrate_add_district.js
// ============================================================

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
    readFileSync("./serviceAccountKey.json", "utf8")
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function migrate() {
    console.log("🔄 Starting migration...\n");

    // ---- Step 1: Add district field to all officers ----
    console.log("📋 Step 1: Adding 'district' field to all officers...");
    const officersSnap = await db.collection("officers").get();
    const total = officersSnap.size;
    console.log(`   Found ${total} officers`);

    const BATCH_SIZE = 400;
    let updated = 0;
    let batchNum = 1;
    let batch = db.batch();
    let batchCount = 0;

    // Count stats while iterating
    let maleCount = 0;
    let femaleCount = 0;
    const unitsSet = new Set();

    for (const docSnap of officersSnap.docs) {
        const data = docSnap.data();

        // Only update if district not already set
        if (!data.district) {
            batch.update(docSnap.ref, { district: "Hisar" });
        }

        // Count stats
        if (data.gender === "Male") maleCount++;
        if (data.gender === "Female") femaleCount++;
        if (data.unit) unitsSet.add(data.unit);

        batchCount++;
        if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            updated += batchCount;
            console.log(`   ✅ Batch ${batchNum} done — ${updated}/${total}`);
            batch = db.batch();
            batchCount = 0;
            batchNum++;
            await new Promise(r => setTimeout(r, 500));
        }
    }

    // Commit remaining
    if (batchCount > 0) {
        await batch.commit();
        updated += batchCount;
        console.log(`   ✅ Batch ${batchNum} done — ${updated}/${total}`);
    }

    console.log(`   ✅ All ${total} officers tagged with district: "Hisar"\n`);

    // ---- Step 2: Create Hisar district stats doc ----
    console.log("📊 Step 2: Creating Hisar district stats...");
    await db.collection("districts").doc("Hisar").set({
        name: "Hisar",
        stats: {
            total: total,
            male: maleCount,
            female: femaleCount,
            units: unitsSet.size,
        },
        createdAt: new Date().toISOString(),
    });
    console.log(`   ✅ Hisar: ${total} total, ${maleCount} male, ${femaleCount} female, ${unitsSet.size} units\n`);

    // ---- Step 3: Create Hansi district doc ----
    console.log("📊 Step 3: Creating Hansi district entry...");
    await db.collection("districts").doc("Hansi").set({
        name: "Hansi",
        stats: {
            total: 0,
            male: 0,
            female: 0,
            units: 0,
        },
        createdAt: new Date().toISOString(),
    });
    console.log("   ✅ Hansi district created (empty, will be seeded separately)\n");

    console.log("🎉 MIGRATION COMPLETE!");
    console.log("Next steps:");
    console.log("  1. Run: node seed_hansi_test_data.js");
    console.log("  2. Start app: npm run dev");
    process.exit(0);
}

migrate().catch(err => {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
});
