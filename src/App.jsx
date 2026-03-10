import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { DistrictProvider } from "./DistrictContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import OfficerList from "./pages/OfficerList";
import AddEditOfficer from "./pages/AddEditOfficer";
import OfficerDetail from "./pages/OfficerDetail";
import CustomLists from "./pages/CustomLists";
import CustomListDetail from "./pages/CustomListDetail";
import AdminUsers from "./pages/AdminUsers";
import UnitList from "./pages/UnitList";
import ChitthaList from "./pages/ChitthaList";
import ChitthaEditor from "./pages/ChitthaEditor";
import ChitthaView from "./pages/ChitthaView";
import "./index.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return (
    <div className="splash">
      <div className="splash-logo">🚔</div>
      <div className="splash-title">State Police</div>
      <div className="splash-sub">Personnel Management System</div>
      <div className="spinner" />
    </div>
  );

  return (
    <Router>
      <DistrictProvider user={user}>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/officers" element={user ? <OfficerList /> : <Navigate to="/login" />} />
          <Route path="/officers/add" element={user ? <AddEditOfficer /> : <Navigate to="/login" />} />
          <Route path="/officers/edit/:id" element={user ? <AddEditOfficer /> : <Navigate to="/login" />} />
          <Route path="/officers/:id" element={user ? <OfficerDetail /> : <Navigate to="/login" />} />
          <Route path="/lists" element={user ? <CustomLists /> : <Navigate to="/login" />} />
          <Route path="/lists/:id" element={user ? <CustomListDetail /> : <Navigate to="/login" />} />
          <Route path="/admin/users" element={user ? <AdminUsers /> : <Navigate to="/login" />} />
          <Route path="/units" element={user ? <UnitList /> : <Navigate to="/login" />} />
          <Route path="/chitthas" element={user ? <ChitthaList /> : <Navigate to="/login" />} />
          <Route path="/chitthas/new" element={user ? <ChitthaEditor /> : <Navigate to="/login" />} />
          <Route path="/chitthas/edit/:id" element={user ? <ChitthaEditor /> : <Navigate to="/login" />} />
          <Route path="/chitthas/:id" element={user ? <ChitthaView /> : <Navigate to="/login" />} />
        </Routes>
      </DistrictProvider>
    </Router>
  );
}