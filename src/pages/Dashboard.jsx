import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { useDistrict } from "../DistrictContext";

export default function Dashboard() {
  const { district, loading: districtLoading, isAdmin, switchDistrict, allDistricts } = useDistrict();
  const [stats, setStats] = useState({ total: 0, male: 0, female: 0, units: 0 });
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    if (!district) return;
    setLoading(true);
    getDoc(doc(db, "districts", district)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setStats(data.stats || { total: 0, male: 0, female: 0, units: 0 });
      } else {
        setStats({ total: 0, male: 0, female: 0, units: 0 });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [district]);

  const isLoading = districtLoading || loading;

  return (
    <div className="page">
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-icon">🚔</span>
          {isAdmin ? (
            <select
              className="district-switcher"
              value={district || ""}
              onChange={e => switchDistrict(e.target.value)}
            >
              {allDistricts.map(d => <option key={d}>{d}</option>)}
            </select>
          ) : (
            <span className="topbar-title">{district || "Police"} District</span>
          )}
        </div>
        <button className="icon-btn" onClick={() => signOut(auth)}>Logout</button>
      </div>

      <div className="page-content">
        <h2 className="page-heading">Dashboard</h2>
        <p className="page-sub">{district} District — Personnel Overview</p>

        {isLoading ? <div className="loading-text">Loading stats...</div> : (
          <div className="stats-grid">
            <div className="stat-card blue" onClick={() => nav("/officers")}>
              <div className="stat-num">{stats.total}</div>
              <div className="stat-label">Total Officers</div>
            </div>
            <div className="stat-card green" onClick={() => nav("/officers")}>
              <div className="stat-num">{stats.male}</div>
              <div className="stat-label">Male Officers</div>
            </div>
            <div className="stat-card pink" onClick={() => nav("/officers")}>
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
              <span>View Officers</span>
            </button>
            <button className="action-card" onClick={() => nav("/officers/add")}>
              <span className="action-icon">➕</span>
              <span>Add Officer</span>
            </button>
            <button className="action-card" onClick={() => nav("/lists")}>
              <span className="action-icon">📋</span>
              <span>Custom Lists</span>
            </button>
            {isAdmin && (
              <button className="action-card" onClick={() => nav("/admin/users")}>
                <span className="action-icon">👥</span>
                <span>Manage Users</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}