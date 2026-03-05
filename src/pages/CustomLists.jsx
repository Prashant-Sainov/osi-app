import { useState, useEffect } from "react";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useDistrict } from "../DistrictContext";

export default function CustomLists() {
    const { district } = useDistrict();
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const nav = useNavigate();

    useEffect(() => {
        if (!district) return;
        loadLists();
    }, [district]);

    const loadLists = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "customLists"),
                where("district", "==", district)
            );
            const snap = await getDocs(q);
            const items = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
            setLists(items);
        } catch (err) {
            console.error("Error loading lists:", err);
        }
        setLoading(false);
    };

    const deleteList = async (id, name) => {
        if (window.confirm(`Delete list "${name}"?`)) {
            await deleteDoc(doc(db, "customLists", id));
            setLists(prev => prev.filter(l => l.id !== id));
        }
    };

    const formatDate = (iso) => {
        if (!iso) return "";
        const d = new Date(iso);
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
            + " " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="page">
            <div className="topbar">
                <button className="icon-btn" onClick={() => nav("/")}>← Back</button>
                <span className="topbar-title">My Custom Lists</span>
                <div />
            </div>

            <div className="page-content">
                <h2 className="page-heading">📋 Custom Lists</h2>
                <p className="page-sub">{district} District — Saved officer groups</p>

                {loading ? (
                    <div className="loading-text">Loading lists...</div>
                ) : lists.length === 0 ? (
                    <div className="empty-text">
                        No custom lists yet.<br />
                        Go to Officer List, select multiple officers, and save them as a list.
                    </div>
                ) : (
                    <div className="list-grid">
                        {lists.map(l => (
                            <div className="list-card" key={l.id}>
                                <div className="list-card-icon">📑</div>
                                <div className="list-card-info" onClick={() => nav(`/lists/${l.id}`)}>
                                    <div className="list-card-name">{l.name}</div>
                                    <div className="list-card-meta">
                                        {l.count || l.officerIds?.length || 0} officers • {formatDate(l.createdAt)}
                                    </div>
                                </div>
                                <div className="list-card-actions">
                                    <button className="list-action-btn" onClick={() => nav(`/lists/${l.id}`)}>View</button>
                                    <button className="list-action-btn danger" onClick={() => deleteList(l.id, l.name)}>🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
