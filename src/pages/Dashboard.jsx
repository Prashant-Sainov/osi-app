import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, male: 0, female: 0, units: 0 });
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    getDocs(collection(db, "officers")).then(snap => {
      const docs = snap.docs.map(d => d.data());
      const units = new Set(docs.map(d => d.unit)).size;
      setStats({
        total: docs.length,
        male: docs.filter(d => d.gender === "Male").length,
        female: docs.filter(d => d.gender === "Female").length,
        units
      });
      setLoading(false);
    });
  }, []);

  return (
    <div className="page">
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-icon">🚔</span>
          <span className="topbar-title">Hisar Police</span>
        </div>
        <button className="icon-btn" onClick={() => signOut(auth)}>Logout</button>
      </div>

      <div className="page-content">
        <h2 className="page-heading">Dashboard</h2>
        <p className="page-sub">Personnel Overview</p>

        {loading ? <div className="loading-text">Loading stats...</div> : (
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-num">{stats.total}</div>
              <div className="stat-label">Total Officers</div>
            </div>
            <div className="stat-card green">
              <div className="stat-num">{stats.male}</div>
              <div className="stat-label">Male Officers</div>
            </div>
            <div className="stat-card pink">
              <div className="stat-num">{stats.female}</div>
              <div className="stat-label">Female Officers</div>
            </div>
            <div className="stat-card orange">
              <div className="stat-num">{stats.units}</div>
              <div className="stat-label">Active Units</div>
            </div>
          </div>
        )}

        <div className="quick-actions">
          <h3 className="section-title">Quick Actions</h3>
          <div className="action-grid">
            <button className="action-card" onClick={() => nav("/officers")}>
              <span className="action-icon">👮</span>
              <span>View All Officers</span>
            </button>
            <button className="action-card" onClick={() => nav("/officers/add")}>
              <span className="action-icon">➕</span>
              <span>Add New Officer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}