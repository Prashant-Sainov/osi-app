import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';

const serviceAccount = JSON.parse(
  await readFile(new URL('./serviceAccountKey.json', import.meta.url))
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const HISAR_DATA = {
  "Crime Units": ["CIA Hisar", "SPL Staff", "ABVT Staff Barwala", "ANC", "Economic Cell"],
  "Police Lines Branch": [
    "1st IRB Coy.", "3rd BN HAP Coy.", "Cow Catcher Staff", "Line Present", "QRT", "SWAT", "Swimmer",
    "Temporary Duty", "Training/Courses (more than 30 days)", "Deputation", "EL/EOL", "Maternity Leave/CCL",
    "Suspend", "Absent"
  ],
  "Police Lines Establishment": [
    "Armourer", "Bugler", "CDI", "CHC", "District Training School", "Dog Squad", "DS Coy", "GO Mess",
    "Kot", "Line Officer", "MHC Staff", "MI Office", "NGO/ORs Mess", "Pharmacist", "Police Canteen",
    "Recruits at Police Lines", "TASI"
  ],
  "DPO": [
    "Accounts Branch", "Arms License Branch", "Challaning Branch Hisar", "Community Policing Cell",
    "Complaint Branch", "Cyber Surveillance Cell", "DCRB", "DDA Branch", "DI Branch", "Draftsman",
    "English Branch", "Feedback Cell", "IT Branch", "NDPS Cell", "OASI Branch", "PA SP Hisar",
    "Police Control Room", "Police Suvidha Kendra", "PRO & Photographer", "Reader (SP)", "Reader (Addl. SP)",
    "Reader (DSP Hq)", "Reader (DSP Women Safety)", "Road Safety Cell", "RTI Branch", "Scrutiny Cell",
    "Security Branch", "Steno Branch", "Talfi Mohrar", "Telephone duty", "VDC", "VRK", "Welfare Branch",
    "Women Safety and Social Justice Cell (office team)"
  ],
  "Police Station": [
    "PS ADAMPUR", "PS AGROHA", "PS AZAD NAGAR HISAR", "PS BARWALA", "PS CITY HISAR", "PS CIVIL LINES HISAR",
    "PS CYBER CRIME HISAR", "PS HTM HISAR", "PS SADAR SADAR", "PS UKLANA", "PS URBAN ESTATE HISAR",
    "PS WOMEN POLICE STATION HISAR"
  ]
};

async function syncHisarUnits() {
  console.log("Starting full unit sync for Hisar District...");
  
  for (const [unitName, subUnits] of Object.entries(HISAR_DATA)) {
    const q = await db.collection('units')
      .where('district', '==', 'Hisar')
      .where('name', '==', unitName)
      .get();

    if (q.empty) {
      console.log(`Creating unit: ${unitName}`);
      await db.collection('units').add({
        name: unitName,
        district: "Hisar",
        subUnits: subUnits
      });
    } else {
      for (const doc of q.docs) {
        console.log(`Updating ${unitName} (${doc.id}) with ${subUnits.length} subunits...`);
        await db.collection('units').doc(doc.id).update({
          subUnits: subUnits
        });
      }
    }
  }

  console.log("Sync complete!");
}

syncHisarUnits();
