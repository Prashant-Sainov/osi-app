import { useState, useEffect } from "react";
import {
    collection, getDocs, doc, setDoc, deleteDoc, updateDoc
} from "firebase/firestore";
import {
    createUserWithEmailAndPassword, getAuth
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useDistrict, ALL_DISTRICTS } from "../DistrictContext";

export default function AdminUsers() {
    const { isAdmin } = useDistrict();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newDistrict, setNewDistrict] = useState("Hisar");
    const [newRole, setNewRole] = useState("user");
    const [creating, setCreating] = useState(false);
    const nav = useNavigate();

    useEffect(() => {
        if (!isAdmin) { nav("/"); return; }
        loadUsers();
    }, [isAdmin]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "users"));
            setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
        } catch (err) {
            console.error("Error loading users:", err);
        }
        setLoading(false);
    };

    const createUser = async () => {
        if (!newEmail || !newPassword) {
            alert("Email and password are required"); return;
        }
        if (newPassword.length < 6) {
            alert("Password must be at least 6 characters"); return;
        }
        setCreating(true);
        try {
            // Note: Creating users from the client side will sign in as the new user.
            // In a production app, you'd use Firebase Admin SDK on a server.
            // For now, we'll just create the Firestore user profile document.
            // The user can then register themselves via the login page.

            // Create user profile in Firestore (they'll register via login page)
            const userId = `pending_${Date.now()}`;
            await setDoc(doc(db, "users", userId), {
                email: newEmail,
                district: newDistrict,
                role: newRole,
                createdAt: new Date().toISOString(),
                status: "pending_registration",
            });

            alert(
                `User profile created!\n\n` +
                `Email: ${newEmail}\n` +
                `District: ${newDistrict}\n` +
                `Role: ${newRole}\n\n` +
                `Ask the user to register at the login page with this email. ` +
                `Their district and role will be automatically assigned.`
            );

            setNewEmail(""); setNewPassword(""); setShowAdd(false);
            loadUsers();
        } catch (err) {
            alert("Error creating user: " + err.message);
        }
        setCreating(false);
    };

    const deleteUser = async (uid, email) => {
        if (!window.confirm(`Delete user ${email}? This only removes their profile, not their Firebase Auth account.`)) return;
        await deleteDoc(doc(db, "users", uid));
        setUsers(prev => prev.filter(u => u.uid !== uid));
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
                <button className="btn-add" onClick={() => setShowAdd(!showAdd)}>
                    {showAdd ? "✕ Close" : "+ Add User"}
                </button>
            </div>

            <div className="page-content">
                <h2 className="page-heading">👥 User Management</h2>
                <p className="page-sub">Admin Panel — Manage user accounts and district assignments</p>

                {/* Add User Form */}
                {showAdd && (
                    <div className="section-card" style={{ marginBottom: 20 }}>
                        <h3 className="section-head">➕ Add New User</h3>
                        <div className="field-group">
                            <label className="field-label">Email</label>
                            <input className="field-input" type="email" value={newEmail}
                                onChange={e => setNewEmail(e.target.value)} placeholder="user@email.com" />
                        </div>
                        <div className="field-group">
                            <label className="field-label">Temporary Password</label>
                            <input className="field-input" type="text" value={newPassword}
                                onChange={e => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
                        </div>
                        <div className="field-group">
                            <label className="field-label">Assign District</label>
                            <select className="field-input" value={newDistrict}
                                onChange={e => setNewDistrict(e.target.value)}>
                                {ALL_DISTRICTS.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="field-group">
                            <label className="field-label">Role</label>
                            <select className="field-input" value={newRole}
                                onChange={e => setNewRole(e.target.value)}>
                                <option value="user">District User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <button className="btn-save" onClick={createUser} disabled={creating}>
                            {creating ? "Creating..." : "Create User Profile"}
                        </button>
                    </div>
                )}

                {/* User List */}
                {loading ? (
                    <div className="loading-text">Loading users...</div>
                ) : (
                    <div>
                        {users.map(u => (
                            <div className="admin-user-card" key={u.uid}>
                                <div style={{ fontSize: 28 }}>👤</div>
                                <div className="admin-user-info">
                                    <div className="admin-user-email">{u.email}</div>
                                    <div className="admin-user-role">
                                        <span className={`role-badge ${u.role}`}>{u.role}</span>
                                        <select
                                            value={u.district || ""}
                                            onChange={e => changeDistrict(u.uid, e.target.value)}
                                            style={{
                                                fontSize: 11, padding: "2px 6px", border: "1px solid #e0e4ea",
                                                borderRadius: 6, background: "#f8f9fb", color: "#1d2b3e",
                                                cursor: "pointer"
                                            }}
                                        >
                                            {ALL_DISTRICTS.map(d => <option key={d}>{d}</option>)}
                                        </select>
                                        {u.status === "pending_registration" && (
                                            <span style={{ color: "#d97a1d", fontSize: 10, fontWeight: 700 }}>PENDING</span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                    <button className="edit-btn" onClick={() => changeRole(u.uid, u.role)}
                                        title={`Switch to ${u.role === "admin" ? "user" : "admin"}`}>
                                        🔄
                                    </button>
                                    <button className="del-btn" onClick={() => deleteUser(u.uid, u.email)}>🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
