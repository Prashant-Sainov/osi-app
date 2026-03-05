// ============================================================
// SEED: Add 5 test police personnel for Hansi district
// Run: node seed_hansi_test_data.js
// ============================================================

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
    readFileSync("./serviceAccountKey.json", "utf8")
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const testOfficers = [
    {
        name: "Rajesh Kumar",
        badgeNo: "101/HNS",
        mobile: "9876543201",
        rank: "Insp",
        gender: "Male",
        fatherName: "Suresh Kumar",
        religion: "HINDU",
        caste: "JAT",
        category: "GEN",
        cadre: "e. General",
        permanentTemporary: "Permanent (With Order)",
        dob: "1985-03-15",
        doe: "2008-06-20",
        dor: "2045-03-31",
        dop: "2024-01-10",
        education: "BA",
        subject: "Hindi",
        postGrad: "",
        subject2: "",
        village: "Barwala",
        ps: "PS HANSI CITY",
        homeDistrict: "Hisar",
        typeOfUnit: "1. Police Stations",
        unit: "PS HANSI CITY",
        subUnit: "",
        role1: "A. Inv Wing (Male)",
        role2: "SHO",
        io: "Yes",
        remarks: "Test record for Hansi district",
        swatCourse: "",
        district: "Hansi",
        createdAt: new Date().toISOString(),
        uploadedFromExcel: false,
    },
    {
        name: "Sunita Devi",
        badgeNo: "102/HNS",
        mobile: "9876543202",
        rank: "SI",
        gender: "Female",
        fatherName: "Rampal Singh",
        religion: "HINDU",
        caste: "YADAV",
        category: "GEN",
        cadre: "e. General",
        permanentTemporary: "Permanent (With Order)",
        dob: "1990-07-22",
        doe: "2012-09-15",
        dor: "2050-07-31",
        dop: "2024-03-01",
        education: "MA",
        subject: "Sociology",
        postGrad: "MA",
        subject2: "Sociology",
        village: "Hansi",
        ps: "PS HANSI CITY",
        homeDistrict: "Hisar",
        typeOfUnit: "1. Police Stations",
        unit: "PS HANSI CITY",
        subUnit: "",
        role1: "B. Inv Wing (Female)",
        role2: "",
        io: "Yes",
        remarks: "Test record for Hansi district",
        swatCourse: "",
        district: "Hansi",
        createdAt: new Date().toISOString(),
        uploadedFromExcel: false,
    },
    {
        name: "Vikram Singh",
        badgeNo: "103/HNS",
        mobile: "9876543203",
        rank: "HC",
        gender: "Male",
        fatherName: "Balwan Singh",
        religion: "HINDU",
        caste: "RAJPUT",
        category: "GEN",
        cadre: "e. General",
        permanentTemporary: "Permanent (With Order)",
        dob: "1988-11-05",
        doe: "2010-04-12",
        dor: "2048-11-30",
        dop: "2023-08-20",
        education: "12th",
        subject: "",
        postGrad: "",
        subject2: "",
        village: "Umra",
        ps: "PS HANSI SADAR",
        homeDistrict: "Hisar",
        typeOfUnit: "1. Police Stations",
        unit: "PS HANSI SADAR",
        subUnit: "",
        role1: "E. General Duty",
        role2: "",
        io: "No",
        remarks: "Test record for Hansi district",
        swatCourse: "",
        district: "Hansi",
        createdAt: new Date().toISOString(),
        uploadedFromExcel: false,
    },
    {
        name: "Pooja Sharma",
        badgeNo: "104/HNS",
        mobile: "9876543204",
        rank: "CT",
        gender: "Female",
        fatherName: "Lokesh Sharma",
        religion: "HINDU",
        caste: "BRAHMIN",
        category: "GEN",
        cadre: "e. General",
        permanentTemporary: "Temporary (With Order)",
        dob: "1995-01-30",
        doe: "2018-12-01",
        dor: "2055-01-31",
        dop: "2024-06-15",
        education: "B.Sc",
        subject: "Computer Science",
        postGrad: "",
        subject2: "",
        village: "Hansi",
        ps: "PS HANSI CITY",
        homeDistrict: "Hansi",
        typeOfUnit: "2. Traffic",
        unit: "TRAFFIC HANSI",
        subUnit: "",
        role1: "E. General Duty",
        role2: "",
        io: "No",
        remarks: "Test record for Hansi district",
        swatCourse: "",
        district: "Hansi",
        createdAt: new Date().toISOString(),
        uploadedFromExcel: false,
    },
    {
        name: "Anil Kumar Dahiya",
        badgeNo: "105/HNS",
        mobile: "9876543205",
        rank: "ASI",
        gender: "Male",
        fatherName: "Dharampal Dahiya",
        religion: "HINDU",
        caste: "JAT",
        category: "GEN",
        cadre: "e. General",
        permanentTemporary: "Permanent (With Order)",
        dob: "1982-09-18",
        doe: "2005-03-10",
        dor: "2042-09-30",
        dop: "2024-02-28",
        education: "BA",
        subject: "History",
        postGrad: "",
        subject2: "",
        village: "Dhanana",
        ps: "PS HANSI SADAR",
        homeDistrict: "Hisar",
        typeOfUnit: "1. Police Stations",
        unit: "PS HANSI SADAR",
        subUnit: "",
        role1: "A. Inv Wing (Male)",
        role2: "I/C",
        io: "Yes",
        remarks: "Test record for Hansi district",
        swatCourse: "SWAT-12",
        district: "Hansi",
        createdAt: new Date().toISOString(),
        uploadedFromExcel: false,
    },
];

async function seed() {
    console.log("🌱 Seeding 5 test officers for Hansi district...\n");

    const batch = db.batch();
    testOfficers.forEach((officer) => {
        const ref = db.collection("officers").doc();
        batch.set(ref, officer);
    });

    await batch.commit();
    console.log("✅ 5 Hansi test officers created!\n");

    // Update Hansi district stats
    const maleCount = testOfficers.filter(o => o.gender === "Male").length;
    const femaleCount = testOfficers.filter(o => o.gender === "Female").length;
    const unitsSet = new Set(testOfficers.map(o => o.unit));

    await db.collection("districts").doc("Hansi").update({
        stats: {
            total: testOfficers.length,
            male: maleCount,
            female: femaleCount,
            units: unitsSet.size,
        },
    });
    console.log("✅ Hansi district stats updated!");
    console.log(`   Total: ${testOfficers.length}, Male: ${maleCount}, Female: ${femaleCount}, Units: ${unitsSet.size}\n`);

    console.log("🎉 SEEDING COMPLETE!");
    console.log("Officers added:");
    testOfficers.forEach((o, i) => {
        console.log(`   ${i + 1}. ${o.name} (${o.rank}) — ${o.unit}`);
    });
    process.exit(0);
}

seed().catch(err => {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
});
