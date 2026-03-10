import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";

const Row = ({ label, value }) => value ? (
  <div className="detail-row">
    <span className="detail-label">{label}</span>
    <span className="detail-value">{value}</span>
  </div>
) : null;

export default function OfficerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [o, setO] = useState(null);

  useEffect(() => {
    getDoc(doc(db, "officers", id)).then(d => {
      if (d.exists()) setO({ id: d.id, ...d.data() });
    });
  }, [id]);

  if (!o) return <div className="loading-text">Loading...</div>;

  return (
    <div className="page">
      <div className="topbar">
        <button className="icon-btn" onClick={() => nav(-1)}>← Back</button>
        <span className="topbar-title">Officer Profile</span>
        <button className="icon-btn" onClick={() => nav(`/officers/edit/${id}`)}>✏️ Edit</button>
      </div>

      <div className="page-content">
        <div className="profile-header">
          <div className="profile-avatar">{o.gender === "Female" ? "👮‍♀️" : "👮"}</div>
          <h2 className="profile-name">{o.name}</h2>
          <div className="profile-rank">{o.rank}</div>
          {o.badgeNo && <div className="profile-badge">Belt No: {o.badgeNo}</div>}
          {o.district && <div className="profile-district">📍 {o.district} District</div>}
        </div>

        <div className="section-card">
          <h3 className="section-head">📞 Contact</h3>
          <Row label="Mobile" value={o.mobile} />
          <Row label="Belt No" value={o.badgeNo} />
          <Row label="Father's Name" value={o.fatherName} />
        </div>

        <div className="section-card">
          <h3 className="section-head">👤 Personal</h3>
          <Row label="Date of Birth" value={o.dob} />
          <Row label="Gender" value={o.gender} />
          <Row label="Religion" value={o.religion} />
          <Row label="Caste" value={o.caste} />
          <Row label="Category" value={o.category} />
          <Row label="Home District" value={o.homeDistrict} />
          <Row label="Village" value={o.village} />
        </div>

        <div className="section-card">
          <h3 className="section-head">🏢 Service</h3>
          <Row label="Cadre" value={o.cadre} />
          <Row label="Status" value={o.permanentTemporary} />
          <Row label="Date of Enrollment" value={o.doe} />
          <Row label="Date of Retirement" value={o.dor} />
          <Row label="Education" value={o.education} />
          <Row label="Post Graduation" value={o.postGrad} />
        </div>

        <div className="section-card">
          <h3 className="section-head">📍 Posting</h3>
          <Row label="District" value={o.district} />
          <Row label="Unit" value={o.unit} />
          <Row label="Sub-Unit" value={o.subUnit} />
          <Row label="Date of Posting" value={o.dop} />
          <Row label="Role 1" value={o.role1} />
          <Row label="Role 2" value={o.role2} />
          <Row label="IO" value={o.io} />
        </div>

        {o.remarks && (
          <div className="section-card">
            <h3 className="section-head">📝 Remarks</h3>
            <p className="remarks-text">{o.remarks}</p>
          </div>
        )}
      </div>
    </div>
  );
}