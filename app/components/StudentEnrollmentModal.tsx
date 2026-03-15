"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, User, GraduationCap, Calendar, Phone, Home, CreditCard } from "lucide-react";
import Modal from "./Modal";

interface StudentEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingStudent: any | null;
  classId?: string; // Pre-selected class if any
}

export default function StudentEnrollmentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingStudent,
  classId
}: StudentEnrollmentModalProps) {
  const [formData, setFormData] = useState({ 
    name: "", password: "", classId: "", section: "Sec-A", rollNumber: "",
    fatherName: "", motherName: "", gender: "Male", dob: "", 
    contactNumber: "", parentContactNumber: "", address: "", 
    admissionDate: "", feeStatus: "Paid", category: "Normal", scholarshipGrade: "A",
    totalFee: "0", paidFee: "0", remainingFee: "0"
  });
  const [isCustomSection, setIsCustomSection] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingStudent) {
        const standardSections = ["Sec-A", "Sec-B", "Sec-C"];
        const isCustom = editingStudent.section && !standardSections.includes(editingStudent.section);
        setIsCustomSection(!!isCustom);
        setFormData({
          name: editingStudent.name || "",
          password: "",
          classId: editingStudent.classId?.toString() || "",
          section: editingStudent.section || "Sec-A",
          rollNumber: editingStudent.rollNumber || "",
          fatherName: editingStudent.fatherName || "",
          motherName: editingStudent.motherName || "",
          gender: editingStudent.gender || "Male",
          dob: editingStudent.dob || "",
          contactNumber: editingStudent.contactNumber || "",
          parentContactNumber: editingStudent.parentContactNumber || "",
          address: editingStudent.address || "",
          admissionDate: editingStudent.admissionDate || "",
          feeStatus: editingStudent.feeStatus || "Paid",
          category: editingStudent.category || "Normal",
          scholarshipGrade: editingStudent.scholarshipGrade || "A",
          totalFee: editingStudent.totalFee?.toString() || "0",
          paidFee: editingStudent.paidFee?.toString() || "0",
          remainingFee: editingStudent.remainingFee?.toString() || "0"
        });
      } else {
        setFormData({ 
          name: "", password: "", classId: classId || "", section: "Sec-A", rollNumber: "",
          fatherName: "", motherName: "", gender: "Male", dob: "", 
          contactNumber: "", parentContactNumber: "", address: "", 
          admissionDate: new Date().toISOString().split('T')[0], feeStatus: "Paid", category: "Normal", scholarshipGrade: "A",
          totalFee: "0", paidFee: "0", remainingFee: "0"
        });
        setIsCustomSection(false);
      }
      setFormErrors({});
    }
  }, [isOpen, editingStudent, classId]);

  const validate = () => {
    const errors: Record<string, string> = {};
    const contactPattern = /^[0-9]{11}$/;
    if (!contactPattern.test(formData.contactNumber)) {
      errors.contactNumber = "Must be 11 digits";
    }
    if (!contactPattern.test(formData.parentContactNumber)) {
      errors.parentContactNumber = "Must be 11 digits";
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const isEdit = editingStudent !== null;
      const bodyData = { 
        ...formData, 
        role: "STUDENT",
        id: isEdit ? editingStudent.id : undefined 
      };

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
        alert(data.error || "Failed to save student.");
      }
    } catch {
      alert("Error saving student.");
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
        {isSubmitting ? "Processing..." : editingStudent ? "Update Student File" : "Enroll Student"}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingStudent ? "Edit Student Record" : "Enroll New Student"}
      subtitle={editingStudent ? `Updating academic and personal file for ${editingStudent.name}` : "Enter student details to add them to the system"}
      icon={<GraduationCap size={20} />}
      onSubmit={handleSubmit}
      footer={footer}
      maxWidth="750px"
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Academic & Core */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="form-label" style={{ marginBottom: "0.4rem", display: "block" }}>Roll Number / Reg #</label>
            <input 
              required 
              className="form-input"
              placeholder="e.g. 1042" 
              value={formData.rollNumber} 
              onChange={e => setFormData({...formData, rollNumber: e.target.value})} 
            />
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: "0.4rem", display: "block" }}>Full Name</label>
            <input 
              required 
              className="form-input"
              placeholder="Student Name" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="form-label" style={{ marginBottom: "0.4rem", display: "block" }}>Gender</label>
              <select className="form-input" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: "0.4rem", display: "block" }}>Date of Birth</label>
              <input type="date" className="form-input" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="form-label" style={{ marginBottom: "0.4rem", display: "block" }}>Class ID</label>
              <input readOnly disabled type="number" className="form-input" value={formData.classId} style={{ opacity: 0.6, cursor: "not-allowed" }} />
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: "0.4rem", display: "block" }}>Section</label>
              <select 
                className="form-input"
                value={isCustomSection ? "custom" : formData.section}
                onChange={e => {
                  if (e.target.value === "custom") {
                    setIsCustomSection(true);
                    setFormData({...formData, section: ""});
                  } else {
                    setIsCustomSection(false);
                    setFormData({...formData, section: e.target.value});
                  }
                }}
              >
                <option value="Sec-A">Sec-A</option>
                <option value="Sec-B">Sec-B</option>
                <option value="Sec-C">Sec-C</option>
                <option value="custom">Custom...</option>
              </select>
              {isCustomSection && (
                <input 
                  required
                  className="form-input"
                  placeholder="Specify Section" 
                  value={formData.section} 
                  onChange={e => setFormData({...formData, section: e.target.value})} 
                  style={{ marginTop: "0.5rem" }}
                  autoFocus
                />
              )}
            </div>
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: "0.4rem", display: "block" }}>Admission Date</label>
            <input type="date" className="form-input" value={formData.admissionDate} onChange={e => setFormData({...formData, admissionDate: e.target.value})} />
          </div>

          <div style={{ marginTop: "0.5rem", padding: "1rem", backgroundColor: "rgba(59,130,246,0.03)", borderRadius: "12px", border: "1px dashed rgba(59,130,246,0.2)" }}>
            <h4 style={{ fontSize: "0.85rem", color: "var(--primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CreditCard size={16} /> Financial Status
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label className="form-label" style={{ fontSize: "0.75rem" }}>Total Fee (Rs.)</label>
                <input 
                  type="number" 
                  className="form-input"
                  placeholder="0" 
                  value={formData.totalFee} 
                  onChange={e => {
                    const total = parseFloat(e.target.value) || 0;
                    const paid = parseFloat(formData.paidFee) || 0;
                    setFormData({...formData, totalFee: e.target.value, remainingFee: (total - paid).toString()});
                  }} 
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: "0.75rem" }}>Paid Fee (Rs.)</label>
                <input 
                  type="number" 
                  className="form-input"
                  placeholder="0" 
                  value={formData.paidFee} 
                  onChange={e => {
                    const total = parseFloat(formData.totalFee) || 0;
                    const paid = parseFloat(e.target.value) || 0;
                    setFormData({...formData, paidFee: e.target.value, remainingFee: (total - paid).toString()});
                  }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Family & Contact */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="form-label" style={{ marginBottom: "0.4rem", display: "block" }}>Father's Name</label>
            <input className="form-input" placeholder="Name" value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} />
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: "0.4rem", display: "block" }}>Mother's Name</label>
            <input className="form-input" placeholder="Name" value={formData.motherName} onChange={e => setFormData({...formData, motherName: e.target.value})} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="form-label" style={{ marginBottom: "0.4rem", display: "block" }}>Student Contact</label>
              <input 
                className="form-input"
                placeholder="03001234567" 
                value={formData.contactNumber} 
                onChange={e => setFormData({...formData, contactNumber: e.target.value.replace(/\D/g, '').slice(0, 11)})} 
                style={{ borderColor: formErrors.contactNumber ? "var(--danger)" : "" }}
              />
              {formErrors.contactNumber && <p style={{ color: "var(--danger)", fontSize: "0.7rem", marginTop: "0.2rem" }}>{formErrors.contactNumber}</p>}
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: "0.4rem", display: "block" }}>Parent Contact</label>
              <input 
                className="form-input"
                placeholder="03007654321" 
                value={formData.parentContactNumber} 
                onChange={e => setFormData({...formData, parentContactNumber: e.target.value.replace(/\D/g, '').slice(0, 11)})} 
                style={{ borderColor: formErrors.parentContactNumber ? "var(--danger)" : "" }}
              />
              {formErrors.parentContactNumber && <p style={{ color: "var(--danger)", fontSize: "0.7rem", marginTop: "0.2rem" }}>{formErrors.parentContactNumber}</p>}
            </div>
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: "0.4rem", display: "block" }}>Residential Address</label>
            <input className="form-input" placeholder="Full Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="form-label" style={{ marginBottom: "0.4rem", display: "block" }}>Category</label>
              <select className="form-input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option>Normal</option>
                <option>Army</option>
                <option>Scholarship</option>
              </select>
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: "0.4rem", display: "block" }}>Fee Status</label>
              <select className="form-input" value={formData.feeStatus} onChange={e => setFormData({...formData, feeStatus: e.target.value})}>
                <option>Paid</option>
                <option>Pending</option>
                <option>Overdue</option>
              </select>
            </div>
          </div>
          {formData.category === 'Scholarship' && (
            <div>
              <label className="form-label" style={{ marginBottom: "0.4rem", display: "block" }}>Scholarship Tier</label>
              <select className="form-input" value={formData.scholarshipGrade} onChange={e => setFormData({...formData, scholarshipGrade: e.target.value})}>
                <option value="A">Grade A (90% Off)</option>
                <option value="B">Grade B (50% Off)</option>
              </select>
            </div>
          )}
          <div>
            <label className="form-label" style={{ marginBottom: "0.4rem", display: "block" }}>{editingStudent ? "Reset Password" : "Login Password"}</label>
            <input 
              type="password" 
              className="form-input"
              placeholder="Min. 6 characters" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              {...(!editingStudent ? { required: true } : {})} 
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
