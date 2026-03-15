import React, { useState, useEffect } from 'react';
import { Save, BookOpen, AlertCircle } from 'lucide-react';
import Modal from './Modal';

export default function AssignmentModal({ 
  isOpen, 
  onClose, 
  user, 
  subjects, 
  existingAssignment = null,
  onSaveSuccess
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  user: any, 
  subjects: any[],
  existingAssignment?: any,
  onSaveSuccess: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    classId: user?.assignedClassId || "",
    sectionId: "A",
    description: "",
    dueDate: new Date().toISOString().split('T')[0],
    attachment: "",
    priority: "Normal",
    status: "Active"
  });

  useEffect(() => {
    if (existingAssignment) {
      setFormData({
        title: existingAssignment.Title || "",
        subject: existingAssignment.Subject || "",
        classId: existingAssignment.ClassID || user?.assignedClassId || "",
        sectionId: existingAssignment.SectionID || "A",
        description: existingAssignment.Description || "",
        dueDate: existingAssignment.DueDate || new Date().toISOString().split('T')[0],
        attachment: existingAssignment.Attachment || "",
        priority: existingAssignment.Priority || "Normal",
        status: existingAssignment.Status || "Active"
      });
    } else {
      setFormData({
        title: "",
        subject: "",
        classId: user?.assignedClassId || "",
        sectionId: "A",
        description: "",
        dueDate: new Date().toISOString().split('T')[0],
        attachment: "",
        priority: "Normal",
        status: "Active"
      });
    }
  }, [existingAssignment, isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    if (!formData.title || !formData.subject || !formData.classId || !formData.sectionId || !formData.dueDate || !formData.description) {
      setErrorMsg("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const url = "/api/assignments";
      const method = existingAssignment ? "PATCH" : "POST";
      const payload = {
        id: existingAssignment?.AssignmentID,
        teacherId: user.id.toString(),
        ...formData
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSaveSuccess();
        onClose();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to save assignment.");
      }
    } catch (err) {
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
      <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Save size={18} /> {isSubmitting ? "Saving..." : "Save Assignment"}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingAssignment ? 'Edit Assignment' : 'Create Assignment'}
      subtitle={existingAssignment ? 'Modify details for your class' : 'Assign homework or tasks to your class'}
      icon={<BookOpen size={20} />}
      onSubmit={handleSubmit}
      footer={footer}
      maxWidth="700px"
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="form-label" style={{ marginBottom: "0.25rem", display: "block" }}>Assignment Title *</label>
          <input required className="form-input" placeholder="e.g. Algebra Chapter 5" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ padding: "0.6rem", margin: 0 }} />
        </div>
        <div>
          <label className="form-label" style={{ marginBottom: "0.25rem", display: "block" }}>Subject *</label>
          <select required className="form-input" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} style={{ padding: "0.6rem", margin: 0, height: "42px" }}>
            <option value="">-- Choose Subject --</option>
            {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        <div>
           <label className="form-label" style={{ marginBottom: "0.25rem", display: "block" }}>Class</label>
           <input className="form-input" value={`Class ${formData.classId}`} disabled style={{ padding: "0.6rem", margin: 0, opacity: 0.6 }} />
        </div>
        <div>
           <label className="form-label" style={{ marginBottom: "0.25rem", display: "block" }}>Section *</label>
           <select required className="form-input" value={formData.sectionId} onChange={e => setFormData({...formData, sectionId: e.target.value})} style={{ padding: "0.6rem", margin: 0, height: "42px" }}>
              <option value="A">Sec-A</option>
              <option value="B">Sec-B</option>
              <option value="C">Sec-C</option>
           </select>
        </div>
        <div>
           <label className="form-label" style={{ marginBottom: "0.25rem", display: "block" }}>Due Date *</label>
           <input required type="date" className="form-input" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} style={{ padding: "0.6rem", margin: 0, height: "42px" }} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
        <span>Assigned by: <strong>{user?.name} (Read-only)</strong></span>
      </div>

      <div>
        <label className="form-label" style={{ marginBottom: "0.25rem", display: "block" }}>Description / Instructions *</label>
        <textarea required className="form-input" placeholder="Detail the requirements..." rows={5} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ padding: "0.75rem", margin: 0, resize: "vertical", minHeight: "120px" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        <div>
           <label className="form-label" style={{ marginBottom: "0.25rem", display: "block" }}>Priority</label>
           <select required className="form-input" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} style={{ padding: "0.6rem", margin: 0, height: "42px" }}>
              <option value="Normal">Normal</option>
              <option value="Important">Important</option>
              <option value="Urgent">Urgent</option>
           </select>
        </div>
        <div>
           <label className="form-label" style={{ marginBottom: "0.25rem", display: "block" }}>Status</label>
           <select required className="form-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ padding: "0.6rem", margin: 0, height: "42px" }}>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
           </select>
        </div>
        <div>
           <label className="form-label" style={{ marginBottom: "0.25rem", display: "block" }}>Attachment Link (Optional)</label>
           <input className="form-input" placeholder="e.g. Google Drive link" value={formData.attachment} onChange={e => setFormData({...formData, attachment: e.target.value})} style={{ padding: "0.6rem", margin: 0, height: "42px" }} />
        </div>
      </div>

      {errorMsg && (
        <div style={{ color: "var(--danger)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}
    </Modal>
  );
}
