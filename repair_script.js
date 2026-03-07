import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, writeBatch, addDoc, query, where } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBuFC0_AJdJy7h2Ls57idadwgemZ1BxOzk",
    authDomain: "hisar-police-app-a24f5.firebaseapp.com",
    projectId: "hisar-police-app-a24f5",
    storageBucket: "hisar-police-app-a24f5.firebasestorage.app",
    messagingSenderId: "369842457850",
    appId: "1:369842457850:web:36e1ececa41e50accfcd43",
    measurementId: "G-WFCRVFHN1Z"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ALL_DISTRICTS = ["Hisar", "Hansi", "Rohtak", "Sirsa", "Fatehabad", "Jind", "Bhiwani"];

const DEFAULT_UNITS = {
    "1. Police Stations": [
        "PS ADAMPUR", "PS AGROHA", "PS AZAD NAGAR HISAR",
        "PS BARWALA", "PS CITY HISAR", "PS CIVIL LINES HISAR",
        "PS CYBER CRIME HISAR", "PS HTM HISAR", "PS SADAR SADAR",
        "PS UKLANA", "PS URBAN ESTATE HISAR", "PS WOMEN POLICE STATION HISAR"
    ],
    "2. Traffic": [
        "Challaning Branch (HSR)", "Challaning Branch (BRWL)",
        "PS TRAFFIC HISAR", "TRAFFIC BARWALA", "TRAFFIC HISAR"
    ],
    "3. Special Staffs": [
        "ANC", "ABVT STAFF BARWALA", "CIA HISAR", "EOW",
        "Missing Person Cell", "PO STAFF", "SIU BRWL", "SPL STAFF"
    ],
    "4. Court": [
        "ADR Centre", "Couple Protection Cell", "Court Security",
        "Head Proficient", "Judicial Lockup", "Naib Court",
        "Naib Court (Civil)", "Pairvi Cell", "Prisoner Escort Guard",
        "Summon Staff"
    ],
    "5. Administrative Units": [
        "DPO", "GO Staffs", "Police Lines"
    ],
    "6. Security": [
        "Gunmen", "Standing Guard"
    ],
    "7. Temp_Dep_Trg": [
        "Deputation", "Temporary Posting (with order)",
        "Temporary Posting (without order)", "Training Courses"
    ]
};

async function repairAll() {
    console.log("Starting repair...");

    // 1. Seed Units for Hisar (at least) if empty
    const unitSnap = await getDocs(collection(db, "units"));
    if (unitSnap.empty) {
        console.log("Units collection is empty. Seeding defaults for Hisar...");
        for (const [type, names] of Object.entries(DEFAULT_UNITS)) {
            for (const name of names) {
                await addDoc(collection(db, "units"), { name, type, district: "Hisar" });
            }
        }
    }

    // 2. Recalculate Stats for all districts
    const offSnap = await getDocs(collection(db, "officers"));
    const finalUnitSnap = await getDocs(collection(db, "units"));

    const distStats = {};
    ALL_DISTRICTS.forEach(d => {
        distStats[d] = { total: 0, male: 0, female: 0, units: 0, onLeave: 0 };
    });

    offSnap.docs.forEach(d => {
        const o = d.data();
        if (distStats[o.district]) {
            distStats[o.district].total++;
            if (o.gender === "Male") distStats[o.district].male++;
            if (o.gender === "Female") distStats[o.district].female++;
            if (o.status === "On Leave") distStats[o.district].onLeave++;
        }
    });

    finalUnitSnap.docs.forEach(d => {
        const u = d.data();
        if (distStats[u.district]) {
            distStats[u.district].units++;
        }
    });

    const batch = writeBatch(db);
    for (const [d, s] of Object.entries(distStats)) {
        batch.set(doc(db, "districts", d), { stats: s }, { merge: true });
    }
    await batch.commit();
    console.log("Repair complete! Stats updated for all districts.");
}

repairAll().catch(console.error);
