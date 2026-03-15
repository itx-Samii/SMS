import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, FileText, Link as LinkIcon, AlertCircle } from 'lucide-react';
import Modal from './Modal';

export default function SubmitAssignmentModal({ 
  isOpen, 
  onClose, 
  user, 
  assignment,
  onSaveSuccess
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  user: any, 
  assignment: any,
  onSaveSuccess: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    submissionText: "",
    attachment: ""
  });

  useEffect(() => {
    if (assignment?.submissionData) {
      setFormData({
        submissionText: assignment.submissionData.SubmissionText || "",
        attachment: assignment.submissionData.Attachment || ""
      });
    } else {
      setFormData({
        submissionText: "",
        attachment: ""
      });
    }
    setErrorMsg("");
  }, [assignment, isOpen]);

  const isReadOnly = assignment?.submissionStatus === 'Submitted' || assignment?.submissionStatus === 'Graded';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (isReadOnly) return;
    
    if (!formData.submissionText.trim() && !formData.attachment.trim()) {
      setErrorMsg("Please provide an answer or an attachment link.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        assignmentId: assignment.AssignmentID,
        studentId: user.id.toString(),
        submissionText: formData.submissionText,
        attachment: formData.attachment
      };

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSaveSuccess();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to submit assignment.");
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
        Status: <strong style={{ color: assignment.submissionStatus === 'Graded' ? 'var(--success)' : assignment.submissionStatus === 'Submitted' ? 'var(--blue)' : 'var(--warning)' }}>{assignment.submissionStatus}</strong>
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
          {isReadOnly ? "Close" : "Cancel"}
        </button>
        {!isReadOnly && (
          <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UploadCloud size={18} /> {isSubmitting ? "Uploading..." : "Turn In"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReadOnly ? 'View Submission' : assignment.submissionStatus === 'Rejected' ? 'Resubmit Assignment' : 'Submit Assignment'}
      subtitle={`${assignment.Title} (${assignment.Subject})`}
      icon={isReadOnly ? <CheckCircle size={20} /> : <UploadCloud size={20} />}
      onSubmit={handleSubmit}
      footer={footer}
      maxWidth="700px"
    >
      <div style={{ padding: "1rem", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid var(--border)" }}>
        <h4 style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><FileText size={16} /> Teacher's Instructions</h4>
        <p style={{ fontSize: "0.95rem", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{assignment.Description}</p>
        
        {assignment.Attachment && (
           <a href={assignment.Attachment} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem", fontSize: "0.9rem", color: "var(--primary)", textDecoration: "underline" }}>
             <LinkIcon size={16} /> Open Attached Material
           </a>
        )}
      </div>

      {assignment.submissionStatus === 'Rejected' && (
        <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: "8px", border: "1px solid var(--danger)", color: "var(--danger)", display: "flex", gap: "0.5rem" }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: "0.9rem" }}>
            <strong>Needs Revision:</strong> Your previous submission was rejected. Please review the instructions and submit again.
          </div>
        </div>
      )}

      <div>
        <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Your Answer</label>
        <textarea 
          className="form-input" 
          placeholder={isReadOnly ? "No text provided" : "Type your answer here..."} 
          rows={6} 
          value={formData.submissionText} 
          onChange={e => setFormData({...formData, submissionText: e.target.value})} 
          disabled={isReadOnly}
          style={{ padding: "0.75rem", margin: 0, resize: "vertical", minHeight: "150px", opacity: isReadOnly ? 0.8 : 1 }} 
        />
      </div>

      <div>
        <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Attachment Link (Optional)</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
           <div style={{ display: "flex", alignItems: "center", padding: "0 1rem", backgroundColor: "var(--border)", borderTopLeftRadius: "8px", borderBottomLeftRadius: "8px" }}>
             <LinkIcon size={18} style={{ color: "var(--text-main)" }} />
           </div>
           <input 
             type="url"
             className="form-input" 
             placeholder={isReadOnly ? "No attachment link provided" : "e.g. Google Drive / DropBox link"} 
             value={formData.attachment} 
             onChange={e => setFormData({...formData, attachment: e.target.value})} 
             disabled={isReadOnly}
             style={{ padding: "0.6rem", margin: 0, height: "45px", flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0, opacity: isReadOnly ? 0.8 : 1 }} 
           />
        </div>
        {isReadOnly && formData.attachment && (
           <div style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
             <a href={formData.attachment} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "underline" }}>Open Submitted File</a>
           </div>
        )}
      </div>

      {errorMsg && (
        <div style={{ color: "var(--danger)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}
    </Modal>
  );
}
