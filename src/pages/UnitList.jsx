import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useDistrict } from "../DistrictContext";

export default function UnitList() {
    const { district, isAdmin } = useDistrict();
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const nav = useNavigate();

    useEffect(() => {
        if (!district) return;
        loadUnits();
    }, [district]);

    const loadUnits = async () => {
        setLoading(true);
        try {
            let q;
            if (district === "Overall") {
                q = collection(db, "units");
            } else {
                q = query(collection(db, "units"), where("district", "==", district));
            }
            const snap = await getDocs(q);
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Group by district if Overall
            if (district === "Overall") {
                const grouped = items.reduce((acc, unit) => {
                    const dist = unit.district || "Unknown";
                    if (!acc[dist]) acc[dist] = [];
                    acc[dist].push(unit);
                    return acc;
                }, {});
                setUnits(grouped);
            } else {
                setUnits(items);
            }
        } catch (err) {
            console.error("Error loading units:", err);
        }
        setLoading(false);
    };

    return (
        <div className="page">
            <div className="topbar">
                <button className="icon-btn" onClick={() => nav("/")}>← Back</button>
                <span className="topbar-title">{district === "Overall" ? "All Units" : `${district} Units`}</span>
                <div />
            </div>

            <div className="page-content">
                <h2 className="page-heading">🏢 Active Units</h2>
                <p className="page-sub">
                    {district === "Overall" ? "State-wide unit overview grouped by district" : `${district} District — List of all units`}
                </p>

                {loading ? (
                    <div className="loading-text">Loading units...</div>
                ) : district === "Overall" ? (
                    Object.entries(units).map(([dist, distUnits]) => (
                        <div key={dist} style={{ marginBottom: 24 }}>
                            <h3 className="section-title" style={{ color: 'var(--blue)', borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>{dist}</h3>
                            <div className="unit-grid">
                                {distUnits.map(u => (
                                    <div className="unit-card" key={u.id} onClick={() => nav(`/officers?unit=${encodeURIComponent(u.name)}`)}>
                                        <div className="unit-name">{u.name}</div>
                                        <div className="unit-type">{u.type}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : units.length === 0 ? (
                    <div className="empty-text">No active units found for this district.</div>
                ) : (
                    <div className="unit-grid">
                        {units.map(u => (
                            <div className="unit-card" key={u.id} onClick={() => nav(`/officers?unit=${encodeURIComponent(u.name)}`)}>
                                <div className="unit-name">{u.name}</div>
                                <div className="unit-type">{u.type}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
