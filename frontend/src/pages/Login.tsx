import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Email and password required");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate("/chat");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 40%, #0f172a 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "60%",
          height: "60%",
          top: "-20%",
          right: "-10%",
          background: "radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "50%",
          height: "50%",
          bottom: "-20%",
          left: "-10%",
          background: "radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
          borderRadius: 24,
          padding: 48,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: "2rem",
            fontWeight: 700,
            background: "linear-gradient(90deg, #a855f7, #ec4899)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 8,
          }}
        >
          Chat App
        </h1>
        <p style={{ textAlign: "center", color: "#94a3b8", marginBottom: 32 }}>
          Welcome back — sign in to continue
        </p>
        {error && (
          <div
            style={{
              background: "rgba(239,68,68,0.2)",
              color: "#fca5a5",
              padding: "12px 16px",
              borderRadius: 12,
              marginBottom: 24,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: 8, color: "#94a3b8", fontSize: 14 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              width: "100%",
              padding: "14px 18px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(0,0,0,0.2)",
              color: "#f1f5f9",
              fontSize: 16,
              marginBottom: 20,
            }}
          />
          <label style={{ display: "block", marginBottom: 8, color: "#94a3b8", fontSize: 14 }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{
              width: "100%",
              padding: "14px 18px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(0,0,0,0.2)",
              color: "#f1f5f9",
              fontSize: 16,
              marginBottom: 28,
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(90deg, #a855f7, #ec4899)",
              color: "white",
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 24, color: "#94a3b8", fontSize: 14 }}>
          No account?{" "}
          <Link to="/signup" style={{ color: "#06b6d4", fontWeight: 600 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
