import { createContext, useContext, useState, useEffect } from "react";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

const DistrictContext = createContext(null);

export function useDistrict() {
  return useContext(DistrictContext);
}

// Master list of districts (add more as needed)
export const ALL_DISTRICTS = ["Hisar", "Hansi", "Rohtak", "Sirsa", "Fatehabad", "Jind", "Bhiwani"];

export function DistrictProvider({ user, children }) {
  const [district, setDistrict] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = userProfile?.role === "admin";

  useEffect(() => {
    if (!user) {
      setDistrict(null);
      setUserProfile(null);
      setLoading(false);
      return;
    }

    async function fetchUserProfile() {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserProfile(data);
          setDistrict(data.district);
        } else {
          // First-time login: create a default user profile
          const defaultProfile = {
            email: user.email,
            district: "Hisar",
            role: "user",
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, "users", user.uid), defaultProfile);
          setUserProfile(defaultProfile);
          setDistrict(defaultProfile.district);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setDistrict("Hisar");
      }
      setLoading(false);
    }

    fetchUserProfile();
  }, [user]);

  // Admin can switch districts
  const switchDistrict = (newDistrict) => {
    if (isAdmin) {
      setDistrict(newDistrict);
    }
  };

  return (
    <DistrictContext.Provider value={{
      district,
      userProfile,
      loading,
      isAdmin,
      switchDistrict,
      allDistricts: ALL_DISTRICTS,
    }}>
      {children}
    </DistrictContext.Provider>
  );
}
