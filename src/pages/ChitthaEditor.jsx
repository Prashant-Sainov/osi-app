import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, setDoc, addDoc, updateDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { db, auth } from "../firebase";
import { useDistrict } from "../DistrictContext";

export default function ChitthaEditor() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();
  const { district } = useDistrict();
  const [saving, setSaving] = useState(false);
  const [units, setUnits] = useState([]);
  const [allOfficers, setAllOfficers] = useState([]);
  const [officersLoaded, setOfficersLoaded] = useState(false);

  // Chittha state
  const [unitName, setUnitName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dateLabel, setDateLabel] = useState("");
  const [headSummary, setHeadSummary] = useState([
    { head: "Police Official", totalPosted: 0, absent: 0, leave: 0, present: 0 },
    { head: "SPO", totalPosted: 0, absent: 0, leave: 0, present: 0 },
    { head: "HGH", totalPosted: 0, absent: 0, leave: 0, present: 0 },
    { head: "HKRN (Driver)", totalPosted: 0, absent: 0, leave: 0, present: 0 },
    { head: "Group D (P)", totalPosted: 0, absent: 0, leave: 0, present: 0 },
    { head: "Group D (Temp)", totalPosted: 0, absent: 0, leave: 0, present: 0 },
  ]);
  const [sections, setSections] = useState([]);
  const [copiedFromId, setCopiedFromId] = useState(null);

  // Officer picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSectionIdx, setPickerSectionIdx] = useState(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [addingSectionName, setAddingSectionName] = useState("");
  const [editingSectionIdx, setEditingSectionIdx] = useState(null);
  const [editSectionName, setEditSectionName] = useState("");
  const [addingHeadRow, setAddingHeadRow] = useState(false);
  const [newHeadName, setNewHeadName] = useState("");

  useEffect(() => {
    if (!district || district === "Overall") return;
    loadUnits();
  }, [district]);

  useEffect(() => {
    if (isEdit) loadChittha();
  }, [id]);

  const loadUnits = async () => {
    try {
      const q = query(collection(db, "units"), where("district", "==", district));
      const snap = await getDocs(q);
      setUnits(snap.docs.map(d => d.data()));
    } catch (err) { console.error(err); }
  };

  const loadOfficers = async () => {
    if (officersLoaded) return;
    try {
      const q = query(collection(db, "officers"), where("district", "==", district));
      const snap = await getDocs(q);
      setAllOfficers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setOfficersLoaded(true);
    } catch (err) { console.error(err); }
  };

  const loadChittha = async () => {
    try {
      const snap = await getDoc(doc(db, "chitthas", id));
      if (snap.exists()) {
        const d = snap.data();
        setUnitName(d.unitName || "");
        setDate(d.date || "");
        setDateLabel(d.dateLabel || "");
        setHeadSummary(d.headSummary || []);
        setSections(d.sections || []);
        setCopiedFromId(d.copiedFromId || null);
      }
    } catch (err) { console.error(err); }
  };

  const save = async () => {
    if (!unitName) { alert("Please select a unit"); return; }
    if (!date) { alert("Please select a date"); return; }
    setSaving(true);
    const data = {
      unitName, date, dateLabel: dateLabel || date,
      district, headSummary, sections, copiedFromId,
      createdBy: auth.currentUser?.uid || "",
      ...(isEdit ? { updatedAt: new Date().toISOString() } : { createdAt: new Date().toISOString() }),
    };
    try {
      if (isEdit) {
        await updateDoc(doc(db, "chitthas", id), data);
      } else {
        await addDoc(collection(db, "chitthas"), data);
      }
      nav("/chitthas");
    } catch (err) { alert("Error: " + err.message); }
    setSaving(false);
  };

  // Head summary helpers
  const updateHead = (idx, field, val) => {
    setHeadSummary(prev => prev.map((h, i) => i === idx ? { ...h, [field]: parseInt(val) || 0 } : h));
  };
  const removeHead = (idx) => setHeadSummary(prev => prev.filter((_, i) => i !== idx));
  const addHead = () => {
    if (!newHeadName.trim()) return;
    setHeadSummary(prev => [...prev, { head: newHeadName.trim(), totalPosted: 0, absent: 0, leave: 0, present: 0 }]);
    setNewHeadName(""); setAddingHeadRow(false);
  };

  // Section helpers
  const addSection = () => {
    if (!addingSectionName.trim()) return;
    setSections(prev => [...prev, { title: addingSectionName.trim(), entries: [] }]);
    setAddingSectionName("");
  };
  const removeSection = (idx) => {
    if (!window.confirm(`Delete section "${sections[idx].title}"?`)) return;
    setSections(prev => prev.filter((_, i) => i !== idx));
  };
  const renameSection = (idx) => {
    if (!editSectionName.trim()) return;
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, title: editSectionName.trim() } : s));
    setEditingSectionIdx(null); setEditSectionName("");
  };

  // Entry helpers
  const openPicker = (sectionIdx) => {
    setPickerSectionIdx(sectionIdx);
    setPickerSearch("");
    setPickerOpen(true);
    loadOfficers();
  };

  const addOfficerEntry = (officer) => {
    setSections(prev => prev.map((s, i) => {
      if (i !== pickerSectionIdx) return s;
      const exists = s.entries.some(e => e.officerId === officer.id);
      if (exists) return s;
      return {
        ...s,
        entries: [...s.entries, {
          officerId: officer.id,
          sn: s.entries.length + 1,
          rank: officer.rank || "",
          name: officer.name || "",
          beltNo: officer.badgeNo || "",
          remarks: "",
          mobile: officer.mobile || "",
        }]
      };
    }));
  };

  const updateEntryRemark = (secIdx, entryIdx, val) => {
    setSections(prev => prev.map((s, si) => {
      if (si !== secIdx) return s;
      return { ...s, entries: s.entries.map((e, ei) => ei === entryIdx ? { ...e, remarks: val } : e) };
    }));
  };

  const removeEntry = (secIdx, entryIdx) => {
    setSections(prev => prev.map((s, si) => {
      if (si !== secIdx) return s;
      const entries = s.entries.filter((_, ei) => ei !== entryIdx).map((e, i) => ({ ...e, sn: i + 1 }));
      return { ...s, entries };
    }));
  };

  const filteredPickers = allOfficers.filter(o => {
    const term = pickerSearch.toLowerCase();
    if (!term) return true;
    return (o.name || "").toLowerCase().includes(term) ||
      (o.badgeNo || "").toLowerCase().includes(term) ||
      (o.rank || "").toLowerCase().includes(term);
  }).slice(0, 50);

  return (
    <div className="page">
      <div className="topbar">
        <button className="icon-btn" onClick={() => nav("/chitthas")}>← Back</button>
        <span className="topbar-title">{isEdit ? "Edit Chittha" : "New Chittha"}</span>
        <button className="btn-add" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "💾 Save"}
        </button>
      </div>

      <div className="page-content">
        {/* Unit & Date */}
        <div className="section-card">
          <h3 className="section-head">📋 Chittha Details</h3>
          <div className="form-row">
            <div className="field-group">
              <label className="field-label">Unit / Station</label>
              <select className="field-input" value={unitName} onChange={e => setUnitName(e.target.value)}>
                <option value="">Select unit...</option>
                {units.map(u => <option key={u.name}>{u.name}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Date</label>
              <input className="field-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Date Label (optional)</label>
            <input className="field-input" value={dateLabel} onChange={e => setDateLabel(e.target.value)}
              placeholder="e.g. 28.04.2025 (8 AM) to 29.04.2025 (8 AM)" />
          </div>
        </div>

        {/* Head Summary */}
        <div className="section-card">
          <h3 className="section-head">📊 Head-wise Summary</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="head-summary-table">
              <thead>
                <tr>
                  <th>HEAD</th>
                  <th>Total Posted</th>
                  <th>Absent</th>
                  <th>Leave</th>
                  <th>Present</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {headSummary.map((h, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{h.head}</td>
                    <td><input value={h.totalPosted} onChange={e => updateHead(idx, "totalPosted", e.target.value)} /></td>
                    <td><input value={h.absent} onChange={e => updateHead(idx, "absent", e.target.value)} /></td>
                    <td><input value={h.leave} onChange={e => updateHead(idx, "leave", e.target.value)} /></td>
                    <td><input value={h.present} onChange={e => updateHead(idx, "present", e.target.value)} /></td>
                    <td><button className="del-btn" onClick={() => removeHead(idx)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {addingHeadRow ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input className="field-input" placeholder="Head name..." value={newHeadName}
                onChange={e => setNewHeadName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addHead()} autoFocus style={{ flex: 1, padding: '8px 12px', fontSize: 13 }} />
              <button className="add-btn-sm" onClick={addHead}>Add</button>
              <button className="btn-cancel-select" onClick={() => setAddingHeadRow(false)} style={{ padding: '6px 10px' }}>✕</button>
            </div>
          ) : (
            <div className="chittha-add-entry" onClick={() => setAddingHeadRow(true)}>+ Add Head Row</div>
          )}
        </div>

        {/* Sections */}
        {sections.map((sec, secIdx) => (
          <div className="chittha-section" key={secIdx}>
            <div className="chittha-section-header">
              {editingSectionIdx === secIdx ? (
                <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                  <input className="field-input" value={editSectionName}
                    onChange={e => setEditSectionName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && renameSection(secIdx)}
                    autoFocus style={{ padding: '6px 10px', fontSize: 14, flex: 1 }} />
                  <button className="add-btn-sm" onClick={() => renameSection(secIdx)}>Save</button>
                  <button className="btn-cancel-select" onClick={() => setEditingSectionIdx(null)} style={{ padding: '6px 10px' }}>✕</button>
                </div>
              ) : (
                <>
                  <div className="chittha-section-title">{sec.title}</div>
                  <div className="chittha-section-actions">
                    <button className="edit-btn" onClick={() => { setEditingSectionIdx(secIdx); setEditSectionName(sec.title); }}>✏️</button>
                    <button className="del-btn" onClick={() => removeSection(secIdx)}>🗑️</button>
                  </div>
                </>
              )}
            </div>

            {/* Entries */}
            {sec.entries.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table className="chittha-print-table" style={{ marginBottom: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>S.N.</th>
                      <th>Rank</th>
                      <th>Name</th>
                      <th>No.</th>
                      <th>Remarks</th>
                      <th>Mobile</th>
                      <th style={{ width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sec.entries.map((entry, eIdx) => (
                      <tr key={eIdx}>
                        <td style={{ textAlign: 'center' }}>{entry.sn}</td>
                        <td>{entry.rank}</td>
                        <td style={{ fontWeight: 600 }}>{entry.name}</td>
                        <td>{entry.beltNo}</td>
                        <td>
                          <input className="field-input" value={entry.remarks}
                            onChange={e => updateEntryRemark(secIdx, eIdx, e.target.value)}
                            placeholder="Remarks..." style={{ padding: '4px 8px', fontSize: 12, border: '1px solid var(--border)' }} />
                        </td>
                        <td>{entry.mobile}</td>
                        <td><button className="del-btn" onClick={() => removeEntry(secIdx, eIdx)}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="chittha-add-entry" onClick={() => openPicker(secIdx)}>
              + Add Officer from Database
            </div>
          </div>
        ))}

        {/* Add Section */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <input className="field-input" placeholder="New section name (e.g. SHO, Investigation Unit...)"
            value={addingSectionName} onChange={e => setAddingSectionName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addSection()} />
          <button className="add-btn-sm" onClick={addSection} style={{ flexShrink: 0 }}>+ Add Section</button>
        </div>

        {/* Save button */}
        <button className="btn-save" onClick={save} disabled={saving} style={{ marginTop: 24 }}>
          {saving ? "Saving..." : isEdit ? "💾 Update Chittha" : "✅ Create Chittha"}
        </button>
      </div>

      {/* Officer Picker Modal */}
      {pickerOpen && (
        <div className="officer-picker-overlay" onClick={() => setPickerOpen(false)}>
          <div className="officer-picker" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Select Officer</h2>
            <input className="search-input" placeholder="🔍 Search name, belt no, rank..."
              value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} autoFocus style={{ marginBottom: 0 }} />
            <div className="officer-picker-list">
              {!officersLoaded ? (
                <div className="loading-text">Loading officers...</div>
              ) : filteredPickers.length === 0 ? (
                <div className="empty-text" style={{ padding: 20 }}>No officers found</div>
              ) : (
                filteredPickers.map(o => (
                  <div className="officer-picker-item" key={o.id} onClick={() => { addOfficerEntry(o); }}>
                    <div className="officer-avatar" style={{ fontSize: 24 }}>{o.gender === "Female" ? "👮‍♀️" : "👮"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--navy)' }}>{o.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{o.rank} • {o.badgeNo || "—"} • {o.mobile || "—"}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setPickerOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
