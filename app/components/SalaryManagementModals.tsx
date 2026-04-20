"use client";

import React, { useState, useEffect } from "react";
import { Wallet, Save } from "lucide-react";
import Modal from "./Modal";

interface SalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingSalary: any | null;
  teachers: any[];
}

export function SingleSalaryModal({ isOpen, onClose, onSuccess, editingSalary, teachers }: SalaryModalProps) {
  const [formData, setFormData] = useState({ 
    teacherId: "", month: "", year: "2026", 
    baseSalary: "", bonus: "0", deductions: "0", status: "Pending", remarks: "" 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Calculate Net Salary on the fly for preview
  const base = parseFloat(formData.baseSalary) || 0;
  const bon = parseFloat(formData.bonus) || 0;
  const ded = parseFloat(formData.deductions) || 0;
  const computedNet = base + bon - ded;

  useEffect(() => {
    if (isOpen) {
      if (editingSalary) {
        setFormData({
          teacherId: editingSalary.teacherId?.toString() || "",
          month: editingSalary.month || "",
          year: editingSalary.year?.toString() || "2026",
          baseSalary: editingSalary.baseSalary?.toString() || "",
          bonus: editingSalary.bonus?.toString() || "0",
          deductions: editingSalary.deductions?.toString() || "0",
          status: editingSalary.status || "Pending",
          remarks: editingSalary.remarks || ""
        });
        const teacher = teachers.find(t => t.id === editingSalary.teacherId);
        setSearchTerm(teacher ? teacher.name : "");
      } else {
        setFormData({ 
          teacherId: "", month: "", year: "2026", 
          baseSalary: "", bonus: "0", deductions: "0", status: "Pending", remarks: "" 
        });
        setSearchTerm("");
      }
    }
  }, [isOpen, editingSalary, teachers]);

  const handleSelectTeacher = (t: any) => {
    setFormData({ ...formData, teacherId: t.id.toString() });
    setSearchTerm(t.name);
  };

  const filteredTeachers = searchTerm && !formData.teacherId 
    ? teachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5) 
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacherId) {
      alert("Please select a valid Teacher from the search list.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const isEdit = editingSalary !== null;
      const res = await fetch("/api/admin/salaries", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { ...formData, id: editingSalary.id } : formData)
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to save salary record.");
      }
    } catch {
      alert("Error saving record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <>
      <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : <><Save size={18} /> {editingSalary ? "Update Salary Data" : "Generate Record"}</>}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSalary ? "Edit Salary Record" : "Issue Staff Salary"}
      subtitle="Manage monthly compensation for teaching staff"
      icon={<Wallet size={20} />}
      onSubmit={handleSubmit}
      footer={footer}
      maxWidth="500px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Teacher Search Autocomplete */}
        <div style={{ position: "relative" }}>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Staff/Teacher Search</label>
          <input 
            required 
            className="form-input"
            placeholder="Type teacher name..." 
            value={searchTerm} 
            onChange={e => {
              setSearchTerm(e.target.value);
              if (formData.teacherId) setFormData({...formData, teacherId: ""}); // Reset specific selection if they start typing again
            }} 
          />
          {filteredTeachers.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", zIndex: 10, marginTop: "0.25rem", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)", overflow: "hidden" }}>
              {filteredTeachers.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => handleSelectTeacher(t)}
                  style={{ padding: "0.75rem", cursor: "pointer", borderBottom: "1px solid var(--border)", fontSize: "0.9rem" }}
                  className="hover:bg-blue-500/10"
                >
                  <div style={{ fontWeight: 600 }}>{t.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ID: {t.id} | Role: {t.role}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label className="form-label">Month</label>
            <select className="form-input" required value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})}>
              <option value="">-- Month --</option>
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Year</label>
            <input className="form-input" required type="number" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} />
          </div>
        </div>

        <div>
           <label className="form-label">Base Salary (Rs.)</label>
           <input className="form-input" required type="number" placeholder="e.g. 45000" value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: e.target.value})} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label className="form-label">Bonus (+)</label>
            <input className="form-input" type="number" value={formData.bonus} onChange={e => setFormData({...formData, bonus: e.target.value})} />
          </div>
          <div>
            <label className="form-label">Deductions (-)</label>
            <input className="form-input" type="number" value={formData.deductions} onChange={e => setFormData({...formData, deductions: e.target.value})} />
          </div>
        </div>
        
        {/* Real-time Net Evaluation */}
        <div style={{ padding: "1rem", backgroundColor: "rgba(0,0,0,0.1)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
           <span style={{ fontWeight: 500, color: "var(--text-muted)" }}>Total Net Output:</span>
           <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--primary)" }}>Rs. {computedNet}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label className="form-label">Internal Remarks</label>
            <input className="form-input" value={formData.remarks} placeholder="Optional" onChange={e => setFormData({...formData, remarks: e.target.value})} />
          </div>
          <div>
            <label className="form-label">Clearance Status</label>
            <select className="form-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="Paid">Cleared / Paid</option>
              <option value="Pending">Pending Validation</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}
