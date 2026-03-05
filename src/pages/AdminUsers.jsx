import { useState, useEffect } from "react";
import {
    collection, getDocs, doc, setDoc, deleteDoc, updateDoc, writeBatch
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useDistrict, ALL_DISTRICTS } from "../DistrictContext";
import { generateSearchGrams } from "../utils/search";

export default function AdminUsers() {
    const { isAdmin } = useDistrict();
    const [users, setUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("active");
    const [reindexing, setReindexing] = useState(false);
    const nav = useNavigate();

    useEffect(() => {
        if (!isAdmin) { nav("/"); return; }
        loadUsers();
    }, [isAdmin]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "users"));
            const all = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
            setUsers(all.filter(u => u.status !== "pending"));
            setPendingUsers(all.filter(u => u.status === "pending"));
        } catch (err) {
            console.error("Error loading users:", err);
        }
        setLoading(false);
    };

    const approveUser = async (u) => {
        if (!window.confirm(`Approve registration for ${u.name} (${u.email})?`)) return;
        try {
            await updateDoc(doc(db, "users", u.uid), {
                status: "active",
                role: "user"
            });
            alert(`User approved! They can now log in.`);
            loadUsers();
        } catch (err) {
            alert("Error approving user: " + err.message);
        }
    };

    const deleteUser = async (uid, email) => {
        if (!window.confirm(`Permanently delete account for ${email}?`)) return;
        try {
            await deleteDoc(doc(db, "users", uid));
            loadUsers();
        } catch (err) {
            console.error("Error deleting user doc:", err);
        }
    };

    const changeRole = async (uid, currentRole) => {
        const newR = currentRole === "admin" ? "user" : "admin";
        if (!window.confirm(`Change role to ${newR}?`)) return;
        await updateDoc(doc(db, "users", uid), { role: newR });
        loadUsers();
    };

    const changeDistrict = async (uid, newDist) => {
        await updateDoc(doc(db, "users", uid), { district: newDist });
        loadUsers();
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
        } catch (err) {
            alert("Error re-indexing: " + err.message);
        }
        setReindexing(false);
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
                <h2 className="page-heading">User & Data Management</h2>

                <div className="filter-row" style={{ marginBottom: 16 }}>
                    <button
                        className={`btn-select-mode ${tab === "active" ? "active" : ""}`}
                        style={{ flex: 1 }}
                        onClick={() => setTab("active")}
                    >
                        Active ({users.length})
                    </button>
                    <button
                        className={`btn-select-mode ${tab === "pending" ? "active" : ""}`}
                        style={{ flex: 1 }}
                        onClick={() => setTab("pending")}
                    >
                        Requested ({pendingUsers.length})
                    </button>
                </div>

                {tab === "active" && (
                    <div style={{ marginBottom: 20 }}>
                        <button className="btn-load-more" onClick={reindexSearch} disabled={reindexing} style={{ color: 'var(--navy)', borderColor: 'var(--navy)', marginBottom: 20 }}>
                            {reindexing ? "⚙️ Re-calculating Index..." : "🛠️ Repair & Upgrade Search Logic"}
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="loading-text">Fetching records...</div>
                ) : (
                    <div>
                        {tab === "active" ? (
                            users.map(u => (
                                <div className="admin-user-card" key={u.uid}>
                                    <div className="admin-user-info">
                                        <div className="admin-user-email">{u.name || "Police User"}</div>
                                        <div className="admin-user-role">
                                            <span className={`role-badge ${u.role}`}>{u.role}</span>
                                            <select
                                                value={u.district || ""}
                                                onChange={e => changeDistrict(u.uid, e.target.value)}
                                                className="filter-select"
                                                style={{ width: 'auto', padding: '2px 8px', height: 24, fontSize: 11, background: 'var(--surface2)' }}
                                            >
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
                            ))
                        ) : (
                            pendingUsers.length === 0 ? <div className="empty-text">No pending registrations</div> : (
                                pendingUsers.map(u => (
                                    <div className="admin-user-card" key={u.uid} style={{ border: '1.5px solid var(--orange)', background: 'white' }}>
                                        <div className="admin-user-info">
                                            <div className="admin-user-email" style={{ color: 'var(--orange)' }}>{u.name}</div>
                                            <div className="admin-user-role">Requested Access: <b>{u.district}</b></div>
                                            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{u.email} • {u.mobile}</div>
                                        </div>
                                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                            <button
                                                className="btn-add"
                                                style={{ padding: '8px 16px', fontSize: 13 }}
                                                onClick={() => approveUser(u)}
                                            >
                                                Approve
                                            </button>
                                            <button className="del-btn" style={{ color: 'var(--red)', fontSize: 20 }} onClick={() => deleteUser(u.uid, u.email)}>✕</button>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
