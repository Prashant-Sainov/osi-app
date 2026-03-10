import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";

export default function ChitthaView() {
  const { id } = useParams();
  const nav = useNavigate();
  const [chittha, setChittha] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChittha();
  }, [id]);

  const loadChittha = async () => {
    try {
      const snap = await getDoc(doc(db, "chitthas", id));
      if (snap.exists()) setChittha({ id: snap.id, ...snap.data() });
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handlePrint = () => window.print();

  if (loading) return <div className="loading-text">Loading chittha...</div>;
  if (!chittha) return <div className="loading-text">Chittha not found.</div>;

  return (
    <div className="page">
      <div className="topbar no-print">
        <button className="icon-btn" onClick={() => nav("/chitthas")}>← Back</button>
        <span className="topbar-title">{chittha.unitName}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="icon-btn" onClick={() => nav(`/chitthas/edit/${id}`)}>✏️ Edit</button>
          <button className="btn-add" onClick={handlePrint}>🖨️ Print</button>
        </div>
      </div>

      <div className="page-content">
        <div className="chittha-print-view">
          {/* Header */}
          <div className="chittha-print-header">
            <div className="chittha-print-title">{chittha.unitName}</div>
            <div className="chittha-print-date">
              DUTY ROSTER {chittha.dateLabel || chittha.date}
            </div>
          </div>

          {/* Head Summary */}
          {chittha.headSummary && chittha.headSummary.length > 0 && (
            <div className="section-card">
              <table className="chittha-print-table">
                <thead>
                  <tr>
                    <th>HEAD</th>
                    <th>TOTAL POSTED</th>
                    <th>ABSENT</th>
                    <th>LEAVE (CL, EL, HPL, Pat Leave)</th>
                    <th>PRESENT</th>
                  </tr>
                </thead>
                <tbody>
                  {chittha.headSummary.map((h, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{h.head}</td>
                      <td style={{ textAlign: 'center' }}>{h.totalPosted}</td>
                      <td style={{ textAlign: 'center' }}>{h.absent}</td>
                      <td style={{ textAlign: 'center' }}>{h.leave}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{h.present}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sections */}
          {(chittha.sections || []).map((sec, secIdx) => (
            <div key={secIdx} style={{ marginBottom: 20 }}>
              <table className="chittha-print-table">
                <thead>
                  <tr>
                    <td colSpan="6" className="chittha-print-section-title">
                      {sec.title}
                    </td>
                  </tr>
                  {sec.entries.length > 0 && (
                    <tr>
                      <th style={{ width: 50 }}>S.N.</th>
                      <th>RANK</th>
                      <th>NAME</th>
                      <th>NO.</th>
                      <th>REMARKS</th>
                      <th>MOBILE NO.</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {sec.entries.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-faint)', padding: 16 }}>No entries</td></tr>
                  ) : (
                    sec.entries.map((e, eIdx) => (
                      <tr key={eIdx}>
                        <td style={{ textAlign: 'center' }}>{e.sn}</td>
                        <td>{e.rank}</td>
                        <td style={{ fontWeight: 600 }}>{e.name}</td>
                        <td>{e.beltNo}</td>
                        <td>{e.remarks}</td>
                        <td>{e.mobile}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ))}

          {chittha.sections?.length === 0 && (
            <div className="empty-text">No duty sections in this chittha.</div>
          )}
        </div>
      </div>
    </div>
  );
}
