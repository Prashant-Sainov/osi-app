import { useState, useEffect } from "react";
import {
    collection, getDocs, doc, setDoc, deleteDoc, updateDoc, writeBatch, addDoc, query, where
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useDistrict, ALL_DISTRICTS } from "../DistrictContext";
import { generateSearchGrams } from "../utils/search";
import { updateUnitGlobally, removeUnitGlobally } from "../utils/consistency";
import { DROPDOWNS } from "../dropdownData";

export default function AdminUsers() {
    const { isAdmin, loading: authLoading } = useDistrict();
    const [users, setUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [units, setUnits] = useState([]);
    const [leaveUsers, setLeaveUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("active"); // "active", "pending", "units", "leave"
    const [reindexing, setReindexing] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [unitFilterDist, setUnitFilterDist] = useState("Hisar");
    const nav = useNavigate();

    useEffect(() => {
        if (authLoading) return;
        if (!isAdmin) {
            console.log("Not an admin, redirecting...");
            nav("/");
            return;
        }
        loadAllData();
    }, [isAdmin, authLoading]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "users"));
            const all = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
            setUsers(all.filter(u => u.status !== "pending"));
            setPendingUsers(all.filter(u => u.status === "pending"));

            const unitSnap = await getDocs(collection(db, "units"));
            setUnits(unitSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            const leaveQ = query(collection(db, "officers"), where("status", "==", "On Leave"));
            const leaveSnap = await getDocs(leaveQ);
            setLeaveUsers(leaveSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error("Error loading data:", err);
        }
        setLoading(false);
    };

    const approveUser = async (u) => {
        if (!window.confirm(`Approve registration for ${u.name} (${u.email})?`)) return;
        try {
            await updateDoc(doc(db, "users", u.uid), { status: "active", role: "user" });
            alert(`User approved! They can now log in.`);
            loadAllData();
        } catch (err) { alert("Error approving user: " + err.message); }
    };

    const deleteUser = async (uid, email) => {
        if (!window.confirm(`Permanently delete account for ${email}?`)) return;
        try {
            await deleteDoc(doc(db, "users", uid));
            loadAllData();
        } catch (err) { console.error("Error deleting user doc:", err); }
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
        if (!window.confirm("This will update search data for ALL officers to make them searchable. Proceed?")) return;
        setReindexing(true);
        try {
            const snap = await getDocs(collection(db, "officers"));
            const batch = writeBatch(db);
            let count = 0;
            snap.docs.forEach(d => {
                const data = d.data();
                const grams = generateSearchGrams(data.name, data.badgeNo, data.mobile);
                batch.update(doc(db, "officers", d.id), { _searchGrams: grams });
                count++;
            });
            await batch.commit();
            alert(`Successfully re-indexed ${count} officers! Search is now working perfectly.`);
        } catch (err) { alert("Error re-indexing: " + err.message); }
        setReindexing(false);
    };

    const repairStats = async () => {
        if (!window.confirm("Recalculate all district statistics (counts)?")) return;
        setLoading(true);
        try {
            const offSnap = await getDocs(collection(db, "officers"));
            const unitSnap = await getDocs(collection(db, "units"));

            const distStats = {};
            ALL_DISTRICTS.forEach(d => {
                distStats[d] = { total: 0, male: 0, female: 0, units: 0, onLeave: 0 };
            });

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
                if (distStats[u.district]) {
                    distStats[u.district].units++;
                }
            });

            const batch = writeBatch(db);
            for (const [d, s] of Object.entries(distStats)) {
                batch.set(doc(db, "districts", d), { stats: s }, { merge: true });
            }
            await batch.commit();
            alert("Statistics repaired successfully!");
            loadAllData();
        } catch (err) {
            alert("Error repairing stats: " + err.message);
        }
        setLoading(false);
    };

    const seedDefaultUnits = async () => {
        if (!window.confirm("Import default units from the system configuration into the database?")) return;
        setLoading(true);
        try {
            let count = 0;
            for (const [type, names] of Object.entries(DROPDOWNS.unit)) {
                for (const name of names) {
                    await addDoc(collection(db, "units"), {
                        name,
                        type,
                        district: unitFilterDist // Import into selected district
                    });
                    count++;
                }
            }
            await updateDoc(doc(db, "districts", unitFilterDist), {
                "stats.units": increment(count)
            });
            alert(`Imported ${count} units into ${unitFilterDist}!`);
            loadAllData();
        } catch (err) {
            alert("Error seeding units: " + err.message);
        }
        setLoading(false);
    };

    const saveUnit = async (e) => {
        e.preventDefault();
        const f = e.target;
        const name = f.unitName.value.trim();
        const type = f.unitType.value;
        const dist = f.unitDistrict.value;
        if (!name || !type || !dist) return;

        try {
            if (editingUnit?.id) {
                await updateDoc(doc(db, "units", editingUnit.id), { name, type, district: dist });
                if (editingUnit.name !== name) {
                    await updateUnitGlobally(editingUnit.name, name, dist);
                }
            } else {
                await addDoc(collection(db, "units"), { name, type, district: dist });
                try {
                    await updateDoc(doc(db, "districts", dist), { "stats.units": increment(1) });
                } catch (e) {
                    // Districts doc might not exist yet, create it if needed or ignore
                }
            }
            setEditingUnit(null);
            loadAllData();
        } catch (err) { alert("Error saving unit: " + err.message); }
    };

    const delUnit = async (id, name, dist) => {
        if (!window.confirm(`Delete unit "${name}"? This will remove it from all assigned officers.`)) return;
        try {
            await deleteDoc(doc(db, "units", id));
            await removeUnitGlobally(name, dist);
            try {
                await updateDoc(doc(db, "districts", dist), { "stats.units": increment(-1) });
            } catch (e) { }
            loadAllData();
        } catch (err) { alert("Error deleting unit: " + err.message); }
    };

    if (!isAdmin) return null;

    const filteredUnits = units.filter(u => u.district === unitFilterDist);

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
                    <button className={`btn-select-mode ${tab === "active" ? "active" : ""}`} onClick={() => setTab("active")} style={{ flexShrink: 0 }}>
                        Active ({users.length})
                    </button>
                    <button className={`btn-select-mode ${tab === "pending" ? "active" : ""}`} onClick={() => setTab("pending")} style={{ flexShrink: 0 }}>
                        Requested ({pendingUsers.length})
                    </button>
                    <button className={`btn-select-mode ${tab === "units" ? "active" : ""}`} onClick={() => setTab("units")} style={{ flexShrink: 0 }}>
                        Units ({units.length})
                    </button>
                    <button className={`btn-select-mode ${tab === "leave" ? "active" : ""}`} onClick={() => setTab("leave")} style={{ flexShrink: 0 }}>
                        On Leave ({leaveUsers.length})
                    </button>
                </div>

                {loading || authLoading ? <div className="loading-text">Fetching records...</div> : (
                    <div>
                        {tab === "active" && (
                            <div>
                                <div style={{ marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
                                                <select value={u.district || ""} onChange={e => changeDistrict(u.uid, e.target.value)} className="filter-select" style={{ width: 'auto', padding: '2px 8px', height: 24, fontSize: 11, background: 'var(--surface2)' }}>
                                                    {ALL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </div>
                                            <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{u.email}</div>
                                        </div>
                                        <div style={{ display: "flex", gap: 10 }}>
                                            <button className="edit-btn" onClick={() => changeRole(u.uid, u.role)} title="Toggle Admin">🔄</button>
                                            <button className="del-btn" style={{ color: 'var(--red)' }} onClick={() => deleteUser(u.uid, u.email)}>🗑️</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {tab === "pending" && (
                            pendingUsers.length === 0 ? <div className="empty-text">No pending registrations</div> : (
                                pendingUsers.map(u => (
                                    <div className="admin-user-card" key={u.uid} style={{ border: '1.5px solid var(--orange)', background: 'white' }}>
                                        <div className="admin-user-info">
                                            <div className="admin-user-email" style={{ color: 'var(--orange)' }}>{u.name}</div>
                                            <div className="admin-user-role">Requested Access: <b>{u.district}</b></div>
                                            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{u.email} • {u.mobile}</div>
                                        </div>
                                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                            <button className="btn-add" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => approveUser(u)}>Approve</button>
                                            <button className="del-btn" style={{ color: 'var(--red)', fontSize: 20 }} onClick={() => deleteUser(u.uid, u.email)}>✕</button>
                                        </div>
                                    </div>
                                ))
                            )
                        )}

                        {tab === "units" && (
                            <div>
                                <select className="filter-select" value={unitFilterDist} onChange={e => setUnitFilterDist(e.target.value)} style={{ marginBottom: 16, width: '100%' }}>
                                    {ALL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)' }}>Units in {unitFilterDist}</span>
                                    <button onClick={seedDefaultUnits} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
                                        ⚡ Import All Defaults
                                    </button>
                                </div>

                                <form onSubmit={saveUnit} className="section-card" style={{ marginBottom: 20 }}>
                                    <h3 className="section-head">{editingUnit ? "Edit Unit" : "Add New Unit"}</h3>
                                    <div className="field-group">
                                        <input className="field-input" name="unitName" defaultValue={editingUnit?.name || ""} placeholder="Unit Name" required />
                                    </div>
                                    <div className="field-group">
                                        <select className="field-input" name="unitType" defaultValue={editingUnit?.type || DROPDOWNS.typeOfUnit[0]}>
                                            {DROPDOWNS.typeOfUnit.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <input type="hidden" name="unitDistrict" value={unitFilterDist} />
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button className="btn-save" type="submit" style={{ flex: 1, padding: 10 }}>
                                            {editingUnit ? "Save Changes" : "Create Unit"}
                                        </button>
                                        {editingUnit && (
                                            <button className="btn-save" type="button" onClick={() => setEditingUnit(null)} style={{ flex: 1, padding: 10, background: 'var(--surface2)', color: 'var(--text-dim)' }}>
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>

                                <div className="unit-grid">
                                    {filteredUnits.length === 0 && <div className="empty-text" style={{ gridColumn: '1 / -1' }}>No units in {unitFilterDist}</div>}
                                    {filteredUnits.map(u => (
                                        <div className="unit-card" key={u.id}>
                                            <div className="unit-name">{u.name}</div>
                                            <div className="unit-type">{u.type}</div>
                                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                                <button className="edit-btn" onClick={() => setEditingUnit(u)}>✏️</button>
                                                <button className="del-btn" onClick={() => delUnit(u.id, u.name, u.district)} style={{ color: 'var(--red)' }}>🗑️</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {tab === "leave" && (
                            <div className="officer-list">
                                {leaveUsers.length === 0 && <div className="empty-text">No active leave records found.</div>}
                                {leaveUsers.map(o => (
                                    <div className="officer-card" key={o.id}>
                                        <div className="officer-avatar">{o.gender === "Female" ? "👮‍♀️" : "👮"}</div>
                                        <div className="officer-info">
                                            <div className="officer-name">{o.name} <span className="status-badge on-leave">On Leave</span></div>
                                            <div className="officer-rank">{o.rank} • {o.badgeNo || "—"}</div>
                                            <div className="officer-unit">{o.unit} ({o.district})</div>
                                            {o.remarks && <div style={{ fontSize: 10, color: 'var(--orange)', marginTop: 4 }}>Note: {o.remarks}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
