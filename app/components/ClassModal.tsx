"use client";

import React, { useState, useEffect } from "react";
import { Presentation, Save } from "lucide-react";
import Modal from "./Modal";

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teachers: any[];
}

export default function ClassModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  teachers 
}: ClassModalProps) {
  const [formData, setFormData] = useState({ name: "", teacherId: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: "", teacherId: "" });
      setErrorMsg("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to create class.");
      }
    } catch {
      setErrorMsg("Error creating class.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <>
      <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </button>
      <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {isSubmitting ? "Creating..." : <><Save size={18} /> Create Class Instance</>}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Class"
      subtitle="Register a new academic grade or section in the system"
      icon={<Presentation size={20} />}
      onSubmit={handleSubmit}
      footer={footer}
      maxWidth="450px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Class & Section Name</label>
          <input 
            required 
            className="form-input"
            placeholder="e.g. Class 10 - Section A" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
        </div>

        <div>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Assign a Lead Teacher (Optional)</label>
          <select 
            className="form-input"
            value={formData.teacherId} 
            onChange={e => setFormData({...formData, teacherId: e.target.value})}
          >
            <option value="">-- No Primary Teacher --</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>#{t.id} - {t.name}</option>
            ))}
          </select>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
            The lead teacher will have primary management rights for this class.
          </p>
        </div>

        {errorMsg && (
          <div style={{ color: "var(--danger)", fontSize: "0.85rem", textAlign: "center", padding: "0.5rem", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
            {errorMsg}
          </div>
        )}
      </div>
    </Modal>
  );
}
