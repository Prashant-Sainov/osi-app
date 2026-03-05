import { useState, useEffect } from "react";
import {
    collection, getDocs, doc, setDoc, deleteDoc, updateDoc, query, where
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useDistrict, ALL_DISTRICTS } from "../DistrictContext";

export default function AdminUsers() {
    const { isAdmin } = useDistrict();
    const [users, setUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("active"); // "active" | "pending"
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
                role: "user" // Default role on approval
            });
            alert(`User ${u.email} approved! They can now log in.`);
            loadUsers();
        } catch (err) {
            alert("Error approving user: " + err.message);
        }
    };

    const deleteUser = async (uid, email) => {
        if (!window.confirm(`Delete user ${email}?`)) return;
        await deleteDoc(doc(db, "users", uid));
        loadUsers();
    };

    const changeRole = async (uid, currentRole) => {
        const newR = currentRole === "admin" ? "user" : "admin";
        if (!window.confirm(`Change role to ${newR}?`)) return;
        await updateDoc(doc(db, "users", uid), { role: newR });
        setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newR } : u));
    };

    const changeDistrict = async (uid, newDist) => {
        await updateDoc(doc(db, "users", uid), { district: newDist });
        setUsers(prev => prev.map(u => u.uid === uid ? { ...u, district: newDist } : u));
    };

    if (!isAdmin) return null;

    return (
        <div className="page">
            <div className="topbar">
                <button className="icon-btn" onClick={() => nav("/")}>← Back</button>
                <span className="topbar-title">Manage Users</span>
                <div style={{ width: 40 }} />
            </div>

            <div className="page-content">
                <h2 className="page-heading">👥 User Management</h2>

                <div className="filter-row" style={{ marginBottom: 20 }}>
                    <button
                        className={`btn-select-mode ${tab === "active" ? "active" : ""}`}
                        style={{ flex: 1 }}
                        onClick={() => setTab("active")}
                    >
                        Active Users ({users.length})
                    </button>
                    <button
                        className={`btn-select-mode ${tab === "pending" ? "active" : ""}`}
                        style={{ flex: 1 }}
                        onClick={() => setTab("pending")}
                    >
                        Pending Requests ({pendingUsers.length})
                    </button>
                </div>

                {loading ? (
                    <div className="loading-text">Loading users...</div>
                ) : (
                    <div>
                        {tab === "active" ? (
                            users.length === 0 ? <div className="empty-text">No active users found</div> : (
                                users.map(u => (
                                    <div className="admin-user-card" key={u.uid}>
                                        <div style={{ fontSize: 28 }}>👤</div>
                                        <div className="admin-user-info">
                                            <div className="admin-user-email">{u.name || u.email}</div>
                                            <div className="admin-user-role">
                                                <span className={`role-badge ${u.role}`}>{u.role}</span>
                                                <select
                                                    value={u.district || ""}
                                                    onChange={e => changeDistrict(u.uid, e.target.value)}
                                                    className="filter-select"
                                                    style={{ width: 'auto', padding: '2px 8px', height: 24, fontSize: 11 }}
                                                >
                                                    {ALL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </div>
                                            <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{u.email}</div>
                                        </div>
                                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                            <button className="edit-btn" onClick={() => changeRole(u.uid, u.role)} title="Toggle Admin/User">
                                                🔄
                                            </button>
                                            <button className="del-btn" onClick={() => deleteUser(u.uid, u.email)}>🗑️</button>
                                        </div>
                                    </div>
                                ))
                            )
                        ) : (
                            pendingUsers.length === 0 ? <div className="empty-text">No pending requests</div> : (
                                pendingUsers.map(u => (
                                    <div className="admin-user-card" key={u.uid} style={{ borderColor: 'var(--orange)', background: 'var(--orange-bg)' }}>
                                        <div style={{ fontSize: 28 }}>✋</div>
                                        <div className="admin-user-info">
                                            <div className="admin-user-email">{u.name}</div>
                                            <div className="admin-user-role" style={{ color: 'var(--orange)', fontWeight: 700 }}>
                                                REQUESTED: {u.district}
                                            </div>
                                            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{u.email} • {u.mobile}</div>
                                        </div>
                                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                            <button
                                                className="btn-save"
                                                style={{ padding: '6px 12px', fontSize: 12, width: 'auto', marginTop: 0 }}
                                                onClick={() => approveUser(u)}
                                            >
                                                Approve
                                            </button>
                                            <button className="del-btn" onClick={() => deleteUser(u.uid, u.email)}>✕</button>
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
