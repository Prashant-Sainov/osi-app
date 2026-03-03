import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
export const db = getFirestore(app);
export const auth = getAuth(app);