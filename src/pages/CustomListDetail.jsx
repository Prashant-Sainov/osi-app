import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { collection, query, where, getDocs, documentId } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";

export default function CustomListDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const [listData, setListData] = useState(null);
    const [officers, setOfficers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadList();
    }, [id]);

    const loadList = async () => {
        setLoading(true);
        try {
            const listSnap = await getDoc(doc(db, "customLists", id));
            if (!listSnap.exists()) { setLoading(false); return; }

            const data = { id: listSnap.id, ...listSnap.data() };
            setListData(data);

            const ids = data.officerIds || [];
            if (ids.length === 0) { setOfficers([]); setLoading(false); return; }

            // Firestore "in" queries support max 30 values; batch them
            const allOfficers = [];
            for (let i = 0; i < ids.length; i += 30) {
                const batch = ids.slice(i, i + 30);
                const q = query(collection(db, "officers"), where(documentId(), "in", batch));
                const snap = await getDocs(q);
                snap.docs.forEach(d => allOfficers.push({ id: d.id, ...d.data() }));
            }
            setOfficers(allOfficers);
        } catch (err) {
            console.error("Error loading list:", err);
        }
        setLoading(false);
    };

    const removeFromList = async (officerId) => {
        if (!window.confirm("Remove this officer from the list?")) return;
        await updateDoc(doc(db, "customLists", id), {
            officerIds: arrayRemove(officerId),
            count: (listData.officerIds.length - 1),
        });
        setOfficers(prev => prev.filter(o => o.id !== officerId));
        setListData(prev => ({
            ...prev,
            officerIds: prev.officerIds.filter(i => i !== officerId),
        }));
    };

    const downloadCSV = () => {
        if (officers.length === 0) return;
        const headers = ["Name", "Rank", "Belt No", "Gender", "Mobile", "Unit", "Sub Unit", "District"];
        const rows = officers.map(o => [
            o.name || "", o.rank || "", o.badgeNo || "", o.gender || "",
            o.mobile || "", o.unit || "", o.subUnit || "", o.district || ""
        ]);
        const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${listData?.name || "list"}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return <div className="loading-text">Loading list...</div>;
    if (!listData) return <div className="loading-text">List not found.</div>;

    return (
        <div className="page">
            <div className="topbar">
                <button className="icon-btn" onClick={() => nav("/lists")}>← Back</button>
                <span className="topbar-title">{listData.name}</span>
                <button className="btn-add" onClick={downloadCSV}>⬇ CSV</button>
            </div>

            <div className="page-content">
                <h2 className="page-heading">📑 {listData.name}</h2>
                <p className="page-sub">
                    {officers.length} officer{officers.length !== 1 ? "s" : ""} •
                    Created {new Date(listData.createdAt).toLocaleDateString("en-IN")}
                </p>

                {officers.length === 0 ? (
                    <div className="empty-text">This list is empty.</div>
                ) : (
                    <div className="officer-list">
                        {officers.map(o => (
                            <div className="officer-card" key={o.id}>
                                <div className="officer-avatar">{o.gender === "Female" ? "👮‍♀️" : "👮"}</div>
                                <div className="officer-info" onClick={() => nav(`/officers/${o.id}`)}>
                                    <div className="officer-name">{o.name}</div>
                                    <div className="officer-rank">{o.rank} • {o.badgeNo || "—"}</div>
                                    <div className="officer-unit">{o.unit || "No unit"}</div>
                                </div>
                                <div className="officer-actions">
                                    <button className="del-btn" title="Remove from list" onClick={() => removeFromList(o.id)}>✕</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
