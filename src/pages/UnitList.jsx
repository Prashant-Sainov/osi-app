import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, deleteDoc, increment } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useDistrict } from "../DistrictContext";
import { UNIT_SUBUNITS, ALL_UNIT_NAMES } from "../dropdownData";
import { updateUnitGlobally, removeUnitGlobally, updateSubUnitGlobally, removeSubUnitGlobally } from "../utils/consistency";

const UNIT_ICONS = {
  "Crime Units": { icon: "🔍", cls: "crime" },
  "Police Lines Branch": { icon: "🏛️", cls: "lines-branch" },
  "Police Lines Establishment": { icon: "🏢", cls: "lines-est" },
  "DPO": { icon: "⚙️", cls: "dpo" },
  "Police Station": { icon: "👮", cls: "police-station" },
};

export default function UnitList() {
  const { district, isAdmin } = useDistrict();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [editingSubUnit, setEditingSubUnit] = useState(null); // { unitId, idx, value }
  const [addingSubUnit, setAddingSubUnit] = useState(null); // unitId
  const [newSubName, setNewSubName] = useState("");
  const [addingUnit, setAddingUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    if (!district) return;
    loadUnits();
  }, [district]);

  const loadUnits = async () => {
    setLoading(true);
    try {
      const constraints = district === "Overall"
        ? []
        : [where("district", "==", district)];
      const q = query(collection(db, "units"), ...constraints);
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUnits(items);
    } catch (err) {
      console.error("Error loading units:", err);
    }
    setLoading(false);
  };

  const toggle = (id) => setExpanded(prev => (prev === id ? null : id));

  // ── Admin: Seed default units from UNIT_SUBUNITS ──
  const seedDefaults = async () => {
    const isReset = window.confirm("Do you want to DELETE ALL existing units before importing? (Recommended for clean overhaul)");
    setLoading(true);
    try {
      if (isReset) {
        const oldSnap = await getDocs(collection(db, "units"), where("district", "==", district));
        for (const d of oldSnap.docs) { await deleteDoc(doc(db, "units", d.id)); }
      }
      
      let count = 0;
      for (const [name, subs] of Object.entries(UNIT_SUBUNITS)) {
        await addDoc(collection(db, "units"), { name, subUnits: subs, district });
        count++;
      }
      try {
        const statsUpdate = isReset ? { "stats.units": count } : { "stats.units": increment(count) };
        await updateDoc(doc(db, "districts", district), statsUpdate);
      } catch (e) {}
      alert(`Imported ${count} units with sub-units into ${district}!`);
      loadUnits();
    } catch (err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  // ── Admin: Add new unit ──
  const handleAddUnit = async () => {
    if (!newUnitName.trim()) return;
    try {
      await addDoc(collection(db, "units"), { name: newUnitName.trim(), subUnits: [], district });
      try { await updateDoc(doc(db, "districts", district), { "stats.units": increment(1) }); } catch (e) {}
      setNewUnitName("");
      setAddingUnit(false);
      loadUnits();
    } catch (err) { alert("Error: " + err.message); }
  };

  // ── Admin: Delete unit ──
  const handleDeleteUnit = async (unit) => {
    if (!window.confirm(`Delete unit "${unit.name}"? This will clear it from all officers.`)) return;
    try {
      await deleteDoc(doc(db, "units", unit.id));
      await removeUnitGlobally(unit.name, district);
      try { await updateDoc(doc(db, "districts", district), { "stats.units": increment(-1) }); } catch (e) {}
      loadUnits();
    } catch (err) { alert("Error: " + err.message); }
  };

  // ── Admin: Add sub-unit ──
  const handleAddSubUnit = async (unit) => {
    if (!newSubName.trim()) return;
    try {
      const updated = [...(unit.subUnits || []), newSubName.trim()];
      await updateDoc(doc(db, "units", unit.id), { subUnits: updated });
      setNewSubName("");
      setAddingSubUnit(null);
      loadUnits();
    } catch (err) { alert("Error: " + err.message); }
  };

  // ── Admin: Edit sub-unit ──
  const handleSaveSubUnit = async (unit, idx, newValue) => {
    if (!newValue.trim()) return;
    const oldValue = unit.subUnits[idx];
    try {
      const updated = [...unit.subUnits];
      updated[idx] = newValue.trim();
      await updateDoc(doc(db, "units", unit.id), { subUnits: updated });
      if (oldValue !== newValue.trim()) {
        await updateSubUnitGlobally(unit.name, oldValue, newValue.trim(), district);
      }
      setEditingSubUnit(null);
      loadUnits();
    } catch (err) { alert("Error: " + err.message); }
  };

  // ── Admin: Delete sub-unit ──
  const handleDeleteSubUnit = async (unit, idx) => {
    const subName = unit.subUnits[idx];
    if (!window.confirm(`Delete sub-unit "${subName}"?`)) return;
    try {
      const updated = unit.subUnits.filter((_, i) => i !== idx);
      await updateDoc(doc(db, "units", unit.id), { subUnits: updated });
      await removeSubUnitGlobally(unit.name, subName, district);
      loadUnits();
    } catch (err) { alert("Error: " + err.message); }
  };

  const getIcon = (name) => UNIT_ICONS[name] || { icon: "🏢", cls: "lines-est" };

  return (
    <div className="page">
      <div className="topbar">
        <button className="icon-btn" onClick={() => nav("/")}>← Back</button>
        <span className="topbar-title">{district === "Overall" ? "All Units" : `${district} Units`}</span>
        <div />
      </div>

      <div className="page-content">
        <h2 className="page-heading">🏢 Units & Sub-Units</h2>
        <p className="page-sub">
          {district === "Overall" ? "State-wide unit overview" : `${district} District — Click a unit to see its sub-units`}
        </p>

        {isAdmin && units.length === 0 && !loading && (
          <button className="btn-primary" onClick={seedDefaults} style={{ marginBottom: 20, width: '100%' }}>
            ⚡ Import Default Units & Sub-Units
          </button>
        )}

        {loading ? (
          <div className="loading-text">Loading units...</div>
        ) : units.length === 0 ? (
          <div className="empty-text">No units found. {isAdmin ? "Use the button above to import defaults." : "Ask an admin to set up units."}</div>
        ) : (
          <div className="unit-accordion">
            {units.map(u => {
              const { icon, cls } = getIcon(u.name);
              const isExpanded = expanded === u.id;
              const subUnits = u.subUnits || [];
              return (
                <div className={`unit-accordion-card ${isExpanded ? "expanded" : ""}`} key={u.id}>
                  <div className="unit-accordion-header" onClick={() => toggle(u.id)}>
                    <div className="unit-accordion-left">
                      <div className={`unit-accordion-icon ${cls}`}>{icon}</div>
                      <div>
                        <div className="unit-accordion-title">{u.name}</div>
                        <div className="unit-accordion-count">{subUnits.length} sub-unit{subUnits.length !== 1 ? "s" : ""}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {isAdmin && (
                        <button
                          className="del-btn"
                          onClick={(e) => { e.stopPropagation(); handleDeleteUnit(u); }}
                          title="Delete Unit"
                        >🗑️</button>
                      )}
                      <span className="unit-accordion-chevron">▼</span>
                    </div>
                  </div>

                  <div className="unit-accordion-body">
                    <div className="subunit-list">
                      {subUnits.map((sub, idx) => (
                        <div className="subunit-item" key={idx}>
                          {editingSubUnit?.unitId === u.id && editingSubUnit?.idx === idx ? (
                            <div style={{ display: 'flex', gap: 8, flex: 1, alignItems: 'center' }}>
                              <input
                                className="field-input"
                                value={editingSubUnit.value}
                                onChange={e => setEditingSubUnit({ ...editingSubUnit, value: e.target.value })}
                                onKeyDown={e => e.key === "Enter" && handleSaveSubUnit(u, idx, editingSubUnit.value)}
                                autoFocus
                                style={{ padding: '6px 10px', fontSize: 13 }}
                              />
                              <button className="add-btn-sm" onClick={() => handleSaveSubUnit(u, idx, editingSubUnit.value)}>Save</button>
                              <button className="btn-cancel-select" onClick={() => setEditingSubUnit(null)} style={{ padding: '6px 10px' }}>✕</button>
                            </div>
                          ) : (
                            <>
                              <span
                                className="subunit-name"
                                onClick={() => nav(`/officers?unit=${encodeURIComponent(u.name)}&subUnit=${encodeURIComponent(sub)}`)}
                              >{sub}</span>
                              {isAdmin && (
                                <div className="subunit-actions">
                                  <button className="edit-sub" onClick={() => setEditingSubUnit({ unitId: u.id, idx, value: sub })}>✏️</button>
                                  <button className="del-sub" onClick={() => handleDeleteSubUnit(u, idx)}>🗑️</button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}

                      {subUnits.length === 0 && <div className="empty-text" style={{ padding: 16 }}>No sub-units added yet.</div>}
                    </div>

                    {isAdmin && (
                      addingSubUnit === u.id ? (
                        <div className="admin-unit-form">
                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--navy)' }}>Add Sub-Unit to {u.name}</div>
                          <div className="admin-unit-form-row">
                            <input
                              className="field-input"
                              placeholder="Sub-unit name..."
                              value={newSubName}
                              onChange={e => setNewSubName(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && handleAddSubUnit(u)}
                              autoFocus
                              style={{ padding: '8px 12px', fontSize: 13 }}
                            />
                            <button className="add-btn-sm" onClick={() => handleAddSubUnit(u)}>Add</button>
                            <button className="btn-cancel-select" onClick={() => { setAddingSubUnit(null); setNewSubName(""); }} style={{ padding: '6px 10px' }}>✕</button>
                          </div>
                        </div>
                      ) : (
                        <div className="chittha-add-entry" onClick={() => { setAddingSubUnit(u.id); setNewSubName(""); }}>
                          + Add Sub-Unit
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}

            {isAdmin && (
              addingUnit ? (
                <div className="section-card">
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: 'var(--navy)', fontFamily: "'Outfit', sans-serif" }}>Create New Unit</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input
                      className="field-input"
                      placeholder="Unit name..."
                      value={newUnitName}
                      onChange={e => setNewUnitName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAddUnit()}
                      autoFocus
                    />
                    <button className="add-btn-sm" onClick={handleAddUnit}>Create</button>
                    <button className="btn-cancel-select" onClick={() => { setAddingUnit(false); setNewUnitName(""); }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="add-unit-btn" onClick={() => setAddingUnit(true)}>+ Add New Unit</div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
