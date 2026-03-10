import { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, updateDoc, writeBatch, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useDistrict, ALL_DISTRICTS } from "../DistrictContext";
import { generateSearchGrams } from "../utils/search";

export default function AdminUsers() {
  const { isAdmin, loading: authLoading } = useDistrict();
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [leaveUsers, setLeaveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active");
  const [reindexing, setReindexing] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) { nav("/"); return; }
    loadAllData();
  }, [isAdmin, authLoading]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const all = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      setUsers(all.filter(u => u.status !== "pending"));
      setPendingUsers(all.filter(u => u.status === "pending"));

      const leaveQ = query(collection(db, "officers"), where("status", "==", "On Leave"));
      const leaveSnap = await getDocs(leaveQ);
      setLeaveUsers(leaveSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error("Error loading data:", err); }
    setLoading(false);
  };

  const approveUser = async (u) => {
    if (!window.confirm(`Approve registration for ${u.name} (${u.email})?`)) return;
    try {
      await updateDoc(doc(db, "users", u.uid), { status: "active", role: "user" });
      alert("User approved!");
      loadAllData();
    } catch (err) { alert("Error: " + err.message); }
  };

  const deleteUser = async (uid, email) => {
    if (!window.confirm(`Permanently delete account for ${email}?`)) return;
    try { await deleteDoc(doc(db, "users", uid)); loadAllData(); }
    catch (err) { console.error("Error:", err); }
  };

  const changeRole = async (uid, currentRole) => {
    const newR = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`Change role to ${newR}?`)) return;
    await updateDoc(doc(db, "users", uid), { role: newR });
    loadAllData();
  };

  const changeDistrict = async (uid, newDist) => {
    await updateDoc(doc(db, "users", uid), { district: newDist });
    loadAllData();
  };

  const reindexSearch = async () => {
    if (!window.confirm("Update search data for ALL officers?")) return;
    setReindexing(true);
    try {
      const snap = await getDocs(collection(db, "officers"));
      const batch = writeBatch(db);
      let count = 0;
      snap.docs.forEach(d => {
        const data = d.data();
        batch.update(doc(db, "officers", d.id), { _searchGrams: generateSearchGrams(data.name, data.badgeNo, data.mobile, data.rank) });
        count++;
      });
      await batch.commit();
      alert(`Re-indexed ${count} officers!`);
    } catch (err) { alert("Error: " + err.message); }
    setReindexing(false);
  };

  const repairStats = async () => {
    if (!window.confirm("Recalculate all district statistics?")) return;
    setLoading(true);
    try {
      const offSnap = await getDocs(collection(db, "officers"));
      const unitSnap = await getDocs(collection(db, "units"));
      const distStats = {};
      ALL_DISTRICTS.forEach(d => { distStats[d] = { total: 0, male: 0, female: 0, units: 0, onLeave: 0 }; });

      offSnap.docs.forEach(d => {
        const o = d.data();
        if (distStats[o.district]) {
          distStats[o.district].total++;
          if (o.gender === "Male") distStats[o.district].male++;
          if (o.gender === "Female") distStats[o.district].female++;
          if (o.status === "On Leave") distStats[o.district].onLeave++;
        }
      });
      unitSnap.docs.forEach(d => {
        const u = d.data();
        if (distStats[u.district]) distStats[u.district].units++;
      });

      const batch = writeBatch(db);
      for (const [d, s] of Object.entries(distStats)) {
        batch.set(doc(db, "districts", d), { stats: s }, { merge: true });
      }
      await batch.commit();
      alert("Statistics repaired!");
      loadAllData();
    } catch (err) { alert("Error: " + err.message); }
    setLoading(false);
  };

  if (!isAdmin) return null;

  return (
    <div className="page">
      <div className="topbar">
        <button className="icon-btn" onClick={() => nav("/")}>← Back</button>
        <span className="topbar-title">Admin Controls</span>
        <div style={{ width: 40 }} />
      </div>

      <div className="page-content">
        <h2 className="page-heading">System Management</h2>

        <div className="filter-row" style={{ marginBottom: 16, overflowX: 'auto', flexWrap: 'nowrap' }}>
          {[
            { key: "active", label: `Active (${users.length})` },
            { key: "pending", label: `Requested (${pendingUsers.length})`, dot: pendingUsers.length > 0 },
            { key: "leave", label: `On Leave (${leaveUsers.length})` },
          ].map(t => (
            <button key={t.key}
              className={`btn-select-mode ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
              style={{ flexShrink: 0, position: 'relative' }}
            >
              {t.label}
              {t.dot && <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--red)', width: 10, height: 10, borderRadius: '50%', border: '2px solid white' }} />}
            </button>
          ))}
        </div>

        {loading || authLoading ? <div className="loading-text">Fetching records...</div> : (
          <>
            {tab === "active" && (
              <div>
                <div className="admin-btn-row">
                  <button className="btn-load-more" onClick={reindexSearch} disabled={reindexing} style={{ flex: 1, color: 'var(--navy)', borderColor: 'var(--navy)' }}>
                    {reindexing ? "⚙️ indexing..." : "🛠️ Search Logic"}
                  </button>
                  <button className="btn-load-more" onClick={repairStats} style={{ flex: 1, color: 'var(--green)', borderColor: 'var(--green)' }}>
                    📊 Repair Stats
                  </button>
                </div>
                {users.map(u => (
                  <div className="admin-user-card" key={u.uid}>
                    <div className="admin-user-info">
                      <div className="admin-user-email">{u.name || "Police User"}</div>
                      <div className="admin-user-role">
                        <span className={`role-badge ${u.role}`}>{u.role}</span>
                        <select value={u.district || ""} onChange={e => changeDistrict(u.uid, e.target.value)}
                          className="filter-select dist-select-sm">
                          {ALL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="admin-user-detail">{u.email}</div>
                    </div>
                    <div className="admin-actions-row">
                      <button className="edit-btn" onClick={() => changeRole(u.uid, u.role)} title="Toggle Admin">🔄</button>
                      <button className="del-btn" onClick={() => deleteUser(u.uid, u.email)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "pending" && (
              pendingUsers.length === 0 ? <div className="empty-text">No pending registrations</div> : (
                pendingUsers.map(u => (
                  <div className="admin-user-card pending-card" key={u.uid}>
                    <div className="admin-user-info">
                      <div className="admin-user-email pending-name">{u.name}</div>
                      <div className="admin-user-role">Requested Access: <b>{u.district}</b></div>
                      <div className="admin-user-detail">{u.email} • {u.mobile}</div>
                    </div>
                    <div className="admin-actions-row">
                      <button className="btn-add" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => approveUser(u)}>Approve</button>
                      <button className="del-btn" style={{ fontSize: 20 }} onClick={() => deleteUser(u.uid, u.email)}>✕</button>
                    </div>
                  </div>
                ))
              )
            )}

            {tab === "leave" && (
              <div className="officer-list">
                {leaveUsers.length === 0 && <div className="empty-text">No active leave records found.</div>}
                {leaveUsers.map(o => (
                  <div className="officer-card leave-card" key={o.id}>
                    <div className="officer-avatar" style={{ fontSize: 24 }}>{o.gender === "Female" ? "👮‍♀️" : "👮"}</div>
                    <div className="officer-info">
                      <div className="officer-name">
                        {o.name}
                        <span className="leave-badge">ON LEAVE</span>
                      </div>
                      <div className="officer-rank">{o.rank} • {o.badgeNo || "—"}</div>
                      <div className="officer-unit" style={{ color: 'var(--blue)', fontWeight: 600 }}>{o.unit}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                        <div className="leave-detail">District: <b>{o.district}</b></div>
                        <button className="view-detail-btn" onClick={() => nav(`/officers?search=${encodeURIComponent(o.name)}`)}>View Details →</button>
                      </div>
                      {o.remarks && <div className="leave-remark">📝 {o.remarks}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
