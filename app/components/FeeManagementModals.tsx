"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, Layers, Plus, Save } from "lucide-react";
import Modal from "./Modal";

interface FeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingFee: any | null;
  students: any[];
  classes: any[];
}

export function SingleFeeModal({ isOpen, onClose, onSuccess, editingFee, students, classes }: FeeModalProps) {
  const [formData, setFormData] = useState({ 
    studentId: "", classId: "", sectionId: "", month: "", year: "2026", 
    originalFee: "", discount: "0", finalFee: "", paidFee: "", status: "Pending", remarks: "" 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (editingFee) {
        setFormData({
          studentId: editingFee.studentId.toString(),
          classId: editingFee.classId.toString(),
          sectionId: editingFee.sectionId,
          month: editingFee.month,
          year: editingFee.year || "2026",
          originalFee: editingFee.originalFee?.toString() || editingFee.totalFee?.toString() || "",
          discount: editingFee.discount?.toString() || "0",
          finalFee: editingFee.finalFee?.toString() || editingFee.totalFee?.toString() || "",
          paidFee: editingFee.paidFee.toString(),
          status: editingFee.status,
          remarks: editingFee.remarks || ""
        });
        setSearchTerm("");
      } else {
        setFormData({ 
          studentId: "", classId: "", sectionId: "", month: "", year: "2026", 
          originalFee: "", discount: "0", finalFee: "", paidFee: "", status: "Pending", remarks: "" 
        });
        setSearchTerm("");
      }
    }
  }, [isOpen, editingFee]);

  const handleSelectStudent = (s: any) => {
    setFormData({
      ...formData,
      studentId: s.id.toString(),
      classId: s.classId?.toString() || "",
      sectionId: s.section || ""
    });
    setSearchTerm(`${s.name} (Roll: ${s.rollNumber})`);
  };

  const filteredStudents = searchTerm && !formData.studentId ? students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const isEdit = editingFee !== null;
      const res = await fetch("/api/admin/fees", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { ...formData, id: editingFee.id } : { ...formData, mode: 'single' })
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Failed to save fee record.");
      }
    } catch {
      alert("Error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <>
      <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : <><Save size={18} /> {editingFee ? "Update Record" : "Create Record"}</>}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingFee ? "Edit Fee Record" : "Add Individual Fee"}
      subtitle="Record a manual fee entry for a specific student"
      icon={<DollarSign size={20} />}
      onSubmit={handleSubmit}
      footer={footer}
      maxWidth="500px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ position: "relative" }}>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Student Search</label>
          <input 
            required 
            className="form-input"
            placeholder="Type name or roll number..." 
            value={searchTerm} 
            onChange={e => {
              setSearchTerm(e.target.value);
              if (formData.studentId) setFormData({...formData, studentId: ""});
            }} 
          />
          {filteredStudents.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", zIndex: 10, marginTop: "0.25rem", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)" }}>
              {filteredStudents.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => handleSelectStudent(s)}
                  style={{ padding: "0.75rem", cursor: "pointer", borderBottom: "1px solid var(--border)", fontSize: "0.9rem" }}
                  className="hover:bg-blue-500/10"
                >
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Roll: {s.rollNumber} | Class ID: {s.classId}</div>
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label className="form-label">Original Fee (Rs.)</label>
            <input className="form-input" required type="number" value={formData.originalFee} onChange={e => setFormData({...formData, originalFee: e.target.value})} />
          </div>
          <div>
            <label className="form-label">Discount (Rs.)</label>
            <input className="form-input" type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label className="form-label">Paid Amount (Rs.)</label>
            <input className="form-input" required type="number" value={formData.paidFee} onChange={e => setFormData({...formData, paidFee: e.target.value})} />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}

interface BulkFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classes: any[];
}

export function BulkFeeModal({ isOpen, onClose, onSuccess, classes }: BulkFeeModalProps) {
  const [formData, setFormData] = useState({ classId: "", sectionId: "", month: "", year: "2026", originalFee: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ classId: "", sectionId: "", month: "", year: "2026", originalFee: "" });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, mode: 'bulk' })
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Failed to generate bulk fees.");
      }
    } catch {
      alert("Error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <>
      <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? "Generating..." : <><Layers size={18} /> Generate Records</>}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Monthly Fees"
      subtitle="Bulk create fee records for an entire class and section"
      icon={<Layers size={20} />}
      onSubmit={handleSubmit}
      footer={footer}
      maxWidth="450px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label className="form-label">Class</label>
            <select className="form-input" required value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})}>
              <option value="">-- Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Section</label>
            <select className="form-input" value={formData.sectionId} onChange={e => setFormData({...formData, sectionId: e.target.value})}>
              <option value="">-- All/None (Default) --</option>
              <option>Sec-A</option><option>Sec-B</option><option>Sec-C</option>
            </select>
          </div>
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
          <label className="form-label">Monthly Tuition Fee (Original Rs.)</label>
          <input className="form-input" required type="number" placeholder="5000" value={formData.originalFee} onChange={e => setFormData({...formData, originalFee: e.target.value})} />
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
            * Army students and scholarship holders will automatically get pre-defined discounts.
          </p>
        </div>
      </div>
    </Modal>
  );
}
