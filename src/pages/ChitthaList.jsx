import { useState, useEffect } from "react";
import { collection, query, where, getDocs, deleteDoc, doc, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useDistrict } from "../DistrictContext";

export default function ChitthaList() {
  const { district } = useDistrict();
  const [chitthas, setChitthas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUnit, setFilterUnit] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [units, setUnits] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    if (!district || district === "Overall") return;
    loadChitthas();
    loadUnits();
  }, [district]);

  const loadUnits = async () => {
    try {
      const q = query(collection(db, "units"), where("district", "==", district));
      const snap = await getDocs(q);
      setUnits(snap.docs.map(d => d.data()));
    } catch (err) { console.error("Error loading units:", err); }
  };

  const loadChitthas = async () => {
    setLoading(true);
    try {
      const constraints = [where("district", "==", district)];
      const q = query(collection(db, "chitthas"), ...constraints);
      const snap = await getDocs(q);
      let items = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setChitthas(items);
    } catch (err) { console.error("Error loading chitthas:", err); }
    setLoading(false);
  };

  const deleteChittha = async (id, label) => {
    if (!window.confirm(`Delete chittha "${label}"?`)) return;
    try {
      await deleteDoc(doc(db, "chitthas", id));
      setChitthas(prev => prev.filter(c => c.id !== id));
    } catch (err) { alert("Error: " + err.message); }
  };

  const copyChittha = async (chittha) => {
    const today = new Date().toISOString().split("T")[0];
    if (!window.confirm(`Copy this chittha to today (${today})?`)) return;
    try {
      const { id, ...data } = chittha;
      const newChittha = {
        ...data,
        date: today,
        dateLabel: today,
        copiedFromId: id,
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, "chitthas"), newChittha);
      nav(`/chitthas/edit/${docRef.id}`);
    } catch (err) { alert("Error: " + err.message); }
  };

  const formatDate = (d) => {
    if (!d) return "";
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const filtered = chitthas.filter(c => {
    if (filterUnit && c.unitName !== filterUnit) return false;
    if (filterDate && c.date !== filterDate) return false;
    return true;
  });

  // Group by date
  const grouped = filtered.reduce((acc, c) => {
    const d = c.date || "Unknown";
    if (!acc[d]) acc[d] = [];
    acc[d].push(c);
    return acc;
  }, {});

  return (
    <div className="page">
      <div className="topbar">
        <button className="icon-btn" onClick={() => nav("/")}>← Back</button>
        <span className="topbar-title">Naukari Chittha</span>
        <button className="btn-add" onClick={() => nav("/chitthas/new")}>+ New</button>
      </div>

      <div className="page-content">
        <h2 className="page-heading">📝 Naukari Chittha</h2>
        <p className="page-sub">{district} District — Daily Duty Rosters</p>

        <div className="filter-row">
          <select className="filter-select" value={filterUnit} onChange={e => setFilterUnit(e.target.value)}>
            <option value="">All Units</option>
            {units.map(u => <option key={u.name}>{u.name}</option>)}
          </select>
          <input className="filter-select" type="date" value={filterDate}
            onChange={e => setFilterDate(e.target.value)} style={{ minWidth: 130 }} />
          {(filterUnit || filterDate) && (
            <button className="filter-clear-btn" onClick={() => { setFilterUnit(""); setFilterDate(""); }}>Clear</button>
          )}
        </div>

        {loading ? <div className="loading-text">Loading chitthas...</div> : filtered.length === 0 ? (
          <div className="empty-text">
            No chitthas found.
            <br />
            <button className="btn-primary" onClick={() => nav("/chitthas/new")} style={{ marginTop: 16 }}>
              + Create Your First Chittha
            </button>
          </div>
        ) : (
          Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([date, items]) => (
            <div key={date} style={{ marginBottom: 24 }}>
              <h3 className="section-title">{formatDate(date)}</h3>
              <div className="chittha-list">
                {items.map(c => (
                  <div className="chittha-card" key={c.id}>
                    <div className="chittha-card-icon">📋</div>
                    <div className="chittha-card-info" onClick={() => nav(`/chitthas/${c.id}`)}>
                      <div className="chittha-card-title">{c.unitName}</div>
                      <div className="chittha-card-meta">
                        {c.dateLabel || formatDate(c.date)} • {c.sections?.length || 0} sections
                        {c.copiedFromId && " • 📋 Copied"}
                      </div>
                    </div>
                    <div className="chittha-card-actions">
                      <button className="chittha-action-btn" onClick={() => nav(`/chitthas/${c.id}`)}>View</button>
                      <button className="chittha-action-btn" onClick={() => nav(`/chitthas/edit/${c.id}`)}>Edit</button>
                      <button className="chittha-action-btn copy" onClick={() => copyChittha(c)}>📋 Copy</button>
                      <button className="chittha-action-btn danger" onClick={() => deleteChittha(c.id, c.unitName)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
