// ============================================================
// HISAR POLICE DATA UPLOAD SCRIPT
// Run this ONCE to upload all officers from Excel to Firebase
// Command: node upload_data.js
// ============================================================

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "module";
import { readFileSync } from "fs";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx"); // ✅ Fix: load xlsx via require (avoids ESM issue)

// ---- Load Firebase Admin ----
const serviceAccount = JSON.parse(
  readFileSync("./serviceAccountKey.json", "utf8")
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ---- Load Excel File ----
console.log("📂 Reading Data.xlsx...");
const workbook = XLSX.readFile("./Data.xlsx");
const sheet = workbook.Sheets["Data_Master"];

if (!sheet) {
  console.error("❌ Could not find sheet named 'Data_Master' in Data.xlsx");
  process.exit(1);
}

const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
console.log(`✅ Found ${rows.length} rows in Data_Master`);

// ---- Map Excel columns to app fields ----
function mapRow(row) {
  // Helper to clean values
  const clean = (v) => {
    if (v === null || v === undefined) return "";
    if (typeof v === "number") return String(v);
    if (v instanceof Date) return v.toISOString().split("T")[0];
    return String(v).trim();
  };

  // Handle dates stored as Excel serial numbers
  const excelDate = (v) => {
    if (!v) return "";
    if (v instanceof Date) return v.toISOString().split("T")[0];
    if (typeof v === "number") {
      // Excel date serial to JS date
      const d = new Date(Math.round((v - 25569) * 86400 * 1000));
      return d.toISOString().split("T")[0];
    }
    return clean(v);
  };

  return {
    // Basic Info
    name:               clean(row["NAME"] || row["Name"] || row["name"]),
    badgeNo:            clean(row["NO."] || row["No."] || row["Badge No"]),
    mobile:             clean(row["Mobile No"] || row["Mobile"]),
    rank:               clean(row["Rank"] || row["RANK"]),
    gender:             clean(row["Gender"] || row["GENDER"]),
    fatherName:         clean(row["Father's Name"] || row["Fathers Name"]),

    // Personal
    religion:           clean(row["Religion"]),
    caste:              clean(row["Caste"] || row["CASTE"]),
    category:           clean(row["Cat. "] || row["Cat."] || row["Category"]),
    cadre:              clean(row["Cadre"]),
    permanentTemporary: clean(row["Permanent/ Temporary"] || row["Permanent/Temporary"]),

    // Dates
    dob:  excelDate(row["D.O.B"] || row["DOB"]),
    doe:  excelDate(row["D.O.E"] || row["DOE"]),
    dor:  excelDate(row["D.O.R"] || row["DOR"]),
    dop:  excelDate(row["DOP"]),

    // Education
    education: clean(row["Graduation or Below"] || row["Education"]),
    subject:   clean(row["Subject"] || row["Subject1"]),
    postGrad:  clean(row["Post Graduation and above"] || row["Post Graduation"]),
    subject2:  clean(row["Subject2"]),

    // Location
    village:      clean(row["Village"]),
    ps:           clean(row["PS"]),
    homeDistrict: clean(row["Home District"]),

    // Posting
    typeOfUnit: clean(row["Type of Unit"]),
    unit:       clean(row["Unit"]),
    subUnit:    clean(row["Sub_Unit"] || row["Sub Unit"]),
    role1:      clean(row["Role_1"] || row["Role 1"]),
    role2:      clean(row["Role_2"] || row["Role 2"]),
    io:         clean(row["IO (Yes/No)"] || row["IO"]),

    // Other
    remarks:    clean(row["Remarks"]),
    swatCourse: clean(row["SWAT/AWT COURSE"] || row["Swat Course"]),

    // Metadata
    createdAt: new Date().toISOString(),
    uploadedFromExcel: true,
  };
}

// ---- Upload to Firebase in batches ----
async function upload() {
  const officers = rows
    .map(mapRow)
    .filter(o => o.name && o.name !== ""); // skip empty rows

  console.log(`📤 Uploading ${officers.length} officers to Firebase...`);
  console.log("⏳ This may take 2-5 minutes for 2800+ records...\n");

  // Firebase allows max 500 writes per batch
  const BATCH_SIZE = 400;
  let uploaded = 0;
  let batchNum = 1;

  for (let i = 0; i < officers.length; i += BATCH_SIZE) {
    const chunk = officers.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    chunk.forEach(officer => {
      const ref = db.collection("officers").doc(); // auto ID
      batch.set(ref, officer);
    });

    await batch.commit();
    uploaded += chunk.length;
    console.log(`✅ Batch ${batchNum} done — ${uploaded}/${officers.length} uploaded`);
    batchNum++;

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < officers.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log("\n🎉 UPLOAD COMPLETE!");
  console.log(`✅ Total officers uploaded: ${uploaded}`);
  console.log("👉 Open your app and check the Officers section.");
  process.exit(0);
}

upload().catch(err => {
  console.error("❌ Upload failed:", err.message);
  process.exit(1);
});