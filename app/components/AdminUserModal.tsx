"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, User, Shield, BookOpen, Users } from "lucide-react";
import Modal from "./Modal";

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingUser: any | null;
}

export default function AdminUserModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingUser 
}: AdminUserModalProps) {
  const [formData, setFormData] = useState({ 
    name: "", 
    password: "", 
    role: "TEACHER", 
    assignedClassId: "", 
    childId: "" 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        setFormData({
          name: editingUser.name,
          password: "",
          role: editingUser.role,
          assignedClassId: editingUser.assignedClassId?.toString() || "",
          childId: editingUser.childId?.toString() || ""
        });
      } else {
        setFormData({ name: "", password: "", role: "TEACHER", assignedClassId: "", childId: "" });
      }
      setErrorMsg("");
    }
  }, [isOpen, editingUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Role-specific validation
    if (formData.role === "PARENT" && !formData.childId) {
      setErrorMsg("Please provide the Child's Student ID.");
      return;
    }
    if (formData.role === "TEACHER" && !formData.assignedClassId) {
      setErrorMsg("Please provide the Assigned Class ID.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = editingUser !== null;
      const bodyData = isEdit ? { ...formData, id: editingUser.id } : formData;

      const res = await fetch("/api/admin/users", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to save user.");
      }
    } catch {
      setErrorMsg("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <>
      <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </button>
      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : editingUser ? "Update Account" : "Create Account"}
      </button>
    </>
  );

  const getIcon = () => {
    if (formData.role === "ADMIN") return <Shield size={20} />;
    if (formData.role === "TEACHER") return <BookOpen size={20} />;
    return <Users size={20} />;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingUser ? "Edit User Record" : "Create New User"}
      subtitle={editingUser ? `Updating details for ${editingUser.name}` : "Set up a new staff or parent account"}
      icon={editingUser ? <User size={20} /> : <UserPlus size={20} />}
      onSubmit={handleSubmit}
      footer={footer}
      maxWidth="450px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ padding: "0.75rem", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
           <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
             {getIcon()} Role Management
           </div>
           <span className={`badge ${formData.role === 'ADMIN' ? 'badge-blue' : formData.role === 'TEACHER' ? 'badge-purple' : 'badge-warning'}`}>
             {formData.role} Locked
           </span>
        </div>

        <div>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Full Name</label>
          <input 
            required 
            className="form-input"
            placeholder="Jane Doe" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
        </div>

        <div>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>
            {editingUser ? "New Password (Optional)" : "Initial Password"}
          </label>
          <input 
            type="password" 
            className="form-input"
            placeholder="Pass123!" 
            value={formData.password} 
            onChange={e => setFormData({...formData, password: e.target.value})} 
            {...(!editingUser ? { required: true } : {})} 
          />
        </div>

        {formData.role === "TEACHER" && (
          <div>
            <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Assigned Class ID</label>
            <input 
              type="number" 
              className="form-input"
              placeholder="e.g. 1" 
              value={formData.assignedClassId} 
              onChange={e => setFormData({...formData, assignedClassId: e.target.value})} 
            />
          </div>
        )}

        {formData.role === "PARENT" && (
          <div>
            <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Child's Student ID (Roll #)</label>
            <input 
              type="number" 
              required 
              className="form-input"
              placeholder="e.g. 101" 
              value={formData.childId} 
              onChange={e => setFormData({...formData, childId: e.target.value})} 
            />
          </div>
        )}

        {errorMsg && (
          <div style={{ color: "var(--danger)", fontSize: "0.85rem", textAlign: "center", padding: "0.85rem", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
            {errorMsg}
          </div>
        )}
      </div>
    </Modal>
  );
}
