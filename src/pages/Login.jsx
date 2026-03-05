import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { ALL_DISTRICTS } from "../DistrictContext";

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [district, setDistrict] = useState("Hisar");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));

      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.status === "pending") {
          await signOut(auth);
          setMessage("Your registration request is pending admin approval. Please wait for an email confirmation.");
        }
      } else {
        // This case shouldn't normally happen with the request flow
        setError("User profile not found. Please contact admin.");
        await signOut(auth);
      }
    } catch (err) {
      setError(err.message.includes("auth/user-not-found") || err.message.includes("auth/wrong-password")
        ? "Invalid email or password"
        : err.message);
    }
    setLoading(false);
  };

  const handleRegisterRequest = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!name || !mobile || !email || !password) {
      setError("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      // Create Auth account
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Create Pending Profile in Firestore
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email,
        name,
        mobile,
        district,
        role: "user",
        status: "pending",
        createdAt: new Date().toISOString()
      });

      setMessage("Registration request sent successfully! Please wait for admin approval before logging in.");
      setIsRegistering(false);
      await signOut(auth);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <span className="login-badge">🚔</span>
        <h1 className="login-title">State Police</h1>
        <p className="login-sub">Personnel Management System</p>

        {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}
        {message && <div style={{ background: '#e6f7ef', color: '#1a9d5c', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{message}</div>}

        {!isRegistering ? (
          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Authenticating..." : "Login"}
            </button>
            <button type="button" className="link-btn" onClick={() => { setIsRegistering(true); setError(""); setMessage(""); }}>
              New User? Request Registration
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleRegisterRequest}>
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Mobile Number</label>
              <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Select District</label>
              <select
                className="field-input"
                style={{ height: 45, background: 'var(--surface2)' }}
                value={district}
                onChange={e => setDistrict(e.target.value)}
              >
                {ALL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Sending Request..." : "Submit Request"}
            </button>
            <button type="button" className="link-btn" onClick={() => setIsRegistering(false)}>
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}