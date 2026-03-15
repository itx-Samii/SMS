"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, ShieldCheck, ArrowLeft, Send } from "lucide-react";
import Modal from "./Modal";

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RecoveryModal({ isOpen, onClose }: RecoveryModalProps) {
  const [step, setStep] = useState(1); // 1: Verify, 2: Reset
  const [formData, setFormData] = useState({
    role: "STUDENT",
    identifier: "",
    contactNumber: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [verifiedUserId, setVerifiedUserId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        role: "STUDENT",
        identifier: "",
        contactNumber: "",
        newPassword: "",
        confirmPassword: ""
      });
      setError("");
      setSuccess("");
      setVerifiedUserId(null);
    }
  }, [isOpen]);

  const handleVerifyAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: formData.role,
          identifier: formData.identifier,
          contactNumber: formData.contactNumber
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      
      setVerifiedUserId(data.userId);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: verifiedUserId,
          newPassword: formData.newPassword
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      
      setSuccess(data.message);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <>
      <button 
        type="button" 
        className="btn-secondary" 
        onClick={step === 2 ? () => setStep(1) : onClose} 
        disabled={loading}
      >
        {step === 2 ? "Back" : "Cancel"}
      </button>
      <button 
        type="submit" 
        className="btn-primary" 
        disabled={loading} 
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        {loading ? (step === 1 ? "Verifying..." : "Resetting...") : (
          step === 1 ? <><ShieldCheck size={18} /> Verify Account</> : <><KeyRound size={18} /> Update Password</>
        )}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Password Recovery"
      subtitle={step === 1 ? "Verify your account details to continue" : "Set a new secure password for your account"}
      icon={step === 1 ? <ShieldCheck size={20} /> : <KeyRound size={20} />}
      onSubmit={step === 1 ? handleVerifyAccount : handleResetPassword}
      footer={footer}
      maxWidth="440px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {error && (
          <div className="animate-fade-in" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--danger)", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem" }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="animate-fade-in" style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", color: "var(--success)", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem" }}>
            ✅ {success}
          </div>
        )}

        {step === 1 ? (
          <>
            <div>
              <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Account Type</label>
              <select 
                className="form-input"
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="PARENT">Parent</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>User ID or Roll #</label>
              <input 
                required 
                className="form-input"
                placeholder="e.g. 1 or 1042" 
                value={formData.identifier} 
                onChange={e => setFormData({...formData, identifier: e.target.value})}
              />
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Registered Contact</label>
              <input 
                required 
                className="form-input"
                placeholder="e.g. 03001234567" 
                value={formData.contactNumber} 
                onChange={e => setFormData({...formData, contactNumber: e.target.value})}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>New Password</label>
              <input 
                type="password"
                required 
                className="form-input"
                placeholder="Min. 6 characters" 
                value={formData.newPassword} 
                onChange={e => setFormData({...formData, newPassword: e.target.value})}
              />
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Confirm New Password</label>
              <input 
                type="password"
                required 
                className="form-input"
                placeholder="Repeat password" 
                value={formData.confirmPassword} 
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
