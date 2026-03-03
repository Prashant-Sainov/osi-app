import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import OfficerList from "./pages/OfficerList";
import AddEditOfficer from "./pages/AddEditOfficer";
import OfficerDetail from "./pages/OfficerDetail";
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
      <div className="splash-title">Hisar Police</div>
      <div className="spinner" />
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/officers" element={user ? <OfficerList /> : <Navigate to="/login" />} />
        <Route path="/officers/add" element={user ? <AddEditOfficer /> : <Navigate to="/login" />} />
        <Route path="/officers/edit/:id" element={user ? <AddEditOfficer /> : <Navigate to="/login" />} />
        <Route path="/officers/:id" element={user ? <OfficerDetail /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}