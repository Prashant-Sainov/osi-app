import { useState, useEffect } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
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

    async function fetchStats() {
      try {
        if (district === "Overall") {
          const snap = await getDocs(collection(db, "districts"));
          const totals = { total: 0, male: 0, female: 0, units: 0 };
          snap.docs.forEach(d => {
            const s = d.data().stats || {};
            totals.total += (s.total || 0);
            totals.male += (s.male || 0);
            totals.female += (s.female || 0);
            totals.units += (s.units || 0);
          });
          setStats(totals);
        } else {
          const snap = await getDoc(doc(db, "districts", district));
          if (snap.exists()) {
            setStats(snap.data().stats || { total: 0, male: 0, female: 0, units: 0 });
          } else {
            setStats({ total: 0, male: 0, female: 0, units: 0 });
          }
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
      setLoading(false);
    }

    fetchStats();
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
        <p className="page-sub">
          {district === "Overall" ? "State-wide Policy Overview" : `${district} District — Personnel Overview`}
        </p>

        {isLoading ? <div className="loading-text">Loading stats...</div> : (
          <div className="stats-grid">
            <div className={`stat-card blue ${district === "Overall" ? "no-click" : ""}`} onClick={() => district !== "Overall" && nav("/officers")}>
              <div className="stat-num">{stats.total}</div>
              <div className="stat-label">Total Officers</div>
            </div>
            <div className={`stat-card green ${district === "Overall" ? "no-click" : ""}`} onClick={() => district !== "Overall" && nav("/officers")}>
              <div className="stat-num">{stats.male}</div>
              <div className="stat-label">Male Officers</div>
            </div>
            <div className={`stat-card pink ${district === "Overall" ? "no-click" : ""}`} onClick={() => district !== "Overall" && nav("/officers")}>
              <div className="stat-num">{stats.female}</div>
              <div className="stat-label">Female Officers</div>
            </div>
            <div className="stat-card orange" onClick={() => nav("/units")}>
              <div className="stat-num">{stats.units}</div>
              <div className="stat-label">Active Units</div>
            </div>
          </div>
        )}

        {district === "Overall" && (
          <div style={{ background: 'var(--blue-bg)', padding: 14, borderRadius: 12, marginBottom: 20, fontSize: 13, color: 'var(--blue)', fontWeight: 600 }}>
            💡 Tip: Switch to a specific district using the dropdown above to manage individual officer records.
          </div>
        )}

        <div className="quick-actions">
          <h3 className="section-title">Quick Actions</h3>
          <div className="action-grid">
            <button className="action-card" onClick={() => nav("/officers")} disabled={district === "Overall"}>
              <span className="action-icon">👮</span>
              <span>View Officers</span>
            </button>
            <button className="action-card" onClick={() => nav("/officers/add")} disabled={district === "Overall"}>
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