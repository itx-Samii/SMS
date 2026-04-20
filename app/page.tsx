"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, LogIn, ArrowRight, Eye, EyeOff } from "lucide-react";
import RecoveryModal from "./components/RecoveryModal";

export default function Home() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      // Save user to localStorage
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on role
      router.push(`/${role.toLowerCase()}/dashboard`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main suppressHydrationWarning={true} style={{ minHeight: "100vh", display: "flex", backgroundColor: "var(--bg-dark)" }}>
      {/* Left side: Brand/Illustration area (Hidden on mobile) */}
      <div suppressHydrationWarning={true} style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", padding: "4rem" }} className="hide-on-mobile">
         {/* Abstract background shapes */}
         <div suppressHydrationWarning style={{ position: "absolute", top: "-10%", left: "-10%", width: "50%", height: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)" }}></div>
         <div suppressHydrationWarning style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "60%", height: "60%", background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)" }}></div>
         
         <div style={{ position: "relative", zIndex: 10, maxWidth: "600px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem", padding: "0.5rem 1rem", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "99px", border: "1px solid var(--border)" }}>
               <GraduationCap size={20} className="text-gradient" />
               <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Enterprise School Systems</span>
            </div>
            
            <h1 style={{ fontSize: "3.5rem", fontWeight: 800, lineHeight: 1.1, marginBottom: "1.5rem" }}>
              The Next-Gen <br />
              <span className="text-gradient">School Platform</span>
            </h1>
            
            <p style={{ fontSize: "1.1rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "3rem", maxWidth: "480px" }}>
              A unified, deeply-integrated operating system for modern educational institutions. Empowering administrators, engaging teachers, and inspiring students.
            </p>

            <div style={{ display: "flex", gap: "2rem" }}>
               <div>
                  <h4 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>4+</h4>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>User Roles</p>
               </div>
               <div>
                  <h4 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>100%</h4>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Cloud Integrated</p>
               </div>
               <div>
                  <h4 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>24/7</h4>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Real-time Access</p>
               </div>
            </div>
         </div>
      </div>

      {/* Right side: Login Form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", backgroundColor: "var(--surface)", borderLeft: "1px solid var(--border)" }}>
        <div className="glass-card animate-fade-in" style={{ width: "100%", maxWidth: "440px", padding: "2.5rem", border: "none", boxShadow: "none", background: "transparent" }}>
          
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "16px", backgroundColor: "rgba(59,130,246,0.1)", marginBottom: "1.5rem" }}>
              <LogIn size={32} style={{ color: "var(--primary)" }} />
            </div>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>Welcome Back</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Sign in to access your dashboard</p>
          </div>

          {error && (
            <div className="animate-fade-in" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--danger)", padding: "1rem", borderRadius: "8px", fontSize: "0.9rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.2rem" }}>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Account Type</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {["STUDENT", "TEACHER", "PARENT", "ADMIN"].map(r => (
                  <button 
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    style={{ 
                      padding: "0.75rem", 
                      borderRadius: "8px", 
                      border: "1px solid var(--border)", 
                      backgroundColor: role === r ? "rgba(59,130,246,0.1)" : "var(--bg-dark)",
                      color: role === r ? "var(--primary)" : "var(--text-muted)",
                      fontWeight: role === r ? 600 : 500,
                      transition: "all 0.2s"
                    }}
                  >
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>User ID or Name</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. 1 or System Admin" 
                value={id} 
                onChange={(e) => setId(e.target.value)} 
                style={{ padding: "0.85rem 1rem", fontSize: "1rem" }}
              />
            </div>

            <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                 <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
                 <a 
                   href="#" 
                   onClick={(e) => {
                     e.preventDefault();
                     setShowForgotModal(true);
                   }}
                   style={{ fontSize: "0.85rem", color: "var(--primary)", textDecoration: "none" }}
                 >
                   Forgot?
                 </a>
              </div>
              <div style={{ position: "relative" }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  style={{ padding: "0.85rem 3.5rem 0.85rem 1rem", fontSize: "1rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    color: "var(--text-muted)",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary animate-fade-in" 
              style={{ padding: "0.85rem", fontSize: "1rem", marginTop: "0.5rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: loading ? 0.7 : 1, animationDelay: "0.4s" }}
              disabled={loading}
            >
              <span style={{ flex: 1, textAlign: "center" }}>{loading ? "Authenticating..." : "Sign In to Dashboard"}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

        </div>
      </div>

      <RecoveryModal 
        isOpen={showForgotModal} 
        onClose={() => setShowForgotModal(false)} 
      />
    </main>
  );
}
