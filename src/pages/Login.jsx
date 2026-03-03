import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-badge">🚔</div>
        <h1 className="login-title">Hisar District Police</h1>
        <p className="login-sub">Personnel Management System</p>

        <form onSubmit={handle} className="login-form">
          <div className="input-group">
            <label>Email</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
            />
          </div>
          {error && <div className="error-box">{error}</div>}
          <button className="btn-primary" disabled={loading}>
            {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
          </button>
        </form>

        <button className="link-btn" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Already have account? Login" : "New user? Register here"}
        </button>
      </div>
    </div>
  );
}