import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";

export default function OfficerList() {
  const [officers, setOfficers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [filterRank, setFilterRank] = useState("");
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const load = () => {
    getDocs(collection(db, "officers")).then(snap => {
      setOfficers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const filtered = officers.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.name?.toLowerCase().includes(q) ||
      o.badgeNo?.toLowerCase().includes(q) ||
      o.mobile?.toString().includes(q);
    const matchUnit = !filterUnit || o.unit === filterUnit;
    const matchRank = !filterRank || o.rank === filterRank;
    return matchSearch && matchUnit && matchRank;
  });

  const deleteOfficer = async (id, name) => {
    if (window.confirm(`Delete officer ${name}?`)) {
      await deleteDoc(doc(db, "officers", id));
      load();
    }
  };

  const units = [...new Set(officers.map(o => o.unit).filter(Boolean))].sort();
  const ranks = [...new Set(officers.map(o => o.rank).filter(Boolean))].sort();

  return (
    <div className="page">
      <div className="topbar">
        <button className="icon-btn" onClick={() => nav("/")}>← Back</button>
        <span className="topbar-title">Officers ({filtered.length})</span>
        <button className="btn-add" onClick={() => nav("/officers/add")}>+ Add</button>
      </div>

      <div className="page-content">
        <input
          className="search-input"
          placeholder="🔍  Search by name, badge, mobile..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="filter-row">
          <select className="filter-select" value={filterRank} onChange={e => setFilterRank(e.target.value)}>
            <option value="">All Ranks</option>
            {ranks.map(r => <option key={r}>{r}</option>)}
          </select>
          <select className="filter-select" value={filterUnit} onChange={e => setFilterUnit(e.target.value)}>
            <option value="">All Units</option>
            {units.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>

        {loading ? <div className="loading-text">Loading officers...</div> : (
          <div className="officer-list">
            {filtered.length === 0 && <div className="empty-text">No officers found</div>}
            {filtered.map(o => (
              <div className="officer-card" key={o.id}>
                <div className="officer-avatar">{o.gender === "Female" ? "👮‍♀️" : "👮"}</div>
                <div className="officer-info" onClick={() => nav(`/officers/${o.id}`)}>
                  <div className="officer-name">{o.name}</div>
                  <div className="officer-rank">{o.rank} • {o.badgeNo || "—"}</div>
                  <div className="officer-unit">{o.unit || "No unit assigned"}</div>
                </div>
                <div className="officer-actions">
                  <button className="edit-btn" onClick={() => nav(`/officers/edit/${o.id}`)}>✏️</button>
                  <button className="del-btn" onClick={() => deleteOfficer(o.id, o.name)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}