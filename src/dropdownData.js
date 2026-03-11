export const DROPDOWNS = {
  rank: [
    "SP","ASP","DSP","DSP (Prob)","Insp","PSI","SI",
    "ASI/ESI","ASI","HC/ESI","HC/EASI","HC","C-1/EHC",
    "C-1","C-1/ORPSI","CT/ESI","CT/EASI","CT/EHC/ORPHC",
    "CT/EHC","CT","R/CT","SPO"
  ],
  gender: ["Male", "Female"],
  religion: ["HINDU", "MUSLIM", "SIKH"],
  category: [
    "GEN","GEN (DESM)","GEN (DFF)","GEN (ESM)","GEN (EWS)",
    "BCA","BCA (DESM)","BCA (ESM)",
    "BCB","BCB (DESM)","BCB (DFF)","BCB (ESM)",
    "SC","SC (DESM)","SC (ESM)","ST","ST (DESM)","ST (ESM)"
  ],
  cadre: [
    "a. Clerical (Accounts)","b. Clerical (English)",
    "c. Ministerial","d. Technical","e. General","f. Telecom"
  ],
  permanentTemporary: [
    "Permanent (With Order)","Permanent (Without Order)",
    "Temporary (With Order)","Temporary (Without Order)"
  ],
  role1: [
    "A. Inv Wing (Male)","B. Inv Wing (Female)","C. MHC Staff",
    "D. MM Staff","E. General Duty","F. Dial 112",
    "G. PCR","H. Rider","I. Naaka","J. Security Agent",
    "K. Driver","L. Summon","M. Pairokar"
  ],
  homeDistrict: [
    "Ambala","Bhiwani","Charkhi Dadri","Dabwali","Delhi",
    "Faridabad","Fatehabad","Gurugram","Hansi","Hisar",
    "Jhajjar","Jind","Kaithal","Karnal","Kurukshetra",
    "Mahendragarh","Nuh","Palwal","Panchkula","Panipat",
    "Punjab","Rajasthan","Rewari","Rohtak","Sirsa","Sonipat",
    "Uttar Pradesh","Yamunanagar"
  ],
  education: [
    "9th or below","10th","10th_ITI","11th","12th","12th_ITI",
    "BA","BA (1st Yr)","BA (2nd Yr)","BA (Army)","BA/B.Ed",
    "BA/B.P.Ed","B.Com","B.E.","B.Ed","B.Pharma","B.Sc",
    "B.Sc (2nd Yr)","B.Sc/B.Ed","B.Sc/LLB","B.Tech",
    "BBA","BCA","BTM","Diploma","JBT","LLB","PGDCA",
    "Post Diploma","LLM","M.Com","M.Phil","M.Sc",
    "M.Tech","MA","MBA","MCA","PhD"
  ],
  caste: [
    "AHIR","AHLUWALIA SIKH","ARORA","BADI","BAIRAGI","BALMIKI",
    "BANIYA","BANJARA","BARHAI","BAWARIA","BAZIGAR","BHAT",
    "BHATIA","BISHNOI","BRAHMIN","CHAMAR","CHARAG BRAHMAN",
    "CHHIPPA","CHHIPPI","DAKOT","DARJI","DHANAK","DHIMAN",
    "DHOBI","DOOM","GADARIYA","GORKHA","GOSAI","GOSWAMI",
    "GUJJAR","HARIJAN","HERI","JAT","JAT SIKH","JATAV",
    "JATIYA","JHIMAR","JULAHA","KABIRPANTHI","KAHAR","KAMBOJ",
    "KAMBOJ SIKH","KASHYAP","KASHYAP RAJPUT","KHATI","KHATIK",
    "KHATRI","KOHLI","KORI","KUMHAR","LABANA SIKH","LOHAR",
    "MAHASHA","MAHASHAY","MANIHAR","MAZHABI SIKH","MEENA",
    "MEGH","MEGHWAL","MOCHI","MUSLIM","NAI","NAT","NAYAK",
    "NISHAD","ORH","ORH RAJPUT","PAL","PANCHAL","PANDIT",
    "PASSI","PRAJAPTI","PUNJABI","RABARI","RAI SIKH","RAJPUT",
    "RAMDASIA","RAMDASIA SIKH","RAMGARHIA SIKH","RAVIDASIA",
    "REGAR","ROR","ROR HARIJAN","ROR RAJPUT","SAHASI","SAINI",
    "SHARMA","TELI","THAKUR","YADAV"
  ]
};

// New Unit → Sub-Unit hierarchy (replaces old typeOfUnit + unit system)
export const UNIT_SUBUNITS = {
  "Crime Units": [
    "CIA Hisar",
    "SPL Staff",
    "ABVT Staff Barwala",
    "ANC",
    "Economic Cell"
  ],
  "Police Lines Branch": [
    "1st IRB Coy.",
    "3rd BN HAP Coy.",
    "Cow Catcher Staff",
    "Line Present",
    "QRT",
    "SWAT",
    "Swimmer",
    "Temporary Duty",
    "Training/Courses (more than 30 days)",
    "Deputation",
    "EL/EOL",
    "Maternity Leave/CCL",
    "Suspend",
    "Absent"
  ],
  "Police Lines Establishment": [
    "Armourer",
    "Bugler",
    "CDI",
    "CHC",
    "District Training School",
    "Dog Squad",
    "DS Coy",
    "GO Mess",
    "Kot",
    "Line Officer",
    "MHC Staff",
    "MI Office",
    "NGO/ORs Mess",
    "Pharmacist",
    "Police Canteen",
    "Recruits at Police Lines",
    "TASI"
  ],
  "DPO": [
    "Accounts Branch",
    "Arms License Branch",
    "Challaning Branch Hisar",
    "Community Policing Cell",
    "Complaint Branch",
    "Cyber Surveillance Cell",
    "DCRB",
    "DDA Branch",
    "DI Branch",
    "Draftsman",
    "English Branch",
    "Feedback Cell",
    "IT Branch",
    "NDPS Cell",
    "OASI Branch",
    "PA SP Hisar",
    "Police Control Room",
    "Police Suvidha Kendra",
    "PRO & Photographer",
    "Reader (SP)",
    "Reader (Addl. SP)",
    "Reader (DSP Hq)",
    "Reader (DSP Women Safety)",
    "Road Safety Cell",
    "RTI Branch",
    "Scrutiny Cell",
    "Security Branch",
    "Steno Branch",
    "Talfi Mohrar",
    "Telephone duty",
    "VDC",
    "VRK",
    "Welfare Branch",
    "Women Safety and Social Justice Cell (office team)"
  ],
  "Police Station": [
    "PS ADAMPUR",
    "PS AGROHA",
    "PS AZAD NAGAR HISAR",
    "PS BARWALA",
    "PS CITY HISAR",
    "PS CIVIL LINES HISAR",
    "PS CYBER CRIME HISAR",
    "PS HTM HISAR",
    "PS SADAR SADAR",
    "PS UKLANA",
    "PS URBAN ESTATE HISAR",
    "PS WOMEN POLICE STATION HISAR",
    "PS City Hansi",
    "PS Sadar Hansi",
    "PS Bass",
    "PS Narnaund"
  ]
};

// Helper: get all unit names as a flat array
export const ALL_UNIT_NAMES = Object.keys(UNIT_SUBUNITS);

// Helper: get all sub-units for a given unit
export function getSubUnits(unitName) {
  return UNIT_SUBUNITS[unitName] || [];
}

// Helper: get all sub-units as a flat array
export function getAllSubUnits() {
  return Object.values(UNIT_SUBUNITS).flat();
}