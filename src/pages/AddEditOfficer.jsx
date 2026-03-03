import { useState, useEffect } from "react";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";
import { DROPDOWNS } from "../dropdownData";

const Field = ({ label, children }) => (
  <div className="field-group">
    <label className="field-label">{label}</label>
    {children}
  </div>
);

const Sel = ({ value, onChange, options, placeholder }) => (
  <select className="field-input" value={value} onChange={e => onChange(e.target.value)}>
    <option value="">{placeholder || "Select..."}</option>
    {options.map(o => <option key={o}>{o}</option>)}
  </select>
);

export default function AddEditOfficer() {
  const { id } = useParams();
  const nav = useNavigate();
  const isEdit = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", badgeNo: "", mobile: "", rank: "", gender: "",
    religion: "", caste: "", category: "", cadre: "",
    permanentTemporary: "", dob: "", doe: "", dor: "", dop: "",
    typeOfUnit: "", unit: "", subUnit: "", role1: "", role2: "",
    homeDistrict: "", village: "", ps: "", education: "",
    subject: "", postGrad: "", subject2: "", fatherName: "",
    io: "", remarks: "", swatCourse: ""
  });

  useEffect(() => {
    if (isEdit) {
      getDoc(doc(db, "officers", id)).then(d => {
        if (d.exists()) setForm({ ...form, ...d.data() });
      });
    }
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.name) { alert("Name is required"); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await updateDoc(doc(db, "officers", id), form);
      } else {
        await addDoc(collection(db, "officers"), {
          ...form, createdAt: new Date().toISOString()
        });
      }
      nav("/officers");
    } catch (err) {
      alert("Error saving: " + err.message);
    }
    setSaving(false);
  };

  const unitOptions = form.typeOfUnit ? (DROPDOWNS.unit[form.typeOfUnit] || []) : [];

  return (
    <div className="page">
      <div className="topbar">
        <button className="icon-btn" onClick={() => nav(-1)}>← Back</button>
        <span className="topbar-title">{isEdit ? "Edit Officer" : "Add Officer"}</span>
        <div />
      </div>

      <div className="page-content">
        <form onSubmit={save}>
          <div className="section-card">
            <h3 className="section-head">👤 Basic Information</h3>
            <Field label="Full Name *">
              <input className="field-input" value={form.name}
                onChange={e => set("name", e.target.value)} placeholder="Enter full name" required />
            </Field>
            <Field label="Badge / PNO">
              <input className="field-input" value={form.badgeNo}
                onChange={e => set("badgeNo", e.target.value)} placeholder="e.g. 1828/HSR" />
            </Field>
            <Field label="Mobile Number">
              <input className="field-input" type="tel" value={form.mobile}
                onChange={e => set("mobile", e.target.value)} placeholder="10-digit mobile" />
            </Field>
            <Field label="Rank">
              <Sel value={form.rank} onChange={v => set("rank", v)} options={DROPDOWNS.rank} />
            </Field>
            <Field label="Gender">
              <Sel value={form.gender} onChange={v => set("gender", v)} options={DROPDOWNS.gender} />
            </Field>
            <Field label="Father's Name">
              <input className="field-input" value={form.fatherName}
                onChange={e => set("fatherName", e.target.value)} placeholder="Father's name" />
            </Field>
          </div>

          <div className="section-card">
            <h3 className="section-head">📋 Personal Details</h3>
            <Field label="Religion">
              <Sel value={form.religion} onChange={v => set("religion", v)} options={DROPDOWNS.religion} />
            </Field>
            <Field label="Caste">
              <Sel value={form.caste} onChange={v => set("caste", v)} options={DROPDOWNS.caste} />
            </Field>
            <Field label="Category">
              <Sel value={form.category} onChange={v => set("category", v)} options={DROPDOWNS.category} />
            </Field>
            <Field label="Date of Birth">
              <input className="field-input" type="date" value={form.dob}
                onChange={e => set("dob", e.target.value)} />
            </Field>
            <Field label="Home District">
              <Sel value={form.homeDistrict} onChange={v => set("homeDistrict", v)} options={DROPDOWNS.homeDistrict} />
            </Field>
            <Field label="Village / Town">
              <input className="field-input" value={form.village}
                onChange={e => set("village", e.target.value)} placeholder="Village or town" />
            </Field>
          </div>

          <div className="section-card">
            <h3 className="section-head">🎓 Education</h3>
            <Field label="Graduation or Below">
              <Sel value={form.education} onChange={v => set("education", v)} options={DROPDOWNS.education} />
            </Field>
            <Field label="Subject">
              <input className="field-input" value={form.subject}
                onChange={e => set("subject", e.target.value)} placeholder="Subject (optional)" />
            </Field>
            <Field label="Post Graduation">
              <Sel value={form.postGrad} onChange={v => set("postGrad", v)}
                options={["LLM","M.Com","M.Phil","M.Sc","M.Tech","MA","MBA","MCA","PhD"]} />
            </Field>
          </div>

          <div className="section-card">
            <h3 className="section-head">🏢 Service Details</h3>
            <Field label="Cadre">
              <Sel value={form.cadre} onChange={v => set("cadre", v)} options={DROPDOWNS.cadre} />
            </Field>
            <Field label="Permanent / Temporary">
              <Sel value={form.permanentTemporary} onChange={v => set("permanentTemporary", v)} options={DROPDOWNS.permanentTemporary} />
            </Field>
            <Field label="Date of Enrollment">
              <input className="field-input" type="date" value={form.doe}
                onChange={e => set("doe", e.target.value)} />
            </Field>
            <Field label="Date of Retirement">
              <input className="field-input" type="date" value={form.dor}
                onChange={e => set("dor", e.target.value)} />
            </Field>
          </div>

          <div className="section-card">
            <h3 className="section-head">📍 Current Posting</h3>
            <Field label="Type of Unit">
              <Sel value={form.typeOfUnit} onChange={v => { set("typeOfUnit", v); set("unit", ""); }}
                options={DROPDOWNS.typeOfUnit} />
            </Field>
            <Field label="Unit">
              <Sel value={form.unit} onChange={v => set("unit", v)} options={unitOptions}
                placeholder={form.typeOfUnit ? "Select unit..." : "Select type first"} />
            </Field>
            <Field label="Sub Unit">
              <input className="field-input" value={form.subUnit}
                onChange={e => set("subUnit", e.target.value)} placeholder="Sub unit name" />
            </Field>
            <Field label="Date of Posting">
              <input className="field-input" type="date" value={form.dop}
                onChange={e => set("dop", e.target.value)} />
            </Field>
            <Field label="Role 1">
              <Sel value={form.role1} onChange={v => set("role1", v)} options={DROPDOWNS.role1} />
            </Field>
            <Field label="Role 2 (Designation)">
              <input className="field-input" value={form.role2}
                onChange={e => set("role2", e.target.value)} placeholder="e.g. SHO, I/C, Head Clerk" />
            </Field>
            <Field label="IO (Investigating Officer)">
              <Sel value={form.io} onChange={v => set("io", v)} options={["Yes", "No"]} />
            </Field>
          </div>

          <div className="section-card">
            <h3 className="section-head">📝 Other</h3>
            <Field label="SWAT / AWT Course">
              <input className="field-input" value={form.swatCourse}
                onChange={e => set("swatCourse", e.target.value)} placeholder="e.g. SWAT-15" />
            </Field>
            <Field label="Remarks">
              <textarea className="field-textarea" value={form.remarks}
                onChange={e => set("remarks", e.target.value)}
                placeholder="Any remarks or leave details..." rows={3} />
            </Field>
          </div>

          <button className="btn-save" type="submit" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "💾 Update Officer" : "✅ Add Officer"}
          </button>
        </form>
      </div>
    </div>
  );
}